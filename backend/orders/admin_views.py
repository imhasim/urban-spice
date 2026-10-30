from decimal import Decimal
from django.contrib.auth import authenticate
from django.db.models import Q, Sum
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Order
from .serializers import OrderDetailSerializer

# Transition maps based on PRD Section 12 & Phase 5 specifications
VALID_TRANSITIONS = {
    "DELIVERY": {
        "PLACED": ["CONFIRMED", "CANCELLED"],
        "CONFIRMED": ["PREPARING", "CANCELLED"],
        "PREPARING": ["READY", "OUT_FOR_DELIVERY", "CANCELLED"],
        "READY": ["OUT_FOR_DELIVERY", "COMPLETED", "CANCELLED"],
        "OUT_FOR_DELIVERY": ["COMPLETED", "CANCELLED"],
        "COMPLETED": [],
        "CANCELLED": [],
    },
    "PICKUP": {
        "PLACED": ["CONFIRMED", "CANCELLED"],
        "CONFIRMED": ["PREPARING", "CANCELLED"],
        "PREPARING": ["READY", "CANCELLED"],
        "READY": ["COMPLETED", "CANCELLED"],
        "COMPLETED": [],
        "CANCELLED": [],
    },
    "DINE_IN": {
        "PLACED": ["CONFIRMED", "CANCELLED"],
        "CONFIRMED": ["PREPARING", "CANCELLED"],
        "PREPARING": ["READY", "CANCELLED"],
        "READY": ["COMPLETED", "CANCELLED"],
        "COMPLETED": [],
        "CANCELLED": [],
    },
}


class StaffLoginView(APIView):
    """
    POST /api/admin/login/
    Authenticates staff credentials and returns auth token.
    Publicly accessible endpoint, but strictly checks is_staff flag.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("username", "").strip()
        password = request.data.get("password", "").strip()

        if not username or not password:
            return Response(
                {"error": "Please provide both username and password."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = authenticate(username=username, password=password)
        if user is None:
            return Response(
                {"error": "Invalid username or password."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not user.is_staff:
            return Response(
                {"error": "Access denied. Only authorized restaurant staff may log in."},
                status=status.HTTP_403_FORBIDDEN,
            )

        token, _ = Token.objects.get_or_create(user=user)

        return Response({
            "token": token.key,
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "is_staff": user.is_staff,
                "is_superuser": user.is_superuser,
            },
        })


class StaffDashboardSummaryView(APIView):
    """
    GET /api/admin/dashboard/
    Returns key operational metrics for restaurant staff.
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        today = timezone.now().date()
        today_orders = Order.objects.filter(created_at__date=today)

        total_orders_count = Order.objects.count()
        today_orders_count = today_orders.count()
        awaiting_confirmation = Order.objects.filter(order_status="PLACED").count()
        active_kitchen = Order.objects.filter(order_status__in=["CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY"]).count()
        completed_count = Order.objects.filter(order_status="COMPLETED").count()

        gross_sales = (
            Order.objects.exclude(order_status="CANCELLED")
            .aggregate(total=Sum("total_amount"))["total"]
            or Decimal("0.00")
        )

        recent_orders = Order.objects.prefetch_related("items").all()[:6]

        return Response({
            "metrics": {
                "total_orders": total_orders_count,
                "today_orders": today_orders_count,
                "awaiting_confirmation": awaiting_confirmation,
                "active_kitchen": active_kitchen,
                "completed_count": completed_count,
                "gross_sales": str(gross_sales),
            },
            "recent_orders": OrderDetailSerializer(recent_orders, many=True).data,
        })


class StaffOrderListView(generics.ListAPIView):
    """
    GET /api/admin/orders/
    Protected endpoint to list, filter, and search customer orders.
    Enforces IsAdminUser (user.is_staff).
    """
    serializer_class = OrderDetailSerializer
    permission_classes = [IsAdminUser]
    pagination_class = None

    def get_queryset(self):
        queryset = Order.objects.prefetch_related("items").all()

        # Status filter
        status_param = self.request.query_params.get("status")
        if status_param and status_param.upper() != "ALL":
            queryset = queryset.filter(order_status=status_param.upper())

        # Type filter
        type_param = self.request.query_params.get("type")
        if type_param and type_param.upper() != "ALL":
            queryset = queryset.filter(order_type=type_param.upper())

        # Search filter (order_number, customer_name, customer_phone)
        search_query = self.request.query_params.get("search")
        if search_query:
            query = search_query.strip()
            queryset = queryset.filter(
                Q(order_number__icontains=query)
                | Q(customer_name__icontains=query)
                | Q(customer_phone__icontains=query)
            )

        return queryset


