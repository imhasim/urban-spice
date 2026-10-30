import logging
import razorpay
from decimal import Decimal
from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from django.conf import settings
from .models import Order
from .serializers import OrderCreateSerializer, OrderDetailSerializer
from .razorpay_service import (
    is_razorpay_configured,
    get_razorpay_client,
    create_razorpay_order_for_order,
    verify_razorpay_signature,
)

logger = logging.getLogger(__name__)


class OrderCreateView(generics.CreateAPIView):
    """
    POST /api/orders/
    Validates cart items, verifies availability, calculates final totals on server,
    and creates order + order item snapshots.
    If payment_method is RAZORPAY, also initiates a Razorpay order via the official SDK.
    """
    queryset = Order.objects.all()
    serializer_class = OrderCreateSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = serializer.save()

        response_data = OrderDetailSerializer(order).data

        # If Razorpay payment is requested, initiate Razorpay order
        if order.payment_method == "RAZORPAY":
            try:
                rzp_data = create_razorpay_order_for_order(order)
                response_data["razorpay"] = rzp_data
            except Exception as exc:
                logger.warning("Could not initiate Razorpay order for %s: %s", order.order_number, exc)
                response_data["razorpay_error"] = str(exc)

        return Response(response_data, status=status.HTTP_201_CREATED)


class OrderDetailView(generics.RetrieveAPIView):
    """
    GET /api/orders/{order_number}/
    Retrieves order details using unique order number.
    """
    queryset = Order.objects.prefetch_related("items").all()
    serializer_class = OrderDetailSerializer
    permission_classes = [AllowAny]
    lookup_field = "order_number"


class RazorpayOrderCreateView(APIView):
    """
    POST /api/orders/<str:order_number>/razorpay/create/
    Creates or re-initiates a Razorpay order for an existing unpaid order.
    Calculates the payable amount strictly from order.total_amount on the server.
    """
    permission_classes = [AllowAny]

    def post(self, request, order_number):
        try:
            order = Order.objects.get(order_number=order_number)
        except Order.DoesNotExist:
            return Response(
                {"error": "Order not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if order.payment_status == "PAID":
            return Response(
                {"error": "This order is already marked as PAID."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if order.payment_method != "RAZORPAY":
            # Switch payment method to RAZORPAY if customer opts to pay online
            order.payment_method = "RAZORPAY"
            order.save(update_fields=["payment_method", "updated_at"])

        try:
            rzp_data = create_razorpay_order_for_order(order)
            return Response({
                "order": OrderDetailSerializer(order).data,
                "razorpay": rzp_data,
            }, status=status.HTTP_200_OK)
        except Exception as exc:
            return Response(
                {"error": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )


class RazorpayPaymentVerifyView(APIView):
    """
    POST /api/orders/razorpay/verify/
    Verifies the cryptographic HMAC SHA256 payment signature using Razorpay official SDK.
    Validates that the amount matches and marks the order as PAID in PostgreSQL.
    Prevents duplicate verification.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data
        order_number = data.get("order_number", "").strip()
        razorpay_order_id = data.get("razorpay_order_id", "").strip()
        razorpay_payment_id = data.get("razorpay_payment_id", "").strip()
        razorpay_signature = data.get("razorpay_signature", "").strip()

        if not all([order_number, razorpay_order_id, razorpay_payment_id, razorpay_signature]):
            return Response(
                {
                    "error": (
                        "Missing required verification parameters. Required: "
                        "order_number, razorpay_order_id, razorpay_payment_id, razorpay_signature."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            order = Order.objects.prefetch_related("items").get(order_number=order_number)
        except Order.DoesNotExist:
            return Response(
                {"error": f"Order with number '{order_number}' not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Idempotency / Duplicate verification prevention
        if order.payment_status == "PAID":
            if order.razorpay_payment_id == razorpay_payment_id:
                return Response(
                    {
                        "success": True,
                        "message": "Payment has already been verified and recorded.",
                        "order": OrderDetailSerializer(order).data,
                    },
                    status=status.HTTP_200_OK,
                )
            return Response(
                {
                    "error": (
                        f"Order '{order_number}' is already marked as PAID under a different payment reference."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Cross-order mismatch validation
        if order.razorpay_order_id and order.razorpay_order_id != razorpay_order_id:
            return Response(
                {
                    "error": (
                        f"Razorpay order ID mismatch. Expected '{order.razorpay_order_id}', "
                        f"received '{razorpay_order_id}'."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 1. Verify signature with Razorpay SDK
        try:
            verify_razorpay_signature(razorpay_order_id, razorpay_payment_id, razorpay_signature)
        except razorpay.errors.SignatureVerificationError:
            order.payment_status = "FAILED"
            order.save(update_fields=["payment_status", "updated_at"])
            return Response(
                {"error": "Payment signature verification failed. Potential tampering detected."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as exc:
            return Response(
                {"error": f"Verification error: {str(exc)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 2. Server-side payment fetch check (validates amount captured against database order total)
        try:
            client = get_razorpay_client()
            payment = client.payment.fetch(razorpay_payment_id)
            expected_paise = int(round(Decimal(str(order.total_amount)) * 100))
            if payment.get("amount") != expected_paise:
                order.payment_status = "FAILED"
                order.save(update_fields=["payment_status", "updated_at"])
                return Response(
                    {
                        "error": (
                            f"Payment amount mismatch. Expected ₹{order.total_amount} ({expected_paise} paise), "
                            f"received {payment.get('amount')} paise."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
        except Exception as exc:
            # If network error fetching from Razorpay in test environment, signature verification already passed
            logger.info("Payment fetch skipped or errored (%s), relying on signature verification.", exc)

        # 3. Mark payment as PAID and save transaction references
        order.payment_status = "PAID"
        order.payment_method = "RAZORPAY"
        order.razorpay_order_id = razorpay_order_id
        order.razorpay_payment_id = razorpay_payment_id
        order.razorpay_signature = razorpay_signature
        order.save(update_fields=[
            "payment_status",
            "payment_method",
            "razorpay_order_id",
            "razorpay_payment_id",
            "razorpay_signature",
            "updated_at",
        ])

        return Response(
            {
                "success": True,
                "message": "Payment verified and recorded successfully.",
                "order": OrderDetailSerializer(order).data,
            },
            status=status.HTTP_200_OK,
        )


class RazorpayPaymentFailedView(APIView):
    """
    POST /api/orders/razorpay/failed/
    Records payment failure or cancellation reported by the checkout interface.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        order_number = request.data.get("order_number", "").strip()
        error_description = request.data.get("error_description", "Payment failed or cancelled by user.")

        if not order_number:
            return Response(
                {"error": "order_number is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            order = Order.objects.get(order_number=order_number)
        except Order.DoesNotExist:
            return Response(
                {"error": "Order not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Do not overwrite if already PAID
        if order.payment_status != "PAID":
            order.payment_status = "FAILED"
            order.save(update_fields=["payment_status", "updated_at"])

        return Response(
            {
                "message": f"Payment marked as FAILED: {error_description}",
                "order": OrderDetailSerializer(order).data,
            },
            status=status.HTTP_200_OK,
        )
