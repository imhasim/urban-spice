from rest_framework import serializers
from .models import Category, MenuItem


def _resolve_image_url(image_field):
    """
    Safely resolves image URLs for Cloudinary uploads, external URLs, or empty values.
    """
    if not image_field:
        return None
    image_str = str(image_field)
    if image_str.startswith("http://") or image_str.startswith("https://"):
        return image_str
    try:
        return image_field.url
    except Exception:
        return image_str


class CategorySerializer(serializers.ModelSerializer):
    item_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "image",
            "is_active",
            "order",
            "item_count",
        ]

    def get_item_count(self, obj):
        return obj.items.filter(is_available=True).count()

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret["image"] = _resolve_image_url(instance.image)
        return ret


class MenuItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    category_slug = serializers.CharField(source="category.slug", read_only=True)

    class Meta:
        model = MenuItem
        fields = [
            "id",
            "category",
            "category_name",
            "category_slug",
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
            "created_at",
            "updated_at",
        ]

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret["image"] = _resolve_image_url(instance.image)
        return ret