class StaffOrderDetailView(generics.RetrieveAPIView):
    """
    GET /api/admin/orders/<int:pk>/
    Retrieves full details of a single order.
    """
    queryset = Order.objects.prefetch_related("items").all()
    serializer_class = OrderDetailSerializer
    permission_classes = [IsAdminUser]
    lookup_field = "pk"


class StaffOrderStatusUpdateView(APIView):
    """
    PATCH /api/admin/orders/<int:pk>/status/
    Updates the status of an order ensuring valid workflow transitions.
    DOES NOT modify payment status.
    """
    permission_classes = [IsAdminUser]

    def patch(self, request, pk):
        try:
            order = Order.objects.prefetch_related("items").get(pk=pk)
        except Order.DoesNotExist:
            return Response(
                {"error": "Order not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        new_status = request.data.get("order_status", "").strip().upper()
        if not new_status:
            return Response(
                {"error": "order_status is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        allowed_map = VALID_TRANSITIONS.get(order.order_type, {})
        allowed_next_states = allowed_map.get(order.order_status, [])

        if new_status not in allowed_next_states:
            allowed_display = ", ".join(allowed_next_states) if allowed_next_states else "None (Order is in final state)"
            return Response(
                {
                    "error": (
                        f"Invalid transition from '{order.order_status}' to '{new_status}' "
                        f"for order type '{order.get_order_type_display()}'. "
                        f"Permitted next states: [{allowed_display}]."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Update order status only; payment_status remains untouched
        order.order_status = new_status
        order.save(update_fields=["order_status", "updated_at"])

        return Response(OrderDetailSerializer(order).data, status=status.HTTP_200_OK)


# In-person payment methods eligible for manual staff payment settlement
MANUAL_PAYMENT_METHODS = {"COD", "PAY_AT_PICKUP", "PAY_AT_RESTAURANT"}


class StaffOrderPaymentUpdateView(APIView):
    """
    PATCH or POST /api/admin/orders/<int:pk>/payment/
    Updates the payment status of an in-person order (COD, PAY_AT_PICKUP, PAY_AT_RESTAURANT)
    to PAID when physical payment has been received.
    Enforces staff authentication and permissions (IsAdminUser).
    Guarantees order_status and payment_status remain separate.
    Disallows manual payment updates for online Razorpay orders.
    """
    permission_classes = [IsAdminUser]

    def patch(self, request, pk):
        return self._mark_paid(request, pk)

    def post(self, request, pk):
        return self._mark_paid(request, pk)

    def _mark_paid(self, request, pk):
        try:
            order = Order.objects.prefetch_related("items").get(pk=pk)
        except Order.DoesNotExist:
            return Response(
                {"error": "Order not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # 1. Do not allow staff to manually mark Razorpay orders as paid
        if order.payment_method == "RAZORPAY":
            return Response(
                {
                    "error": (
                        "Online payments (Razorpay) cannot be manually marked as paid. "
                        "They must be verified automatically via server-side payment verification."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 2. Check if the payment method is an allowed in-person method
        if order.payment_method not in MANUAL_PAYMENT_METHODS:
            return Response(
                {
                    "error": (
                        f"Manual payment updates are not permitted for payment method '{order.get_payment_method_display()}'."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 3. Validate current payment status and prevent duplicate or invalid updates
        if order.payment_status == "PAID":
            return Response(
                {"error": "Order is already marked as PAID. Duplicate payment updates are not permitted."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if order.payment_status in ["REFUNDED", "CANCELLED"]:
            return Response(
                {
                    "error": (
                        f"Cannot mark order as paid because current payment status is '{order.get_payment_status_display()}'."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 4. If payment_status is specified in request payload, ensure it is 'PAID'
        target_status = request.data.get("payment_status", "PAID").strip().upper() if request.data else "PAID"
        if target_status != "PAID":
            return Response(
                {"error": f"Invalid payment status '{target_status}'. Staff can only record status as 'PAID'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 5. Keep order_status and payment_status separate:
        # Update ONLY payment_status; order_status remains unchanged!
        order.payment_status = "PAID"
        order.save(update_fields=["payment_status", "updated_at"])

        return Response(OrderDetailSerializer(order).data, status=status.HTTP_200_OK)

