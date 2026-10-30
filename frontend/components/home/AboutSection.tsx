import React from "react";
import Image from "next/image";

export const AboutSection: React.FC = () => {
  return (
    <section id="about" className="py-20 bg-[#1A1A1A] border-t border-[#292929]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Atmospheric Restaurant Visual */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden border border-[#383838] shadow-2xl aspect-[4/5] bg-[#1e1e1e]">
              <Image
                src="/images/hero-dish.jpg"
                alt="Urban Spice Dining Experience"
                fill
                sizes="(max-width: 768px) 100vw, 40vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

              <div className="absolute bottom-6 left-6 right-6 p-5 rounded-2xl bg-[#141414]/85 backdrop-blur-md border border-white/10">
                <span className="text-[#E51D2A] text-xs font-bold uppercase tracking-wider block mb-1">
                  Established Kitchen
                </span>
                <p className="text-white font-serif font-bold text-lg">
                  &ldquo;Every plate tells the story of time-honoured Indian gastronomy.&rdquo;
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Story & Hours */}
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#242424] border border-[#333333] text-xs font-semibold uppercase tracking-wider text-[#E51D2A] mb-4">
              <span>Our Culinary Journey</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-serif font-black text-white leading-tight mb-6">
              The Art of Slow Charcoal & Whole Ground Spices
            </h2>

            <div className="space-y-4 text-zinc-300 text-sm sm:text-base leading-relaxed mb-8">
              <p>
                Urban Spice was conceived with a clear vision: to celebrate the rich,
                aromatic heritage of authentic Indian kitchens while elevating every dish with
                modern culinary excellence.
              </p>
              <p>
                From our 18-hour slow-simmered black dal to hand-marinated kebabs char-grilled in a
                traditional clay tandoor, we refuse to take shortcuts. Every gravy begins with
                whole roasted spices stone-ground daily in our kitchen.
              </p>
            </div>

            {/* Opening Hours & Key Details Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#242424] border border-[#333333] rounded-2xl p-6">
              <div>
                <div className="flex items-center gap-2 mb-2 text-[#E51D2A]">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <h3 className="font-bold text-white text-sm uppercase tracking-wider">
                    Opening Hours
                  </h3>
                </div>
                <ul className="text-xs sm:text-sm text-zinc-300 space-y-1">
                  <li className="flex justify-between">
                    <span className="text-zinc-400">Monday – Thursday:</span>
                    <span>12:00 PM – 11:00 PM</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-zinc-400">Friday – Sunday:</span>
                    <span>12:00 PM – 11:30 PM</span>
                  </li>
                </ul>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2 text-[#E51D2A]">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <h3 className="font-bold text-white text-sm uppercase tracking-wider">
                    Our Location
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-zinc-300">
                  12 Rajouri Garden Heritage Square, <br />
                  Ring Road, New Delhi — 110027
                </p>
                <p className="text-xs text-zinc-400 mt-1">
                  Valet parking available for dine-in guests.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
