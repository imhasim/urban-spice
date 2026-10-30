"""
URL configuration for Urban Spice restaurant backend.
"""

from django.contrib import admin
from django.urls import path, include
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db import connection


@api_view(["GET"])
def api_root(request):
    """
    Root API endpoint providing health check and API overview.
    """
    db_status = "connected"
    try:
        connection.ensure_connection()
    except Exception as err:
        db_status = f"error: {str(err)}"

    return Response({
        "project": "Urban Spice Restaurant API",
        "version": "1.0.0",
        "status": "online",
        "database": db_status,
        "endpoints": {
            "django_admin": "/admin/",
            "api_root": "/api/",
            "categories": "/api/menu/categories/",
            "items": "/api/menu/items/",
            "orders": "/api/orders/",
            "staff_admin": "/api/admin/",
        },
    })


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", api_root, name="api-root"),
    path("api/menu/", include("menu.urls")),
    path("api/orders/", include("orders.urls")),
    path("api/admin/", include("orders.admin_urls")),
]
