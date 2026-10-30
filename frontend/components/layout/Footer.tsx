import React from "react";
import Link from "next/link";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#121212] border-t border-[#262626] text-zinc-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          {/* Brand & Description */}
          <div className="lg:col-span-2">
            <Link href="#home" className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#E51D2A] to-[#8F0E16] flex items-center justify-center shadow-md">
                <span className="text-white font-black text-lg">US</span>
              </div>
              <span className="text-xl font-black tracking-wider text-white">
                URBAN <span className="text-[#E51D2A]">SPICE</span>
              </span>
            </Link>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-sm leading-relaxed mb-6">
              Bold Flavours. Unforgettable Moments. Handcrafted North Indian & Tandoori
              delicacies made fresh for Delivery, Pickup, and Dine-in.
            </p>
            <div className="flex items-center gap-3 text-xs text-zinc-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Kitchen Active • Daily 12:00 PM – 11:30 PM</span>
            </div>
          </div>

          {/* Quick Navigation */}
          <div>
            <h4 className="text-xs uppercase tracking-widest text-white font-bold mb-4">
              Explore
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <a href="#home" className="hover:text-white transition-colors">
                  Home
                </a>
              </li>
              <li>
                <a href="#menu" className="hover:text-white transition-colors">
                  Our Menu
                </a>
              </li>
              <li>
                <a href="#order-types" className="hover:text-white transition-colors">
                  Fulfilment Types
                </a>
              </li>
              <li>
                <a href="#about" className="hover:text-white transition-colors">
                  About Our Kitchen
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:text-white transition-colors">
                  Contact & Location
                </a>
              </li>
            </ul>
          </div>

          {/* Fulfilment & Policies */}
          <div>
            <h4 className="text-xs uppercase tracking-widest text-white font-bold mb-4">
              Ordering
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E51D2A]"></span>
                <span>Home Delivery</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E51D2A]"></span>
                <span>Pickup / Takeaway</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E51D2A]"></span>
                <span>Dine-in Table Booking</span>
              </li>
              <li className="text-zinc-500 pt-2">
                Prices in Indian Rupees (₹)
              </li>
            </ul>
          </div>

          {/* Payments & Compliance */}
          <div>
            <h4 className="text-xs uppercase tracking-widest text-white font-bold mb-4">
              Payment Methods
            </h4>
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-[#1a1a1a] border border-[#2e2e2e] text-xs">
                <span className="text-white font-semibold block mb-0.5">Online Payments</span>
                <span className="text-zinc-400">Razorpay (Test Mode active)</span>
              </div>
              <div className="p-3 rounded-xl bg-[#1a1a1a] border border-[#2e2e2e] text-xs">
                <span className="text-white font-semibold block mb-0.5">Offline Payment</span>
                <span className="text-zinc-400">Cash on Delivery & Pay at Counter</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Policies */}
        <div className="pt-8 border-t border-[#222222] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <p>
            &copy; 2026 Urban Spice Restaurant. All rights reserved. Built according to PRD V1.0 specifications.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/admin" className="text-zinc-500 hover:text-[#E51D2A] transition-colors">
              Staff Portal
            </Link>
            <span className="hover:text-zinc-400 transition-colors cursor-pointer">Privacy Policy</span>
            <span className="hover:text-zinc-400 transition-colors cursor-pointer">Terms of Service</span>
            <span className="hover:text-zinc-400 transition-colors cursor-pointer">Refund Policy</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
