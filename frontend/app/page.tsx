"use client";

import React from "react";
import { Header } from "@/components/layout/Header";
import { Hero } from "@/components/home/Hero";
import { OrderTypes } from "@/components/home/OrderTypes";
import { PopularDishes } from "@/components/home/PopularDishes";
import { AboutSection } from "@/components/home/AboutSection";
import { ContactSection } from "@/components/home/ContactSection";
import { Footer } from "@/components/layout/Footer";
import { useCart } from "@/context/CartContext";

export default function Home() {
  const { addToCart } = useCart();

  return (
    <div className="min-h-screen bg-[#171717] text-white flex flex-col selection:bg-[#E51D2A] selection:text-white">
      {/* Responsive Header */}
      <Header />

      {/* Main Homepage Flow */}
      <main className="flex-1">
        {/* 1. Hero Section */}
        <Hero />

        {/* 2. Three Order Types (Delivery, Pickup, Dine-in) */}
        <OrderTypes />

        {/* 3. Popular Dishes Grid with Category & Search Filters */}
        <PopularDishes onAddToCart={addToCart} />

        {/* 4. Restaurant About & Hours Section */}
        <AboutSection />

        {/* 5. Contact & Table Enquiry Section */}
        <ContactSection />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
