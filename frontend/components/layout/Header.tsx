"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";

interface HeaderProps {
  cartCount?: number;
  onOpenCart?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ cartCount, onOpenCart }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const cart = useCart();

  const effectiveCartCount = cartCount !== undefined ? cartCount : cart.totalCartCount;
  const handleOpenCart = onOpenCart || cart.openCart;

  const navLinks = [
    { name: "Home", href: "/#home" },
    { name: "Menu", href: "/#menu" },
    { name: "Order Types", href: "/#order-types" },
    { name: "About", href: "/#about" },
    { name: "Contact", href: "/#contact" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#171717]/95 backdrop-blur-md border-b border-[#292929] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo */}
          <Link
            href="/"
            className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E51D2A] rounded-lg p-1"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E51D2A] to-[#8F0E16] flex items-center justify-center shadow-lg shadow-[#E51D2A]/30 group-hover:scale-105 transition-transform">
              <span className="text-white font-black text-xl tracking-tighter">US</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xl sm:text-2xl font-black tracking-wider text-white">
                URBAN <span className="text-[#E51D2A]">SPICE</span>
              </span>
              <span className="text-[10px] tracking-[0.25em] text-zinc-400 uppercase font-semibold">
                Kitchen & Bar
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-sm font-medium text-zinc-300 hover:text-white transition-colors relative py-1 hover:after:w-full after:w-0 after:h-0.5 after:bg-[#E51D2A] after:absolute after:bottom-0 after:left-0 after:transition-all"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Action Area: Cart Button + Order Now CTA */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Cart Button */}
            <button
              onClick={handleOpenCart}
              className="relative p-2.5 rounded-xl bg-[#242424] hover:bg-[#2d2d2d] border border-[#383838] hover:border-[#E51D2A]/60 text-white transition-all active:scale-95 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#E51D2A]"
              aria-label="View Cart"
            >
              <svg
                className="w-5 h-5 text-zinc-200"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>

              {effectiveCartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#E51D2A] text-white text-[11px] font-bold flex items-center justify-center shadow-md animate-pulse">
                  {effectiveCartCount}
                </span>
              )}
            </button>

            {/* Quick Order Now Button */}
            <Link
              href="/checkout"
              className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E51D2A] hover:bg-[#c91420] text-white text-sm font-bold tracking-wide transition-all shadow-lg shadow-[#E51D2A]/25 active:scale-95"
            >
              <span>Order Now</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>

            {/* Mobile Menu Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2.5 rounded-xl bg-[#242424] border border-[#383838] text-zinc-300 hover:text-white transition-colors focus:outline-none"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#292929] bg-[#1a1a1a] px-4 pt-4 pb-6 space-y-3 animate-in fade-in slide-in-from-top-4 duration-200">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-base font-medium text-zinc-200 hover:text-white hover:bg-[#242424] transition-colors"
            >
              {link.name}
            </Link>
          ))}
          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="/cart"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#242424] text-zinc-200 font-bold text-sm border border-[#383838]"
            >
              View Cart ({effectiveCartCount})
            </Link>
            <Link
              href="/checkout"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#E51D2A] text-white font-bold text-sm shadow-md"
            >
              Order Now
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
