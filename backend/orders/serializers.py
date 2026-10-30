from decimal import Decimal
from django.db import transaction
from rest_framework import serializers
from menu.models import MenuItem
from .models import Order, OrderItem

DELIVERY_FEE_AMOUNT = Decimal("50.00")
TAX_PERCENTAGE = Decimal("0.05")  # 5% GST


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = [
            "id",
            "menu_item",
            "item_name_snapshot",
            "unit_price_snapshot",
            "quantity",
            "line_total",
        ]


class OrderDetailSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    order_type_display = serializers.CharField(source="get_order_type_display", read_only=True)
    order_status_display = serializers.CharField(source="get_order_status_display", read_only=True)
    payment_method_display = serializers.CharField(source="get_payment_method_display", read_only=True)
    payment_status_display = serializers.CharField(source="get_payment_status_display", read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "order_number",
            "customer_name",
            "customer_phone",
            "customer_email",
            "order_type",
            "order_type_display",
            "delivery_address",
            "city",
            "pincode",
            "landmark",
            "table_number",
            "pickup_time_preference",
            "customer_note",
            "order_status",
            "order_status_display",
            "payment_method",
            "payment_method_display",
            "payment_status",
            "payment_status_display",
            "razorpay_order_id",
            "razorpay_payment_id",
            "subtotal",
            "delivery_fee",
            "tax_amount",
            "discount_amount",
            "total_amount",
            "currency",
            "items",
            "created_at",
            "updated_at",
        ]


class OrderItemInputSerializer(serializers.Serializer):
    menu_item_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)


import re

INVALID_PLACEHOLDERS = {
    "na", "n/a", "none", "null", "nil", "test", "testing", "undefined",
    "-", "--", "...", "no", "nope", "0", "asdf", "xyz", "n.a", "n.a.", "nothing"
}


def is_placeholder_value(val: str) -> bool:
    if not val:
        return True
    cleaned_lower = val.strip().lower()
    alphanumeric_only = re.sub(r"[^a-zA-Z0-9]", "", val).lower()
    return (
        cleaned_lower in INVALID_PLACEHOLDERS
        or alphanumeric_only in {"na", "none", "null", "nil", "test", "asdf"}
        or len(cleaned_lower) == 0
    )


