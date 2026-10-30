"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getOrderDetails } from "@/lib/api";
import { Order } from "@/types/order";
import { formatINR } from "@/lib/currency";

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("orderNumber");
  const isPaymentSuccess = searchParams.get("payment") === "success";

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (!orderNumber) {
      setError("No order number specified.");
      setLoading(false);
      return;
    }

    async function fetchOrder() {
      setLoading(true);
      setError(null);
      const res = await getOrderDetails(orderNumber as string);
      if (res.error) {
        setError(res.error);
      } else if (res.data) {
        setOrder(res.data);
      }
      setLoading(false);
    }

    fetchOrder();
  }, [orderNumber]);

  const handleCopyOrderNumber = () => {
    if (order?.order_number) {
      navigator.clipboard.writeText(order.order_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center max-w-xl mx-auto">
        <div className="w-16 h-16 rounded-full border-4 border-[#E51D2A] border-t-transparent animate-spin mx-auto mb-6"></div>
        <h2 className="text-xl font-bold text-white mb-2">Fetching Your Order...</h2>
        <p className="text-zinc-400 text-sm">Please hold on while we retrieve your confirmation.</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="py-20 text-center max-w-xl mx-auto bg-[#242424] border border-rose-900/50 rounded-3xl p-8">
        <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Order Not Found</h2>
        <p className="text-zinc-400 text-sm mb-6">{error || "Could not retrieve order details."}</p>
        <Link
          href="/"
          className="px-6 py-3 rounded-xl bg-[#E51D2A] text-white text-sm font-bold shadow-md"
        >
          Return to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto w-full space-y-8">
      {/* Top Hero Confirmation Banner */}
      <div className="bg-[#242424] border border-[#333333] rounded-3xl p-8 sm:p-12 text-center shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-28 bg-[#E51D2A]/10 blur-3xl pointer-events-none -z-10" />

        <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-500/10">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <span className="text-xs uppercase tracking-widest font-bold text-[#E51D2A] block mb-2">
          Order Successfully Placed
        </span>
        <h1 className="text-3xl sm:text-5xl font-serif font-black text-white mb-3">
          Thank You, {order.customer_name}!
        </h1>
        <p className="text-zinc-300 text-sm sm:text-base max-w-lg mx-auto mb-6">
          Your order has been received by our kitchen staff and is currently{" "}
          <span className="text-emerald-400 font-bold uppercase">{order.order_status_display}</span>.
        </p>

        {/* Order Number Box */}
        <div className="inline-flex items-center gap-3 bg-[#1A1A1A] border border-[#3A3A3A] px-5 py-3 rounded-2xl">
          <div className="text-left">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold block">
              Order Reference
            </span>
            <span className="text-base sm:text-lg font-mono font-black text-white tracking-wider">
              {order.order_number}
            </span>
          </div>

          <button
            onClick={handleCopyOrderNumber}
            className="p-2 rounded-xl bg-[#282828] hover:bg-[#333] text-zinc-300 hover:text-white transition-colors"
            title="Copy Order Number"
            aria-label="Copy Order Number"
          >
            {copied ? (
              <span className="text-xs text-emerald-400 font-bold px-1">Copied!</span>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Two Column Layout: Order Details & Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Left: Fulfilment Details & Timeline */}
        <div className="bg-[#242424] border border-[#333333] rounded-3xl p-6 sm:p-8 space-y-6">
          <h2 className="text-lg font-bold text-white border-b border-[#333333] pb-3">
            Fulfilment Information
          </h2>

          <div className="space-y-4 text-xs sm:text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-400">Order Method:</span>
              <span className="font-bold text-white px-2.5 py-0.5 rounded-full bg-[#1A1A1A] border border-[#383838]">
                {order.order_type_display}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-zinc-400">Customer Phone:</span>
              <span className="font-semibold text-white">{order.customer_phone}</span>
            </div>

            {order.order_type === "DELIVERY" && (
              <>
                <div className="pt-2 border-t border-[#333333]">
                  <span className="text-zinc-400 block mb-1">Delivery Address:</span>
                  <p className="text-white font-medium leading-relaxed bg-[#1C1C1C] p-3 rounded-xl border border-[#383838]">
                    {order.delivery_address}, {order.city} — {order.pincode}
                    {order.landmark && <span className="block text-zinc-400 text-xs mt-1">Landmark: {order.landmark}</span>}
                  </p>
                </div>
              </>
            )}

            {order.order_type === "PICKUP" && (
              <div className="pt-2 border-t border-[#333333]">
                <span className="text-zinc-400 block mb-1">Pickup Information:</span>
                <p className="text-white font-medium bg-[#1C1C1C] p-3 rounded-xl border border-[#383838]">
                  Collect at Urban Spice Counter.
                  {order.pickup_time_preference && (
                    <span className="block text-[#E51D2A] text-xs mt-1">Preferred Time: {order.pickup_time_preference}</span>
                  )}
                </p>
              </div>
            )}

            {order.order_type === "DINE_IN" && (
              <div className="pt-2 border-t border-[#333333]">
                <span className="text-zinc-400 block mb-1">Dine-in Information:</span>
                <p className="text-white font-medium bg-[#1C1C1C] p-3 rounded-xl border border-[#383838]">
                  Table Service: {order.table_number || "Walk-in Seat Assigned upon arrival"}
                </p>
              </div>
            )}

            {order.customer_note && (
              <div className="pt-2 border-t border-[#333333]">
                <span className="text-zinc-400 block mb-1">Special Instructions:</span>
                <p className="text-zinc-300 italic text-xs">&ldquo;{order.customer_note}&rdquo;</p>
              </div>
            )}

            <div className="pt-2 border-t border-[#333333] flex justify-between items-start">
              <span className="text-zinc-400">Payment:</span>
              <div className="text-right space-y-1">
                <span className="font-bold text-white block">{order.payment_method_display}</span>
                {order.payment_status === "PAID" ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-950/70 border border-emerald-500/40 text-emerald-400">
                    <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Paid {order.payment_method === "RAZORPAY" ? "(Razorpay Verified)" : ""}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-950/70 border border-amber-500/40 text-amber-300">
                    <span>⏳</span>
                    <span>{order.payment_status_display}</span>
                  </span>
                )}
                {order.razorpay_payment_id && (
                  <span className="block text-[10px] font-mono text-zinc-400">
                    Payment ID: {order.razorpay_payment_id}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Items Snapshot & Financials */}
        <div className="bg-[#242424] border border-[#333333] rounded-3xl p-6 sm:p-8 space-y-6">
          <h2 className="text-lg font-bold text-white border-b border-[#333333] pb-3">
            Ordered Dishes
          </h2>

          <div className="space-y-3 divide-y divide-[#333333]/60">
            {order.items.map((item) => (
              <div key={item.id} className="pt-3 first:pt-0 flex items-center justify-between text-xs sm:text-sm">
                <div>
                  <span className="font-bold text-white block">{item.item_name_snapshot}</span>
                  <span className="text-zinc-400 text-xs">
                    {item.quantity} x {formatINR(item.unit_price_snapshot)}
                  </span>
                </div>
                <span className="font-bold text-white">{formatINR(item.line_total)}</span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-[#333333] space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between text-zinc-300">
              <span>Items Subtotal</span>
              <span className="font-semibold text-white">{formatINR(order.subtotal)}</span>
            </div>

            <div className="flex justify-between text-zinc-400">
              <span>Delivery Fee</span>
              <span>{Number(order.delivery_fee) === 0 ? "FREE" : formatINR(order.delivery_fee)}</span>
            </div>

            <div className="flex justify-between text-zinc-400">
              <span>Taxes (5% GST)</span>
              <span>{formatINR(order.tax_amount)}</span>
            </div>

            <div className="pt-3 border-t border-[#333333] flex justify-between items-baseline">
              <span className="font-bold text-white text-base">Total Amount</span>
              <span className="text-2xl font-black text-[#E51D2A]">{formatINR(order.total_amount)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action */}
      <div className="text-center pt-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[#E51D2A] hover:bg-[#c91420] text-white font-bold text-sm tracking-wide shadow-xl shadow-[#E51D2A]/30 transition-all active:scale-95"
        >
          <span>Return to Homepage</span>
        </Link>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <div className="min-h-screen bg-[#171717] text-white flex flex-col selection:bg-[#E51D2A] selection:text-white">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <Suspense
          fallback={
            <div className="py-20 text-center">
              <div className="w-16 h-16 rounded-full border-4 border-[#E51D2A] border-t-transparent animate-spin mx-auto mb-4" />
              <p className="text-zinc-400 text-sm">Loading order details...</p>
            </div>
          }
        >
          <OrderSuccessContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
