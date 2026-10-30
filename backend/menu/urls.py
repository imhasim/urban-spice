from django.urls import path
from .views import CategoryListView, MenuItemListView, MenuItemDetailView

app_name = "menu"

urlpatterns = [
    path("categories/", CategoryListView.as_view(), name="category-list"),
    path("items/", MenuItemListView.as_view(), name="item-list"),
    path("items/<int:pk>/", MenuItemDetailView.as_view(), name="item-detail"),
]
