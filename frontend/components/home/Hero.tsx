import React from "react";
import Image from "next/image";

export const Hero: React.FC = () => {
  return (
    <section id="home" className="relative pt-8 pb-16 md:pt-16 md:pb-24 overflow-hidden">
      {/* Background Subtle Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-[#E51D2A]/10 blur-[130px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Headlines & Call to Actions */}
          <div className="lg:col-span-7 text-center lg:text-left">
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#242424] border border-[#383838] mb-6 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#E51D2A] animate-pulse"></span>
              <span className="text-xs uppercase tracking-wider font-semibold text-zinc-300">
                Welcome to Urban Spice
              </span>
            </div>

            {/* Editorial Serif Display Headline */}
            <h1 className="text-4xl sm:text-6xl xl:text-7xl font-serif font-black text-white tracking-tight leading-[1.1] mb-6">
              Bold Flavours. <br />
              <span className="text-[#E51D2A] italic">Unforgettable</span>{" "}
              <span>Moments.</span>
            </h1>

            {/* Supporting Copy */}
            <p className="text-base sm:text-lg lg:text-xl text-zinc-300 max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed mb-8">
              Freshly prepared favourites, made for sharing. From sizzling
              tandoori grills to slow-simmered heritage curries and fragrant dum
              biryanis.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-10">
              <a
                href="#menu"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#E51D2A] hover:bg-[#c91420] text-white font-bold text-base tracking-wide shadow-xl shadow-[#E51D2A]/30 hover:shadow-[#E51D2A]/50 transition-all duration-200 text-center active:scale-95 flex items-center justify-center gap-2"
              >
                <span>Explore Menu</span>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </a>

              <a
                href="#order-types"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#242424] hover:bg-[#2c2c2c] border border-[#3e3e3e] hover:border-zinc-500 text-white font-semibold text-base transition-all duration-200 text-center active:scale-95 flex items-center justify-center gap-2"
              >
                <span>Order Now</span>
                <svg
                  className="w-4 h-4 text-[#E51D2A]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </a>
            </div>

            {/* Value Highlights */}
            <div className="pt-6 border-t border-[#292929] grid grid-cols-3 gap-4 max-w-lg mx-auto lg:mx-0 text-left">
              <div>
                <span className="block text-xl sm:text-2xl font-bold text-white">100%</span>
                <span className="text-xs text-zinc-400">Authentic Spices</span>
              </div>
              <div>
                <span className="block text-xl sm:text-2xl font-bold text-white">Clay Oven</span>
                <span className="text-xs text-zinc-400">Tandoor Charcoal</span>
              </div>
              <div>
                <span className="block text-xl sm:text-2xl font-bold text-white">3 Ways</span>
                <span className="text-xs text-zinc-400">Delivery • Pickup • Dine-in</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Food Photography Showcase */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Outer Glow Ring */}
              <div className="absolute -inset-1.5 bg-gradient-to-tr from-[#E51D2A] to-amber-500 rounded-3xl opacity-25 blur-lg group-hover:opacity-40 transition-opacity"></div>

              {/* Main Image Container */}
              <div className="relative rounded-3xl overflow-hidden border border-[#3a3a3a] shadow-2xl aspect-square w-full bg-[#1e1e1e]">
                <Image
                  src="/images/hero-dish.jpg"
                  alt="Urban Spice Sizzling Tandoori & Curry Specialties"
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 40vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

                {/* Floating Glassmorphic Badge */}
                <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 p-4 rounded-2xl bg-[#1c1c1c]/80 backdrop-blur-md border border-white/10 shadow-xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-[#E51D2A] uppercase tracking-wider block">
                      Chef&apos;s Signature
                    </span>
                    <h2 className="text-sm sm:text-base font-bold text-white">
                      Grand Tandoori & Butter Chicken Platter
                    </h2>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-zinc-400 block">From</span>
                    <span className="text-base sm:text-lg font-black text-white">₹420</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
