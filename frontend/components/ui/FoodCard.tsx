"use client";

import React, { useState } from "react";
import Image from "next/image";
import { MenuItem } from "@/types/menu";
import { formatINR } from "@/lib/currency";

interface FoodCardProps {
  item: MenuItem;
  onAddToCart?: (item: MenuItem) => void;
}

export const FoodCard: React.FC<FoodCardProps> = ({ item, onAddToCart }) => {
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = () => {
    setIsAdding(true);
    if (onAddToCart) {
      onAddToCart(item);
    }
    setTimeout(() => {
      setIsAdding(false);
    }, 800);
  };

  return (
    <div className="group bg-[#242424] hover:bg-[#282828] border border-[#333333] hover:border-[#E51D2A]/60 rounded-2xl overflow-hidden transition-all duration-300 flex flex-col justify-between shadow-lg hover:shadow-2xl hover:shadow-[#E51D2A]/10">
      <div>
        {/* Food Image Container */}
        <div className="relative w-full h-52 sm:h-56 bg-[#1a1a1a] overflow-hidden">
          <Image
            src={item.image || "/images/hero-dish.jpg"}
            alt={item.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#242424] via-transparent to-black/40"></div>

          {/* Top Badges */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            {/* Authentic Indian Veg / Non-Veg Icon */}
            <div
              className={`w-5 h-5 rounded-sm border flex items-center justify-center bg-black/60 backdrop-blur-sm ${
                item.is_vegetarian ? "border-emerald-500" : "border-rose-600"
              }`}
              title={item.is_vegetarian ? "Vegetarian" : "Non-Vegetarian"}
            >
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  item.is_vegetarian ? "bg-emerald-500" : "bg-rose-600"
                }`}
              ></div>
            </div>

            {item.badge && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-[#E51D2A] text-white shadow-md">
                {item.badge}
              </span>
            )}
          </div>

          {/* Spice Level Indicator */}
          {item.spice_level && (
            <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/70 backdrop-blur-md text-zinc-300 border border-white/10">
              🌶️ {item.spice_level}
            </div>
          )}
        </div>

        {/* Card Content */}
        <div className="p-5">
          <h3 className="text-lg font-bold text-white group-hover:text-[#E51D2A] transition-colors mb-1.5 line-clamp-1">
            {item.name}
          </h3>
          <p className="text-zinc-400 text-xs sm:text-sm line-clamp-2 leading-relaxed mb-4">
            {item.description}
          </p>
        </div>
      </div>

      {/* Card Footer: Price and Add Button */}
      <div className="px-5 pb-5 pt-0 flex items-center justify-between border-t border-[#333333]/60 mt-auto">
        <div className="pt-3">
          <span className="text-[10px] uppercase tracking-wider text-zinc-400 block font-medium">
            Price
          </span>
          <span className="text-lg font-extrabold text-white tracking-tight">
            {formatINR(item.price)}
          </span>
        </div>

        <button
          onClick={handleAdd}
          disabled={!item.is_available || isAdding}
          className={`mt-3 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold tracking-wide transition-all duration-200 flex items-center gap-1.5 active:scale-95 ${
            isAdding
              ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30"
              : item.is_available
              ? "bg-[#E51D2A] hover:bg-[#c91420] text-white shadow-md hover:shadow-lg hover:shadow-[#E51D2A]/30"
              : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
          }`}
          aria-label={`Add ${item.name} to cart`}
        >
          {isAdding ? (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              <span>Added</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add to Cart</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
