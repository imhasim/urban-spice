"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { formatINR } from "@/lib/currency";
import { useCart } from "@/context/CartContext";

export const CartDrawer: React.FC = () => {
  const {
    cartItems,
    isCartOpen,
    closeCart,
    updateQuantity,
    removeItem,
    subtotal,
  } = useCart();

  if (!isCartOpen) return null;

  const totalCount = cartItems.reduce((acc, cur) => acc + cur.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={closeCart}
        className="absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#1C1C1C] border-l border-[#2E2E2E] flex flex-col shadow-2xl">
          {/* Header */}
          <div className="p-6 border-b border-[#2B2B2B] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E51D2A]"></span>
              <h3 className="text-lg font-bold text-white tracking-wide">
                Your Order Cart
              </h3>
              <span className="text-xs text-zinc-400 bg-[#282828] px-2 py-0.5 rounded-full">
                {totalCount} items
              </span>
            </div>

            <button
              onClick={closeCart}
              className="p-2 rounded-xl text-zinc-400 hover:text-white bg-[#262626] hover:bg-[#303030] transition-colors"
              aria-label="Close cart"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cartItems.length === 0 ? (
              <div className="text-center py-20 text-zinc-500">
                <div className="w-16 h-16 rounded-full bg-[#242424] flex items-center justify-center mx-auto mb-4 text-zinc-600">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    />
                  </svg>
                </div>
                <p className="text-base font-semibold text-zinc-300 mb-1">Your cart is empty</p>
                <p className="text-xs text-zinc-500 mb-6">
                  Explore our signature dishes and add your favourites.
                </p>
                <button
                  onClick={closeCart}
                  className="px-5 py-2.5 rounded-xl bg-[#E51D2A] text-white text-xs font-bold"
                >
                  Browse Menu
                </button>
              </div>
            ) : (
              cartItems.map(({ item, quantity }) => (
                <div
                  key={String(item.id)}
                  className="p-3.5 bg-[#242424] border border-[#333333] rounded-2xl flex items-center gap-3.5"
                >
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-[#171717]">
                    <Image
                      src={item.image || "/images/hero-dish.jpg"}
                      alt={item.name}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-white truncate mb-0.5">
                      {item.name}
                    </h4>
                    <p className="text-xs font-semibold text-[#E51D2A]">
                      {formatINR(item.price)}
                    </p>

                    {/* Quantity Selector */}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-6 h-6 rounded-md bg-[#1c1c1c] hover:bg-[#333] text-zinc-300 flex items-center justify-center text-xs font-bold border border-[#383838]"
                        aria-label="Decrease quantity"
                      >
                        -
                      </button>
                      <span className="text-xs font-bold text-white px-1">
                        {quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-6 h-6 rounded-md bg-[#1c1c1c] hover:bg-[#333] text-zinc-300 flex items-center justify-center text-xs font-bold border border-[#383838]"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-1.5 text-zinc-500 hover:text-rose-400 transition-colors"
                    title="Remove item"
                    aria-label={`Remove ${item.name}`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer Subtotal & Actions */}
          {cartItems.length > 0 && (
            <div className="p-6 border-t border-[#2B2B2B] bg-[#171717] space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-400">Cart Subtotal</span>
                <span className="text-lg font-black text-white">
                  {formatINR(subtotal)}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500">
                Taxes & delivery fee will be calculated at checkout based on fulfilment type.
              </p>

              <div className="flex flex-col gap-2.5 pt-2">
                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className="w-full py-3.5 rounded-xl bg-[#E51D2A] hover:bg-[#c91420] text-white font-bold text-sm tracking-wide shadow-lg shadow-[#E51D2A]/25 transition-all text-center active:scale-95 flex items-center justify-center gap-2"
                >
                  <span>Proceed to Checkout</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>

                <Link
                  href="/cart"
                  onClick={closeCart}
                  className="w-full py-2.5 rounded-xl bg-[#242424] hover:bg-[#2c2c2c] border border-[#383838] text-zinc-300 hover:text-white font-semibold text-xs tracking-wide transition-all text-center"
                >
                  View Full Cart & Edit Items
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
