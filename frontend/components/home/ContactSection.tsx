"use client";

import React, { useState } from "react";

export const ContactSection: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    orderType: "Dine-in",
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;
    setSubmitted(true);
  };

  return (
    <section id="contact" className="py-20 bg-[#171717] border-t border-[#292929]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left: Contact Info & Map Details */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#242424] border border-[#333333] text-xs font-semibold uppercase tracking-wider text-[#E51D2A] mb-4">
                <span>Get in Touch</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-serif font-black text-white mb-6">
                Reserve a Table or Reach Our Team
              </h2>
              <p className="text-zinc-400 text-sm sm:text-base leading-relaxed mb-8">
                Whether you wish to reserve a table for a celebration, inquire about party catering,
                or confirm delivery coverage, we are here to assist.
              </p>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#242424] border border-[#333333] flex items-center justify-center shrink-0 text-[#E51D2A]">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-1">
                      Direct Phone
                    </h3>
                    <p className="text-base font-bold text-white">+91 98765 43210</p>
                    <p className="text-xs text-zinc-500">Available during kitchen operating hours</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#242424] border border-[#333333] flex items-center justify-center shrink-0 text-[#E51D2A]">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-1">
                      Email Address
                    </h3>
                    <p className="text-base font-bold text-white">hospitality@urbanspice.in</p>
                    <p className="text-xs text-zinc-500">General enquiries & group bookings</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-[#292929] text-xs text-zinc-500">
              Urban Spice Restaurant Private Limited • GST Registered
            </div>
          </div>

          {/* Right: Interactive Table / Enquiry Form */}
          <div className="lg:col-span-7">
            <div className="bg-[#242424] border border-[#333333] rounded-3xl p-6 sm:p-10 shadow-2xl">
              {submitted ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center mb-4">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Thank You, {formData.name}!</h3>
                  <p className="text-zinc-400 text-sm max-w-md mx-auto mb-6">
                    We have received your enquiry for <span className="text-white font-medium">{formData.orderType}</span>. Our dining coordinator will contact your phone ({formData.phone}) shortly.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({ name: "", phone: "", orderType: "Dine-in", notes: "" });
                    }}
                    className="px-6 py-2.5 rounded-xl bg-[#1c1c1c] hover:bg-[#2c2c2c] border border-[#383838] text-white text-xs font-semibold"
                  >
                    Submit Another Request
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-1">
                    Send Table Enquiry
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-400 mb-6">
                    Leave your details and our host will arrange your reservation or query.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-2">
                        Your Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Rahul Sharma"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-[#1A1A1A] border border-[#383838] focus:border-[#E51D2A] rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-2">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="+91 98765 00000"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full bg-[#1A1A1A] border border-[#383838] focus:border-[#E51D2A] rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-2">
                      Fulfilment Interest
                    </label>
                    <select
                      value={formData.orderType}
                      onChange={(e) => setFormData({ ...formData, orderType: e.target.value })}
                      className="w-full bg-[#1A1A1A] border border-[#383838] focus:border-[#E51D2A] rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-colors cursor-pointer"
                    >
                      <option value="Dine-in">Dine-in Table Reservation</option>
                      <option value="Pickup">Pickup / Takeaway Query</option>
                      <option value="Delivery">Home Delivery Query</option>
                      <option value="Catering">Event Catering & Bulk Orders</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-2">
                      Special Request or Notes
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Number of guests, preferred timing, or dietary preferences..."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full bg-[#1A1A1A] border border-[#383838] focus:border-[#E51D2A] rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none transition-colors resize-none"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 rounded-xl bg-[#E51D2A] hover:bg-[#c91420] text-white font-bold text-sm tracking-wide shadow-lg shadow-[#E51D2A]/25 transition-all duration-200 active:scale-95"
                  >
                    Submit Enquiry
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
