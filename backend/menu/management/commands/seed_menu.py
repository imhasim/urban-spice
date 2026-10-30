from decimal import Decimal
from django.core.management.base import BaseCommand
from menu.models import Category, MenuItem


class Command(BaseCommand):
    help = "Seeds initial categories and sample dishes into PostgreSQL database."

    def handle(self, *args, **options):
        self.stdout.write("Seeding menu categories and items...")

        categories_data = [
            {
                "name": "Starters & Kebabs",
                "slug": "starters",
                "description": "Charcoal-grilled skewers, tikkas, and crisp appetisers",
                "order": 1,
                "is_active": True,
            },
            {
                "name": "Main Curries",
                "slug": "mains",
                "description": "Rich, slow-simmered gravies prepared with house-ground masalas",
                "order": 2,
                "is_active": True,
            },
            {
                "name": "Biryani & Rice",
                "slug": "biryani",
                "description": "Dum-cooked basmati rice infused with whole spices and saffron",
                "order": 3,
                "is_active": True,
            },
            {
                "name": "Tandoori Breads",
                "slug": "breads",
                "description": "Hand-stretched flatbreads baked fresh in the clay tandoor",
                "order": 4,
                "is_active": True,
            },
        ]

        category_map = {}
        for cat_info in categories_data:
            cat, created = Category.objects.update_or_create(
                slug=cat_info["slug"],
                defaults={
                    "name": cat_info["name"],
                    "description": cat_info["description"],
                    "order": cat_info["order"],
                    "is_active": cat_info["is_active"],
                },
            )
            category_map[cat.slug] = cat
            action = "Created" if created else "Updated"
            self.stdout.write(f"  {action} category: {cat.name}")

        items_data = [
            {
                "category_slug": "mains",
                "name": "Old Delhi Butter Chicken",
                "slug": "old-delhi-butter-chicken",
                "description": "Tender tandoor-roasted chicken pieces simmered in a silky tomato, dairy butter, and kasuri methi gravy.",
                "price": Decimal("420.00"),
                "image": "/images/butter-chicken.jpg",
                "is_vegetarian": False,
                "is_available": True,
                "is_featured": True,
                "spice_level": "Medium",
                "badge": "Chef's Special",
            },
            {
                "category_slug": "biryani",
                "name": "Hyderabadi Dum Biryani",
                "slug": "hyderabadi-dum-biryani",
                "description": "Aged long-grain basmati layered with marinated chicken, caramelized onions, fresh mint, and saffron steam.",
                "price": Decimal("390.00"),
                "image": "/images/biryani.jpg",
                "is_vegetarian": False,
                "is_available": True,
                "is_featured": True,
                "spice_level": "Medium",
                "badge": "Popular",
            },
            {
                "category_slug": "starters",
                "name": "Smoky Angaara Paneer Tikka",
                "slug": "smoky-angaara-paneer-tikka",
                "description": "Fresh artisanal cottage cheese cubes marinated in yellow chili, hung curd, and mustard oil, fire-roasted on skewers.",
                "price": Decimal("320.00"),
                "image": "/images/paneer-tikka.jpg",
                "is_vegetarian": True,
                "is_available": True,
                "is_featured": True,
                "spice_level": "Medium",
                "badge": "Vegetarian",
            },
            {
                "category_slug": "mains",
                "name": "Heritage Dal Makhani",
                "slug": "heritage-dal-makhani",
                "description": "Whole black urad lentils slow-simmered overnight on glowing embers, finished with white churned butter and cream.",
                "price": Decimal("290.00"),
                "image": "/images/dal-makhani.jpg",
                "is_vegetarian": True,
                "is_available": True,
                "is_featured": True,
                "spice_level": "Mild",
                "badge": "House Signature",
            },
            {
                "category_slug": "starters",
                "name": "Urban Spice Grand Tandoori Platter",
                "slug": "urban-spice-grand-tandoori-platter",
                "description": "A sizzling assortment of Murgh Tikka, Galouti Kebab, and Paneer Angaara served over chargrilled onions with mint dip.",
                "price": Decimal("650.00"),
                "image": "/images/hero-dish.jpg",
                "is_vegetarian": False,
                "is_available": True,
                "is_featured": True,
                "spice_level": "Hot",
                "badge": "Platter",
            },
            {
                "category_slug": "breads",
                "name": "Tandoori Garlic Butter Naan",
                "slug": "tandoori-garlic-butter-naan",
                "description": "Hand-stretched leavened dough baked inside the clay tandoor, brushed with rich garlic herb butter.",
                "price": Decimal("75.00"),
                "image": "/images/dal-makhani.jpg",
                "is_vegetarian": True,
                "is_available": True,
                "is_featured": False,
                "spice_level": "Mild",
                "badge": "Clay Oven",
            },
        ]

        for item_info in items_data:
            cat = category_map[item_info["category_slug"]]
            item, created = MenuItem.objects.update_or_create(
                slug=item_info["slug"],
                defaults={
                    "category": cat,
                    "name": item_info["name"],
                    "description": item_info["description"],
                    "price": item_info["price"],
                    "image": item_info["image"],
                    "is_vegetarian": item_info["is_vegetarian"],
                    "is_available": item_info["is_available"],
                    "is_featured": item_info["is_featured"],
                    "spice_level": item_info["spice_level"],
                    "badge": item_info["badge"],
                },
            )
            action = "Created" if created else "Updated"
            self.stdout.write(f"  {action} menu item: {item.name} (₹{item.price})")

        self.stdout.write(self.style.SUCCESS("Successfully seeded menu items and categories!"))
