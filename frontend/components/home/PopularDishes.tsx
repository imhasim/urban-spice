"use client";

import React, { useState, useEffect, useCallback } from "react";
import { MenuItem, MenuCategory } from "@/types/menu";
import { FoodCard } from "@/components/ui/FoodCard";
import { getMenuCategories, getMenuItems } from "@/lib/api";

interface PopularDishesProps {
  onAddToCart?: (item: MenuItem) => void;
}

export const PopularDishes: React.FC<PopularDishesProps> = ({ onAddToCart }) => {
  const [categories, setCategories] = useState<MenuCategory[]>([
    {
      id: "all",
      name: "All Items",
      slug: "all",
      description: "Explore our complete kitchen selection",
    },
  ]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [vegOnly, setVegOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [items, setItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch Categories once on mount
  useEffect(() => {
    async function loadCategories() {
      const res = await getMenuCategories();
      if (res.data && Array.isArray(res.data)) {
        setCategories([
          {
            id: "all",
            name: "All Items",
            slug: "all",
            description: "Explore our complete kitchen selection",
          },
          ...res.data,
        ]);
      }
    }
    loadCategories();
  }, []);

  // 2. Fetch Items from Django REST API with active filters
  const loadMenuItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const res = await getMenuItems({
      category: selectedCategory,
      vegetarian: vegOnly,
      search: searchQuery,
    });

    if (res.error) {
      setError(res.error);
    } else if (res.data && Array.isArray(res.data)) {
      setItems(res.data);
    }
    setIsLoading(false);
  }, [selectedCategory, vegOnly, searchQuery]);

  // Debounced effect for search, category, and veg filter
  useEffect(() => {
    const handler = setTimeout(() => {
      loadMenuItems();
    }, 200);

    return () => clearTimeout(handler);
  }, [loadMenuItems]);

  return (
    <section id="menu" className="py-20 bg-[#171717]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#242424] border border-[#333333] text-xs font-semibold uppercase tracking-wider text-[#E51D2A] mb-3">
              <span>Authentic Kitchen Selection</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-serif font-black text-white">
              Signature Dishes & Specialities
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base mt-2 max-w-xl">
              Hand-crafted recipes using stone-ground spices, clay oven baking, and slow simmering.
            </p>
          </div>

          {/* Database Connected Status Badge */}
          <div className="text-xs text-zinc-400 bg-[#1e1e1e] border border-[#333333] px-3.5 py-2 rounded-xl self-start md:self-end flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>
              <strong className="text-white">PostgreSQL Live:</strong>{" "}
              {isLoading ? "Syncing..." : `${items.length} dishes loaded`}
            </span>
          </div>
        </div>

        {/* Filters and Search Bar Container */}
        <div className="bg-[#1f1f1f] border border-[#2d2d2d] rounded-2xl p-4 sm:p-6 mb-10 space-y-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
              {categories.map((cat) => {
                const isActive = selectedCategory === cat.slug;
                return (
                  <button
                    key={String(cat.id)}
                    onClick={() => setSelectedCategory(cat.slug)}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold tracking-wide whitespace-nowrap transition-all duration-200 cursor-pointer ${
                      isActive
                        ? "bg-[#E51D2A] text-white shadow-md shadow-[#E51D2A]/30"
                        : "bg-[#282828] text-zinc-300 hover:text-white hover:bg-[#323232]"
                    }`}
                  >
                    {cat.name}
                    {cat.item_count !== undefined && cat.slug !== "all" && (
                      <span className="ml-1.5 text-[11px] opacity-75">
                        ({cat.item_count})
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Search Input & Vegetarian Toggle */}
            <div className="flex items-center gap-3">
              {/* Veg Only Toggle Button */}
              <button
                onClick={() => setVegOnly(!vegOnly)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-2 cursor-pointer ${
                  vegOnly
                    ? "bg-emerald-950/50 border-emerald-500 text-emerald-400 shadow-sm"
                    : "bg-[#282828] border-[#383838] text-zinc-400 hover:text-white"
                }`}
                title="Toggle Vegetarian Only"
                aria-pressed={vegOnly}
              >
                <div
                  className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center ${
                    vegOnly ? "border-emerald-400" : "border-zinc-500"
                  }`}
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${
                      vegOnly ? "bg-emerald-400" : "bg-zinc-500"
                    }`}
                  />
                </div>
                <span>Veg Only</span>
              </button>

              {/* Search Field */}
              <div className="relative flex-1 sm:w-64">
                <input
                  type="text"
                  placeholder="Search dishes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#171717] border border-[#383838] focus:border-[#E51D2A] rounded-xl px-4 py-2 pl-9 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none transition-colors"
                />
                <svg
                  className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div
                key={idx}
                className="bg-[#242424] border border-[#333333] rounded-2xl overflow-hidden animate-pulse"
              >
                <div className="w-full h-52 sm:h-56 bg-[#2a2a2a]"></div>
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-[#2f2f2f] rounded w-3/4"></div>
                  <div className="h-3 bg-[#2a2a2a] rounded w-full"></div>
                  <div className="h-3 bg-[#2a2a2a] rounded w-2/3"></div>
                </div>
                <div className="px-5 pb-5 pt-2 flex justify-between items-center border-t border-[#333333]/50">
                  <div className="h-6 w-16 bg-[#2f2f2f] rounded"></div>
                  <div className="h-9 w-24 bg-[#2f2f2f] rounded-xl"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="text-center py-16 bg-[#241a1a] border border-rose-900/50 rounded-2xl p-8">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Unable to Load Dishes</h3>
            <p className="text-rose-300 text-sm max-w-md mx-auto mb-5">{error}</p>
            <button
              onClick={() => loadMenuItems()}
              className="px-5 py-2.5 rounded-xl bg-[#E51D2A] hover:bg-[#c91420] text-white text-xs font-bold transition-all shadow-md"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Items Grid */}
        {!isLoading && !error && items.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {items.map((item) => (
              <FoodCard key={String(item.id)} item={item} onAddToCart={onAddToCart} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && items.length === 0 && (
          <div className="text-center py-16 bg-[#1e1e1e] border border-[#2d2d2d] rounded-2xl p-8">
            <p className="text-zinc-300 text-base font-semibold mb-1">
              No dishes match your selected filter
            </p>
            <p className="text-zinc-500 text-xs mb-5">
              Try selecting another category or clearing your search term.
            </p>
            <button
              onClick={() => {
                setSelectedCategory("all");
                setVegOnly(false);
                setSearchQuery("");
              }}
              className="px-4 py-2 rounded-xl bg-[#282828] hover:bg-[#333] border border-[#383838] text-white text-xs font-bold transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
