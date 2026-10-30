from django.urls import path
from .admin_views import (
    StaffLoginView,
    StaffDashboardSummaryView,
    StaffOrderListView,
    StaffOrderDetailView,
    StaffOrderStatusUpdateView,
    StaffOrderPaymentUpdateView,
)

urlpatterns = [
    path("login/", StaffLoginView.as_view(), name="admin-login"),
    path("dashboard/", StaffDashboardSummaryView.as_view(), name="admin-dashboard"),
    path("orders/", StaffOrderListView.as_view(), name="admin-order-list"),
    path("orders/<int:pk>/", StaffOrderDetailView.as_view(), name="admin-order-detail"),
    path("orders/<int:pk>/status/", StaffOrderStatusUpdateView.as_view(), name="admin-order-status-update"),
    path("orders/<int:pk>/payment/", StaffOrderPaymentUpdateView.as_view(), name="admin-order-payment-update"),
]

