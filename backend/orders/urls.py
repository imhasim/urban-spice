from django.urls import path
from .views import (
    OrderCreateView,
    OrderDetailView,
    RazorpayOrderCreateView,
    RazorpayPaymentVerifyView,
    RazorpayPaymentFailedView,
)

app_name = "orders"

urlpatterns = [
    path("", OrderCreateView.as_view(), name="order-create"),
    path("razorpay/verify/", RazorpayPaymentVerifyView.as_view(), name="razorpay-verify"),
    path("razorpay/failed/", RazorpayPaymentFailedView.as_view(), name="razorpay-failed"),
    path("<str:order_number>/", OrderDetailView.as_view(), name="order-detail"),
    path("<str:order_number>/razorpay/create/", RazorpayOrderCreateView.as_view(), name="razorpay-order-create"),
]
