from decimal import Decimal
from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient
from menu.models import Category, MenuItem
from .models import Order, OrderItem


class StaffPaymentManagementTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Create staff user and token
        self.staff_user = User.objects.create_user(
            username="staff_member",
            password="staffpassword123",
            is_staff=True,
        )
        self.staff_token = Token.objects.create(user=self.staff_user)

        # Create regular (non-staff) customer user and token
        self.regular_user = User.objects.create_user(
            username="customer_john",
            password="customerpassword123",
            is_staff=False,
        )
        self.regular_token = Token.objects.create(user=self.regular_user)

        # Create menu item for order snapshots
        self.category = Category.objects.create(name="Curries", slug="curries")
        self.menu_item = MenuItem.objects.create(
            category=self.category,
            name="Butter Chicken",
            slug="butter-chicken",
            description="Tender chicken in rich creamy tomato curry.",
            price=Decimal("450.00"),
            is_available=True,
        )

        # Helper method to create test orders
        self.cod_order = self._create_order(
            order_type="DELIVERY",
            payment_method="COD",
            payment_status="PENDING",
            order_status="PLACED",
        )

        self.pickup_order = self._create_order(
            order_type="PICKUP",
            payment_method="PAY_AT_PICKUP",
            payment_status="PENDING",
            order_status="PLACED",
        )

        self.dine_in_order = self._create_order(
            order_type="DINE_IN",
            payment_method="PAY_AT_RESTAURANT",
            payment_status="PENDING",
            order_status="PLACED",
        )

        self.razorpay_order = self._create_order(
            order_type="DELIVERY",
            payment_method="RAZORPAY",
            payment_status="PENDING",
            order_status="PLACED",
        )

    def _create_order(self, order_type, payment_method, payment_status, order_status="PLACED"):
        order = Order.objects.create(
            customer_name="Test Customer",
            customer_phone="9876543210",
            customer_email="test@example.com",
            order_type=order_type,
            delivery_address="123 Street" if order_type == "DELIVERY" else "",
            city="Mumbai" if order_type == "DELIVERY" else "",
            pincode="400001" if order_type == "DELIVERY" else "",
            table_number="T4" if order_type == "DINE_IN" else "",
            order_status=order_status,
            payment_method=payment_method,
            payment_status=payment_status,
            subtotal=Decimal("450.00"),
            delivery_fee=Decimal("50.00") if order_type == "DELIVERY" else Decimal("0.00"),
            tax_amount=Decimal("22.50"),
            total_amount=Decimal("522.50") if order_type == "DELIVERY" else Decimal("472.50"),
        )
        OrderItem.objects.create(
            order=order,
            menu_item=self.menu_item,
            item_name_snapshot="Butter Chicken",
            unit_price_snapshot=Decimal("450.00"),
            quantity=1,
            line_total=Decimal("450.00"),
        )
        return order

    # 1. Authorization Tests
    def test_unauthenticated_request_is_rejected(self):
        """Unauthenticated requests must be rejected with 401 Unauthorized."""
        url = reverse("admin-order-payment-update", kwargs={"pk": self.cod_order.pk})
        response = self.client.patch(url, {"payment_status": "PAID"})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_non_staff_user_is_forbidden(self):
        """Authenticated non-staff users must be rejected with 403 Forbidden."""
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.regular_token.key}")
        url = reverse("admin-order-payment-update", kwargs={"pk": self.cod_order.pk})
        response = self.client.patch(url, {"payment_status": "PAID"})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # 2. Valid Updates Tests (COD, Pay at Pickup, Pay at Restaurant)
    def test_valid_mark_paid_cod_order(self):
        """Authorized staff can mark Cash on Delivery orders as PAID."""
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.staff_token.key}")
        url = reverse("admin-order-payment-update", kwargs={"pk": self.cod_order.pk})
        response = self.client.patch(url, {"payment_status": "PAID"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.cod_order.refresh_from_db()
        self.assertEqual(self.cod_order.payment_status, "PAID")
        # order_status remains unchanged (PLACED)
        self.assertEqual(self.cod_order.order_status, "PLACED")
        self.assertEqual(response.data["payment_status"], "PAID")
        self.assertEqual(response.data["payment_status_display"], "Paid")

    def test_valid_mark_paid_pickup_order(self):
        """Authorized staff can mark Pay at Pickup orders as PAID."""
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.staff_token.key}")
        url = reverse("admin-order-payment-update", kwargs={"pk": self.pickup_order.pk})
        response = self.client.post(url, {})  # Default target is PAID

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.pickup_order.refresh_from_db()
        self.assertEqual(self.pickup_order.payment_status, "PAID")

    def test_valid_mark_paid_dine_in_order(self):
        """Authorized staff can mark Pay at Restaurant orders as PAID."""
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.staff_token.key}")
        url = reverse("admin-order-payment-update", kwargs={"pk": self.dine_in_order.pk})
        response = self.client.patch(url, {"payment_status": "PAID"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.dine_in_order.refresh_from_db()
        self.assertEqual(self.dine_in_order.payment_status, "PAID")

    # 3. Duplicate Updates Tests
    def test_duplicate_payment_update_is_rejected(self):
        """Attempting to mark an already PAID order as paid must return 400 Bad Request."""
        self.cod_order.payment_status = "PAID"
        self.cod_order.save(update_fields=["payment_status"])

        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.staff_token.key}")
        url = reverse("admin-order-payment-update", kwargs={"pk": self.cod_order.pk})
        response = self.client.patch(url, {"payment_status": "PAID"})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("already marked as PAID", response.data["error"])

    # 4. Online-Payment (Razorpay) Restriction Tests
    def test_razorpay_manual_payment_update_is_rejected(self):
        """Staff cannot manually mark Razorpay online payments as paid."""
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.staff_token.key}")
        url = reverse("admin-order-payment-update", kwargs={"pk": self.razorpay_order.pk})
        response = self.client.patch(url, {"payment_status": "PAID"})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Razorpay", response.data["error"])
        self.razorpay_order.refresh_from_db()
        self.assertEqual(self.razorpay_order.payment_status, "PENDING")

    # 5. Separation of order_status and payment_status Tests
    def test_completing_order_does_not_mark_payment_paid(self):
        """Marking an order COMPLETED does not change payment_status from PENDING to PAID."""
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.staff_token.key}")

        # Transition pickup order: PLACED -> CONFIRMED -> PREPARING -> READY -> COMPLETED
        status_url = reverse("admin-order-status-update", kwargs={"pk": self.pickup_order.pk})
        self.client.patch(status_url, {"order_status": "CONFIRMED"})
        self.client.patch(status_url, {"order_status": "PREPARING"})
        self.client.patch(status_url, {"order_status": "READY"})
        response = self.client.patch(status_url, {"order_status": "COMPLETED"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.pickup_order.refresh_from_db()
        self.assertEqual(self.pickup_order.order_status, "COMPLETED")
        # Critical Requirement 5: payment_status MUST still be PENDING!
        self.assertEqual(self.pickup_order.payment_status, "PENDING")


class RazorpayIntegrationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.category = Category.objects.create(name="Biryani", slug="biryani")
        self.menu_item = MenuItem.objects.create(
            category=self.category,
            name="Dum Biryani",
            slug="dum-biryani",
            description="Fragrant basmati rice dum cooked with spices.",
            price=Decimal("400.00"),
            is_available=True,
        )
        self.order = Order.objects.create(
            customer_name="Rohan Verma",
            customer_phone="9876543210",
            customer_email="rohan@example.com",
            order_type="DELIVERY",
            delivery_address="456 Park Avenue",
            city="New Delhi",
            pincode="110001",
            order_status="PLACED",
            payment_method="RAZORPAY",
            payment_status="PENDING",
            razorpay_order_id="order_test_12345",
            subtotal=Decimal("400.00"),
            delivery_fee=Decimal("50.00"),
            tax_amount=Decimal("20.00"),
            total_amount=Decimal("470.00"),
        )
        OrderItem.objects.create(
            order=self.order,
            menu_item=self.menu_item,
            item_name_snapshot="Dum Biryani",
            unit_price_snapshot=Decimal("400.00"),
            quantity=1,
            line_total=Decimal("400.00"),
        )

    def _generate_valid_signature(self, order_id: str, payment_id: str) -> str:
        """Generates a valid HMAC SHA256 signature matching Razorpay SDK expectations."""
        import hmac
        import hashlib
        from django.conf import settings
        secret = settings.RAZORPAY_KEY_SECRET
        msg = f"{order_id}|{payment_id}".encode("utf-8")
        return hmac.new(secret.encode("utf-8"), msg, hashlib.sha256).hexdigest()

    def test_verify_payment_signature_success(self):
        """Valid HMAC SHA256 signature marks order as PAID and saves transaction IDs."""
        payment_id = "pay_test_999888"
        signature = self._generate_valid_signature(self.order.razorpay_order_id, payment_id)

        url = reverse("orders:razorpay-verify")
        response = self.client.post(url, {
            "order_number": self.order.order_number,
            "razorpay_order_id": self.order.razorpay_order_id,
            "razorpay_payment_id": payment_id,
            "razorpay_signature": signature,
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        self.order.refresh_from_db()
        self.assertEqual(self.order.payment_status, "PAID")
        self.assertEqual(self.order.razorpay_payment_id, payment_id)
        self.assertEqual(self.order.razorpay_signature, signature)

    def test_verify_payment_signature_failure_marks_failed(self):
        """Forged or invalid signature must be rejected and order marked FAILED."""
        url = reverse("orders:razorpay-verify")
        response = self.client.post(url, {
            "order_number": self.order.order_number,
            "razorpay_order_id": self.order.razorpay_order_id,
            "razorpay_payment_id": "pay_fake_111",
            "razorpay_signature": "invalid_forged_signature_hex",
        })

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("verification failed", response.data["error"].lower())
        self.order.refresh_from_db()
        self.assertEqual(self.order.payment_status, "FAILED")

    def test_duplicate_payment_verification_is_idempotent(self):
        """Submitting verification for an already PAID order returns idempotent 200 OK."""
        payment_id = "pay_test_already_paid"
        signature = self._generate_valid_signature(self.order.razorpay_order_id, payment_id)

        # Mark paid first
        self.order.payment_status = "PAID"
        self.order.razorpay_payment_id = payment_id
        self.order.razorpay_signature = signature
        self.order.save()

        url = reverse("orders:razorpay-verify")
        response = self.client.post(url, {
            "order_number": self.order.order_number,
            "razorpay_order_id": self.order.razorpay_order_id,
            "razorpay_payment_id": payment_id,
            "razorpay_signature": signature,
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])

    def test_mismatched_razorpay_order_id_is_rejected(self):
        """Tampered razorpay_order_id mismatching DB record is rejected."""
        url = reverse("orders:razorpay-verify")
        response = self.client.post(url, {
            "order_number": self.order.order_number,
            "razorpay_order_id": "order_different_tampered",
            "razorpay_payment_id": "pay_test_000",
            "razorpay_signature": "signature_test",
        })

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("mismatch", response.data["error"].lower())

    def test_razorpay_payment_failed_endpoint(self):
        """Cancelled or failed payment reports update payment_status to FAILED."""
        url = reverse("orders:razorpay-failed")
        response = self.client.post(url, {
            "order_number": self.order.order_number,
            "error_description": "User cancelled payment popup.",
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.order.refresh_from_db()
        self.assertEqual(self.order.payment_status, "FAILED")


class OrderCheckoutValidationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.category = Category.objects.create(name="Starters", slug="starters")
        self.item = MenuItem.objects.create(
            category=self.category,
            name="Paneer Tikka",
            slug="paneer-tikka",
            description="Charcoal grilled cottage cheese.",
            price=Decimal("320.00"),
            is_available=True,
        )
        self.order_create_url = reverse("orders:order-create")

    def test_delivery_rejects_placeholder_name(self):
        for placeholder in ["na", "N/A", "none", "None", "null", "NIL", "test", "   "]:
            res = self.client.post(self.order_create_url, {
                "customer_name": placeholder,
                "customer_phone": "9876543210",
                "order_type": "DELIVERY",
                "delivery_address": "45 Park Avenue, Block C",
                "city": "New Delhi",
                "pincode": "110001",
                "payment_method": "COD",
                "items": [{"menu_item_id": self.item.id, "quantity": 1}],
            }, format="json")
            self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST, f"Failed to reject name: '{placeholder}'")
            self.assertIn("customer_name", res.data)

    def test_delivery_rejects_placeholder_and_invalid_phone(self):
        for bad_phone in ["na", "none", "null", "0000000000", "12345", "99999999999999"]:
            res = self.client.post(self.order_create_url, {
                "customer_name": "Rohan Verma",
                "customer_phone": bad_phone,
                "order_type": "DELIVERY",
                "delivery_address": "45 Park Avenue, Block C",
                "city": "New Delhi",
                "pincode": "110001",
                "payment_method": "COD",
                "items": [{"menu_item_id": self.item.id, "quantity": 1}],
            }, format="json")
            self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST, f"Failed to reject phone: '{bad_phone}'")
            self.assertIn("customer_phone", res.data)

    def test_delivery_rejects_placeholder_address(self):
        for bad_addr in ["na", "n/a", "none", "null", "nil", "test", "short", "   "]:
            res = self.client.post(self.order_create_url, {
                "customer_name": "Rohan Verma",
                "customer_phone": "9876543210",
                "order_type": "DELIVERY",
                "delivery_address": bad_addr,
                "city": "New Delhi",
                "pincode": "110001",
                "payment_method": "COD",
                "items": [{"menu_item_id": self.item.id, "quantity": 1}],
            }, format="json")
            self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST, f"Failed to reject address: '{bad_addr}'")
            self.assertIn("delivery_address", res.data)

    def test_delivery_rejects_placeholder_city_and_pincode(self):
        res = self.client.post(self.order_create_url, {
            "customer_name": "Rohan Verma",
            "customer_phone": "9876543210",
            "order_type": "DELIVERY",
            "delivery_address": "Flat 204, Green Heights, Ring Road",
            "city": "na",
            "pincode": "none",
            "payment_method": "COD",
            "items": [{"menu_item_id": self.item.id, "quantity": 1}],
        }, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("city", res.data)
        self.assertIn("pincode", res.data)

    def test_delivery_landmark_is_strictly_optional(self):
        # Case 1: landmark omitted entirely
        res1 = self.client.post(self.order_create_url, {
            "customer_name": "Rohan Verma",
            "customer_phone": "9876543210",
            "order_type": "DELIVERY",
            "delivery_address": "Flat 204, Green Heights, Ring Road",
            "city": "New Delhi",
            "pincode": "110001",
            "payment_method": "COD",
            "items": [{"menu_item_id": self.item.id, "quantity": 1}],
        }, format="json")
        self.assertEqual(res1.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res1.data["landmark"], "")

        # Case 2: landmark has placeholder, should be cleanly sanitized to empty string
        res2 = self.client.post(self.order_create_url, {
            "customer_name": "Rohan Verma",
            "customer_phone": "9876543210",
            "order_type": "DELIVERY",
            "delivery_address": "Flat 204, Green Heights, Ring Road",
            "city": "New Delhi",
            "pincode": "110001",
            "landmark": "N/A",
            "payment_method": "COD",
            "items": [{"menu_item_id": self.item.id, "quantity": 1}],
        }, format="json")
        self.assertEqual(res2.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res2.data["landmark"], "")

    def test_pickup_does_not_break_without_address(self):
        res = self.client.post(self.order_create_url, {
            "customer_name": "Pooja Patel",
            "customer_phone": "9876543210",
            "order_type": "PICKUP",
            "pickup_time_preference": "30 mins",
            "payment_method": "PAY_AT_PICKUP",
            "items": [{"menu_item_id": self.item.id, "quantity": 1}],
        }, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["order_type"], "PICKUP")
        self.assertEqual(res.data["delivery_address"], "")

    def test_dine_in_does_not_break_without_address(self):
        res = self.client.post(self.order_create_url, {
            "customer_name": "Karan Malhotra",
            "customer_phone": "9876543210",
            "order_type": "DINE_IN",
            "table_number": "Table 12",
            "payment_method": "PAY_AT_RESTAURANT",
            "items": [{"menu_item_id": self.item.id, "quantity": 1}],
        }, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["order_type"], "DINE_IN")
        self.assertEqual(res.data["delivery_address"], "")


