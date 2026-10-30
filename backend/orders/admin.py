from django.contrib import admin
from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = (
        "item_name_snapshot",
        "unit_price_snapshot",
        "quantity",
        "line_total",
    )


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        "order_number",
        "customer_name",
        "customer_phone",
        "order_type",
        "order_status",
        "payment_method",
        "payment_status",
        "total_amount",
        "created_at",
    )
    list_filter = (
        "order_type",
        "order_status",
        "payment_method",
        "payment_status",
        "created_at",
    )
    search_fields = (
        "order_number",
        "customer_name",
        "customer_phone",
        "delivery_address",
        "table_number",
    )
    readonly_fields = (
        "order_number",
        "subtotal",
        "delivery_fee",
        "tax_amount",
        "total_amount",
        "created_at",
        "updated_at",
    )
    inlines = [OrderItemInline]


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = (
        "order",
        "item_name_snapshot",
        "unit_price_snapshot",
        "quantity",
        "line_total",
    )
    search_fields = ("order__order_number", "item_name_snapshot")
