import React from "react";

export const OrderTypes: React.FC = () => {
  const options = [
    {
      id: "delivery",
      title: "Home Delivery",
      badge: "Direct to Doorstep",
      description:
        "Enjoy piping hot favourites delivered right to your home. Secure tamper-evident packaging keeps food fresh.",
      icon: (
        <svg className="w-8 h-8 text-[#E51D2A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
          />
        </svg>
      ),
      ctaText: "Order Delivery",
    },
    {
      id: "pickup",
      title: "Pickup / Takeaway",
      badge: "Skip the Wait",
      description:
        "Order ahead and collect your freshly prepared meal directly from our kitchen counter. Ideal on the go.",
      icon: (
        <svg className="w-8 h-8 text-[#E51D2A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
          />
        </svg>
      ),
      ctaText: "Select Pickup",
    },
    {
      id: "dine-in",
      title: "Dine-in Experience",
      badge: "Table Service",
      description:
        "Immerse yourself in our warm atmospheric dining room. Order at your table with personalized chef service.",
      icon: (
        <svg className="w-8 h-8 text-[#E51D2A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      ),
      ctaText: "Reserve / Dine-in",
    },
  ];

  return (
    <section id="order-types" className="py-16 bg-[#1A1A1A] border-y border-[#292929]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-[#E51D2A] block mb-2">
            Flexible Fulfilment
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif font-extrabold text-white mb-4">
            How Would You Like to Dine?
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base">
            Choose your preferred order method. Every order is prepared to order with genuine ingredients.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {options.map((opt) => (
            <div
              key={opt.id}
              className="bg-[#242424] hover:bg-[#282828] border border-[#333333] hover:border-[#E51D2A]/60 rounded-2xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 shadow-xl group"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-[#1C1C1C] border border-[#383838] flex items-center justify-center group-hover:scale-110 transition-transform">
                    {opt.icon}
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 px-3 py-1 rounded-full bg-[#1A1A1A] border border-[#333333]">
                    {opt.badge}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-[#E51D2A] transition-colors">
                  {opt.title}
                </h3>
                <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                  {opt.description}
                </p>
              </div>

              <a
                href="#menu"
                className="w-full py-3 px-4 rounded-xl text-center text-sm font-semibold tracking-wide bg-[#1C1C1C] hover:bg-[#E51D2A] text-zinc-200 hover:text-white border border-[#3A3A3A] hover:border-[#E51D2A] transition-all flex items-center justify-center gap-2 group-hover:shadow-lg group-hover:shadow-[#E51D2A]/20"
              >
                <span>{opt.ctaText}</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
