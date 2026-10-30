/**
 * Menu Item Types for Urban Spice
 */

export interface MenuItem {
  id: string | number;
  name: string;
  slug: string;
  description: string;
  price: number | string;
  category: string | number;
  category_name?: string;
  category_slug?: string;
  image: string;
  is_vegetarian: boolean;
  is_available: boolean;
  is_featured: boolean;
  spice_level?: "Mild" | "Medium" | "Hot" | string;
  badge?: string;
}

export interface MenuCategory {
  id: string | number;
  name: string;
  slug: string;
  description: string;
  item_count?: number;
  icon?: string;
}
