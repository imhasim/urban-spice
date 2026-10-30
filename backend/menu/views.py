from django.db.models import Q
from rest_framework import generics
from rest_framework.permissions import AllowAny
from .models import Category, MenuItem
from .serializers import CategorySerializer, MenuItemSerializer


class CategoryListView(generics.ListAPIView):
    """
    GET /api/menu/categories/
    Returns all active menu categories.
    """
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]
    pagination_class = None  # Categories are a short fixed list, no pagination needed


class MenuItemListView(generics.ListAPIView):
    """
    GET /api/menu/items/
    Supports query parameters:
      - category: slug or id of category
      - search: search term in name or description
      - vegetarian: 'true' or 'false'
      - featured: 'true' or 'false'
      - available: 'all' to show all, defaults to available only
    """
    serializer_class = MenuItemSerializer
    permission_classes = [AllowAny]
    pagination_class = None  # Returns clean array for easy frontend consumption

    def get_queryset(self):
        queryset = MenuItem.objects.select_related("category").all()

        # Availability filter (default: available only)
        available_param = self.request.query_params.get("available")
        if available_param != "all":
            queryset = queryset.filter(is_available=True)

        # Category filter (supports either slug or id)
        category_param = self.request.query_params.get("category")
        if category_param and category_param != "all":
            if category_param.isdigit():
                queryset = queryset.filter(category_id=int(category_param))
            else:
                queryset = queryset.filter(category__slug=category_param)

        # Vegetarian filter
        veg_param = self.request.query_params.get("vegetarian") or self.request.query_params.get("is_vegetarian")
        if veg_param is not None:
            if veg_param.lower() in ("true", "1", "yes"):
                queryset = queryset.filter(is_vegetarian=True)
            elif veg_param.lower() in ("false", "0", "no"):
                queryset = queryset.filter(is_vegetarian=False)

        # Featured filter
        featured_param = self.request.query_params.get("featured")
        if featured_param is not None:
            if featured_param.lower() in ("true", "1", "yes"):
                queryset = queryset.filter(is_featured=True)

        # Search filter
        search_query = self.request.query_params.get("search")
        if search_query:
            search_query = search_query.strip()
            queryset = queryset.filter(
                Q(name__icontains=search_query) | Q(description__icontains=search_query)
            )

        return queryset


class MenuItemDetailView(generics.RetrieveAPIView):
    """
    GET /api/menu/items/{id}/
    Returns details for a single menu item.
    """
    queryset = MenuItem.objects.select_related("category").all()
    serializer_class = MenuItemSerializer
    permission_classes = [AllowAny]
    lookup_field = "pk"
