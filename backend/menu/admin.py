from django.contrib import admin
from .models import Category, MenuItem


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "is_active", "order")
    list_editable = ("is_active", "order")
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ("name", "description")
    fields = ("name", "slug", "description", "image", "is_active", "order")


@admin.register(MenuItem)
class MenuItemAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "category",
        "price",
        "is_vegetarian",
        "is_available",
        "is_featured",
        "spice_level",
    )
    list_filter = ("category", "is_vegetarian", "is_available", "is_featured", "spice_level")
    list_editable = ("price", "is_available", "is_featured")
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ("name", "description")
    fields = (
        "category",
        "name",
        "slug",
        "description",
        "price",
        "image",
        "is_vegetarian",
        "is_available",
        "is_featured",
        "spice_level",
        "badge",
    )
