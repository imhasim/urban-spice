import uuid
from decimal import Decimal
from django.db import models
from django.utils import timezone
from menu.models import MenuItem


def generate_order_number():
    date_str = timezone.now().strftime("%Y%m%d")
    unique_suffix = uuid.uuid4().hex[:6].upper()
    return f"US-{date_str}-{unique_suffix}"


class Order(models.Model):
    ORDER_TYPE_CHOICES = [
        ("DELIVERY", "Home Delivery"),
        ("PICKUP", "Pickup / Takeaway"),
        ("DINE_IN", "Dine-in"),
    ]

    ORDER_STATUS_CHOICES = [
        ("PLACED", "Placed"),
        ("CONFIRMED", "Confirmed"),
        ("PREPARING", "Preparing"),
        ("READY", "Ready"),
        ("OUT_FOR_DELIVERY", "Out for Delivery"),
        ("COMPLETED", "Completed"),
        ("CANCELLED", "Cancelled"),
    ]

    PAYMENT_METHOD_CHOICES = [
        ("COD", "Cash on Delivery"),
        ("PAY_AT_PICKUP", "Pay at Pickup"),
        ("PAY_AT_RESTAURANT", "Pay at Restaurant"),
        ("RAZORPAY", "Razorpay Online"),
    ]

    PAYMENT_STATUS_CHOICES = [
        ("PENDING", "Pending"),
        ("PAID", "Paid"),
        ("FAILED", "Failed"),
        ("REFUNDED", "Refunded"),
        ("CANCELLED", "Cancelled"),
    ]

    order_number = models.CharField(
        max_length=32, unique=True, default=generate_order_number, editable=False, db_index=True
    )

    # Customer Contact Info
    customer_name = models.CharField(max_length=150)
    customer_phone = models.CharField(max_length=20)
    customer_email = models.EmailField(blank=True)

    # Fulfilment Classification
    order_type = models.CharField(
        max_length=20, choices=ORDER_TYPE_CHOICES, default="DELIVERY"
    )

    # Delivery-specific fields
    delivery_address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    pincode = models.CharField(max_length=20, blank=True)
    landmark = models.CharField(max_length=150, blank=True)

    # Dine-in / Pickup-specific fields
    table_number = models.CharField(max_length=50, blank=True)
    pickup_time_preference = models.CharField(max_length=100, blank=True)
    customer_note = models.TextField(blank=True)

    # Statuses
    order_status = models.CharField(
        max_length=25, choices=ORDER_STATUS_CHOICES, default="PLACED"
    )
    payment_method = models.CharField(
        max_length=25, choices=PAYMENT_METHOD_CHOICES, default="COD"
    )
    payment_status = models.CharField(
        max_length=25, choices=PAYMENT_STATUS_CHOICES, default="PENDING"
    )

    # Razorpay Gateway Tracking
    razorpay_order_id = models.CharField(max_length=100, blank=True, null=True, db_index=True)
    razorpay_payment_id = models.CharField(max_length=100, blank=True, null=True, db_index=True)
    razorpay_signature = models.CharField(max_length=255, blank=True, null=True)

    # Financial Breakdown (All in INR, DecimalField)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    delivery_fee = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal("0.00"))
    tax_amount = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal("0.00"))
    discount_amount = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal("0.00"))
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    currency = models.CharField(max_length=5, default="INR")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.order_number} - {self.customer_name} ({self.get_order_type_display()})"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    menu_item = models.ForeignKey(
        MenuItem, on_delete=models.SET_NULL, null=True, blank=True, related_name="order_items"
    )

    # Historical Snapshots
    item_name_snapshot = models.CharField(max_length=150)
    unit_price_snapshot = models.DecimalField(max_digits=8, decimal_places=2)
    quantity = models.PositiveIntegerField(default=1)
    line_total = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return f"{self.quantity}x {self.item_name_snapshot} ({self.order.order_number})"
