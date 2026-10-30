"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useCart } from "@/context/CartContext";
import { formatINR } from "@/lib/currency";

export default function CartPage() {
  const { cartItems, updateQuantity, removeItem, clearCart, subtotal, totalCartCount } =
    useCart();

  return (
    <div className="min-h-screen bg-[#171717] text-white flex flex-col selection:bg-[#E51D2A] selection:text-white">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        {/* Page Breadcrumb & Title */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs text-zinc-400 mb-2">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-[#E51D2A] font-semibold">Your Cart</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-black text-white">
            Review Your Order
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            {totalCartCount} {totalCartCount === 1 ? "item" : "items"} in your basket
          </p>
        </div>

        {cartItems.length === 0 ? (
          /* Empty Cart State */
          <div className="bg-[#242424] border border-[#333333] rounded-3xl p-12 text-center max-w-xl mx-auto my-8">
            <div className="w-20 h-20 rounded-full bg-[#1C1C1C] flex items-center justify-center mx-auto mb-5 text-zinc-500">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Your Cart is Empty</h2>
            <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
              Looks like you haven&apos;t added any delicious dishes yet. Explore our authentic tandoori and curries!
            </p>
            <Link
              href="/#menu"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[#E51D2A] hover:bg-[#c91420] text-white font-bold text-sm tracking-wide shadow-lg shadow-[#E51D2A]/25 transition-all active:scale-95"
            >
              <span>Explore Our Menu</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        ) : (
          /* Active Cart Grid */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Left 8 Cols: Item List */}
            <div className="lg:col-span-8 bg-[#242424] border border-[#333333] rounded-3xl p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#333333]">
                <h2 className="text-lg font-bold text-white">Dishes in Cart</h2>
                <button
                  onClick={clearCart}
                  className="text-xs text-zinc-400 hover:text-rose-400 transition-colors"
                >
                  Clear All
                </button>
              </div>

              <div className="divide-y divide-[#333333]/60 space-y-4">
                {cartItems.map(({ item, quantity }) => {
                  const lineTotal = Number(item.price) * quantity;
                  return (
                    <div
                      key={String(item.id)}
                      className="pt-4 first:pt-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      {/* Image & Title */}
                      <div className="flex items-center gap-4">
                        <div className="relative w-20 h-20 rounded-2xl overflow-hidden shrink-0 bg-[#171717] border border-[#383838]">
                          <Image
                            src={item.image || "/images/hero-dish.jpg"}
                            alt={item.name}
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <div
                              className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center ${
                                item.is_vegetarian ? "border-emerald-500" : "border-rose-600"
                              }`}
                            >
                              <div
                                className={`w-1.5 h-1.5 rounded-full ${
                                  item.is_vegetarian ? "bg-emerald-500" : "bg-rose-600"
                                }`}
                              />
                            </div>
                            <h3 className="font-bold text-white text-base">{item.name}</h3>
                          </div>
                          <p className="text-xs text-zinc-400 line-clamp-1">{item.description}</p>
                          <p className="text-xs font-semibold text-[#E51D2A] mt-1">
                            {formatINR(item.price)} each
                          </p>
                        </div>
                      </div>

                      {/* Controls & Line Total */}
                      <div className="flex items-center justify-between w-full sm:w-auto gap-6 pl-24 sm:pl-0">
                        {/* Quantity Counter */}
                        <div className="flex items-center gap-3 bg-[#1C1C1C] border border-[#383838] rounded-xl px-2.5 py-1">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="w-7 h-7 rounded-lg text-zinc-400 hover:text-white flex items-center justify-center font-bold text-sm"
                            aria-label="Decrease quantity"
                          >
                            -
                          </button>
                          <span className="font-bold text-sm text-white min-w-4 text-center">
                            {quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-7 h-7 rounded-lg text-zinc-400 hover:text-white flex items-center justify-center font-bold text-sm"
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>

                        {/* Line Total */}
                        <div className="text-right min-w-20">
                          <span className="text-base font-extrabold text-white block">
                            {formatINR(lineTotal)}
                          </span>
                        </div>

                        {/* Remove */}
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-2 text-zinc-500 hover:text-rose-400 transition-colors"
                          title="Remove item"
                          aria-label={`Remove ${item.name}`}
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-[#333333] flex items-center justify-between text-xs text-zinc-400">
                <Link href="/#menu" className="hover:text-white flex items-center gap-1.5 font-semibold">
                  <span>← Add more dishes</span>
                </Link>
                <span>Prices shown in Indian Rupees (₹)</span>
              </div>
            </div>

            {/* Right 4 Cols: Order Summary & Checkout Action */}
            <div className="lg:col-span-4 bg-[#242424] border border-[#333333] rounded-3xl p-6 sm:p-8 space-y-6 sticky top-28">
              <h2 className="text-lg font-bold text-white pb-3 border-b border-[#333333]">
                Order Summary
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-zinc-300">
                  <span>Items Subtotal</span>
                  <span className="font-bold text-white">{formatINR(subtotal)}</span>
                </div>

                <div className="flex justify-between text-zinc-400 text-xs">
                  <span>GST (5%)</span>
                  <span>Calculated at checkout</span>
                </div>

                <div className="flex justify-between text-zinc-400 text-xs">
                  <span>Delivery Fee</span>
                  <span>Calculated by fulfilment type</span>
                </div>
              </div>

              <div className="pt-4 border-t border-[#333333] flex justify-between items-baseline">
                <div>
                  <span className="text-xs uppercase tracking-wider text-zinc-400 block font-semibold">
                    Subtotal
                  </span>
                  <span className="text-xs text-zinc-500">Excl. fulfilment fees</span>
                </div>
                <span className="text-2xl font-black text-white">
                  {formatINR(subtotal)}
                </span>
              </div>

              <Link
                href="/checkout"
                className="w-full py-4 rounded-xl bg-[#E51D2A] hover:bg-[#c91420] text-white font-bold text-sm tracking-wide shadow-xl shadow-[#E51D2A]/30 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <span>Proceed to Checkout</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>

              <div className="bg-[#1C1C1C] border border-[#333333] rounded-2xl p-4 text-xs text-zinc-400 space-y-2">
                <div className="flex items-center gap-2 text-zinc-200 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>Fulfilment Options</span>
                </div>
                <p className="text-[11px] leading-relaxed text-zinc-400">
                  Home Delivery (COD), Pickup (Pay at Pickup), or Dine-in (Pay at Table) available at checkout.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
