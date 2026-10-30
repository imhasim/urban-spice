import { MenuItem, MenuCategory } from "@/types/menu";

export const SAMPLE_CATEGORIES: MenuCategory[] = [
  {
    id: "all",
    name: "All Items",
    slug: "all",
    description: "Explore our complete kitchen selection",
  },
  {
    id: "starters",
    name: "Starters & Kebabs",
    slug: "starters",
    description: "Charcoal-grilled skewers, tikkas, and crisp appetisers",
  },
  {
    id: "mains",
    name: "Main Curries",
    slug: "mains",
    description: "Rich, slow-simmered gravies prepared with house-ground masalas",
  },
  {
    id: "biryani",
    name: "Biryani & Rice",
    slug: "biryani",
    description: "Dum-cooked basmati rice infused with whole spices and saffron",
  },
  {
    id: "breads",
    name: "Tandoori Breads",
    slug: "breads",
    description: "Hand-stretched flatbreads baked fresh in the clay tandoor",
  },
];

export const SAMPLE_MENU_ITEMS: MenuItem[] = [
  {
    id: "item-1",
    name: "Old Delhi Butter Chicken",
    slug: "old-delhi-butter-chicken",
    description:
      "Tender tandoor-roasted chicken pieces simmered in a silky tomato, dairy butter, and kasuri methi gravy.",
    price: 420,
    category: "mains",
    image: "/images/butter-chicken.jpg",
    is_vegetarian: false,
    is_available: true,
    is_featured: true,
    spice_level: "Medium",
    badge: "Chef's Special",
  },
  {
    id: "item-2",
    name: "Hyderabadi Dum Biryani",
    slug: "hyderabadi-dum-biryani",
    description:
      "Aged long-grain basmati layered with marinated chicken, caramelized onions, fresh mint, and saffron steam.",
    price: 390,
    category: "biryani",
    image: "/images/biryani.jpg",
    is_vegetarian: false,
    is_available: true,
    is_featured: true,
    spice_level: "Medium",
    badge: "Popular",
  },
  {
    id: "item-3",
    name: "Smoky Angaara Paneer Tikka",
    slug: "smoky-angaara-paneer-tikka",
    description:
      "Fresh artisanal cottage cheese cubes marinated in yellow chili, hung curd, and mustard oil, fire-roasted on skewers.",
    price: 320,
    category: "starters",
    image: "/images/paneer-tikka.jpg",
    is_vegetarian: true,
    is_available: true,
    is_featured: true,
    spice_level: "Medium",
    badge: "Vegetarian",
  },
  {
    id: "item-4",
    name: "Heritage Dal Makhani",
    slug: "heritage-dal-makhani",
    description:
      "Whole black urad lentils slow-simmered overnight on glowing embers, finished with white churned butter and cream.",
    price: 290,
    category: "mains",
    image: "/images/dal-makhani.jpg",
    is_vegetarian: true,
    is_available: true,
    is_featured: true,
    spice_level: "Mild",
    badge: "House Signature",
  },
  {
    id: "item-5",
    name: "Urban Spice Grand Tandoori Platter",
    slug: "urban-spice-grand-tandoori-platter",
    description:
      "A sizzling assortment of Murgh Tikka, Galouti Kebab, and Paneer Angaara served over chargrilled onions with mint dip.",
    price: 650,
    category: "starters",
    image: "/images/hero-dish.jpg",
    is_vegetarian: false,
    is_available: true,
    is_featured: true,
    spice_level: "Hot",
    badge: "Platter",
  },
];