class OrderCreateSerializer(serializers.ModelSerializer):
    items = OrderItemInputSerializer(many=True, write_only=True)

    class Meta:
        model = Order
        fields = [
            "customer_name",
            "customer_phone",
            "customer_email",
            "order_type",
            "delivery_address",
            "city",
            "pincode",
            "landmark",
            "table_number",
            "pickup_time_preference",
            "customer_note",
            "payment_method",
            "items",
        ]

    def validate(self, attrs):
        errors = {}
        order_type = attrs.get("order_type", "DELIVERY")
        items = attrs.get("items", [])

        # 1. Validate Items
        if not items:
            errors["items"] = ["Order must contain at least one item."]

        # 2. Validate Customer Name
        name = attrs.get("customer_name", "").strip()
        if not name or is_placeholder_value(name):
            errors["customer_name"] = [
                "A valid customer name is required. Placeholder values such as 'na', 'none', or 'null' are not allowed."
            ]
        elif len(name) < 2 or not re.search(r"[A-Za-z\u0900-\u097F]", name):
            errors["customer_name"] = ["Customer name must be at least 2 letters."]
        else:
            attrs["customer_name"] = name

        # 3. Validate Customer Phone
        phone = attrs.get("customer_phone", "").strip()
        if not phone or is_placeholder_value(phone):
            errors["customer_phone"] = [
                "A valid customer phone number is required. Placeholder values are not allowed."
            ]
        else:
            digits = re.sub(r"\D", "", phone)
            # Remove leading country code if 12 digits starting with 91
            if len(digits) == 12 and digits.startswith("91"):
                digits = digits[2:]

            if len(digits) < 10 or len(digits) > 13:
                errors["customer_phone"] = [
                    "Please provide a valid 10-digit phone number for order updates."
                ]
            elif len(set(digits)) == 1:
                errors["customer_phone"] = [
                    "Please provide a genuine, active phone number."
                ]
            else:
                attrs["customer_phone"] = phone

        # 4. Fulfilment-specific Validation
        if order_type == "DELIVERY":
            # Delivery Address
            address = attrs.get("delivery_address", "").strip()
            if not address or is_placeholder_value(address):
                errors["delivery_address"] = [
                    "A complete delivery address is required for Home Delivery. Placeholder values are not allowed."
                ]
            elif len(address) < 8:
                errors["delivery_address"] = [
                    "Please provide a complete delivery address (house/flat number, building name, and street)."
                ]
            else:
                attrs["delivery_address"] = address

            # City
            city = attrs.get("city", "").strip()
            if not city or is_placeholder_value(city):
                errors["city"] = [
                    "City is required for Home Delivery. Placeholder values are not allowed."
                ]
            elif len(city) < 2:
                errors["city"] = ["Please provide a valid city name."]
            else:
                attrs["city"] = city

            # PIN Code
            pincode = attrs.get("pincode", "").strip()
            if not pincode or is_placeholder_value(pincode):
                errors["pincode"] = [
                    "PIN code is required for Home Delivery."
                ]
            else:
                pin_digits = re.sub(r"\D", "", pincode)
                if len(pin_digits) != 6:
                    errors["pincode"] = ["Please provide a valid 6-digit PIN code."]
                else:
                    attrs["pincode"] = pin_digits

            # Landmark is strictly OPTIONAL
            landmark = attrs.get("landmark", "").strip()
            if is_placeholder_value(landmark):
                attrs["landmark"] = ""
            else:
                attrs["landmark"] = landmark

        elif order_type == "PICKUP":
            # Address/city/pincode not required for pickup
            attrs["delivery_address"] = ""
            attrs["city"] = ""
            attrs["pincode"] = ""
            attrs["landmark"] = ""
            time_pref = attrs.get("pickup_time_preference", "").strip()
            if is_placeholder_value(time_pref):
                attrs["pickup_time_preference"] = "Standard (25-30 mins)"

        elif order_type == "DINE_IN":
            # Address/city/pincode not required for dine-in
            attrs["delivery_address"] = ""
            attrs["city"] = ""
            attrs["pincode"] = ""
            attrs["landmark"] = ""
            tbl = attrs.get("table_number", "").strip()
            if is_placeholder_value(tbl):
                attrs["table_number"] = "Walk-in"

        # Sanitize customer note if placeholder
        note = attrs.get("customer_note", "").strip()
        if is_placeholder_value(note):
            attrs["customer_note"] = ""
        else:
            attrs["customer_note"] = note

        # Raise all field-specific errors together if any exist
        if errors:
            raise serializers.ValidationError(errors)

        # Set sensible offline payment method default if not passed or inappropriate
        pm = attrs.get("payment_method")
        if not pm:
            if order_type == "DELIVERY":
                attrs["payment_method"] = "COD"
            elif order_type == "PICKUP":
                attrs["payment_method"] = "PAY_AT_PICKUP"
            elif order_type == "DINE_IN":
                attrs["payment_method"] = "PAY_AT_RESTAURANT"

        return attrs

    def create(self, validated_data):
        items_data = validated_data.pop("items")
        order_type = validated_data.get("order_type", "DELIVERY")

        with transaction.atomic():
            # 1. Fetch menu item models and validate availability
            item_ids = [item["menu_item_id"] for item in items_data]
            db_items = {item.id: item for item in MenuItem.objects.filter(id__in=item_ids)}

            # Check for missing items
            for item_input in items_data:
                mid = item_input["menu_item_id"]
                if mid not in db_items:
                    raise serializers.ValidationError(
                        {"items": f"Menu item with ID {mid} does not exist."}
                    )
                menu_item = db_items[mid]
                if not menu_item.is_available:
                    raise serializers.ValidationError(
                        {"items": f"'{menu_item.name}' is currently unavailable."}
                    )

            # 2. Recalculate totals on the server (never trust client)
            subtotal = Decimal("0.00")
            item_snapshots = []

            for item_input in items_data:
                menu_item = db_items[item_input["menu_item_id"]]
                quantity = item_input["quantity"]
                unit_price = menu_item.price
                line_total = (unit_price * quantity).quantize(Decimal("0.01"))
                subtotal += line_total

                item_snapshots.append({
                    "menu_item": menu_item,
                    "item_name_snapshot": menu_item.name,
                    "unit_price_snapshot": unit_price,
                    "quantity": quantity,
                    "line_total": line_total,
                })

            delivery_fee = DELIVERY_FEE_AMOUNT if order_type == "DELIVERY" else Decimal("0.00")
            tax_amount = (subtotal * TAX_PERCENTAGE).quantize(Decimal("0.01"))
            discount_amount = Decimal("0.00")
            total_amount = subtotal + delivery_fee + tax_amount - discount_amount

            # 3. Create Order
            order = Order.objects.create(
                subtotal=subtotal,
                delivery_fee=delivery_fee,
                tax_amount=tax_amount,
                discount_amount=discount_amount,
                total_amount=total_amount,
                order_status="PLACED",
                payment_status="PENDING",
                **validated_data
            )

            # 4. Create OrderItems
            order_items_to_create = [
                OrderItem(
                    order=order,
                    menu_item=snap["menu_item"],
                    item_name_snapshot=snap["item_name_snapshot"],
                    unit_price_snapshot=snap["unit_price_snapshot"],
                    quantity=snap["quantity"],
                    line_total=snap["line_total"],
                )
                for snap in item_snapshots
            ]
            OrderItem.objects.bulk_create(order_items_to_create)

            return order
