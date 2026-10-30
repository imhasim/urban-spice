"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { formatINR } from "@/lib/currency";
import {
  staffLogin,
  staffGetOrders,
  staffGetDashboard,
  staffUpdateOrderStatus,
  staffUpdateOrderPayment,
  DashboardMetrics,
} from "@/lib/api";
import { Order, OrderStatus } from "@/types/order";

const STORAGE_TOKEN_KEY = "urban_spice_staff_token";
const STORAGE_USER_KEY = "urban_spice_staff_user";

// Distinctive badges for payment statuses (PENDING vs PAID vs FAILED)
function PaymentBadge({ status, display }: { status: string; display: string }) {
  if (status === "PAID") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-950/70 border border-emerald-500/40 text-emerald-400">
        <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
        <span>{display || "Paid"}</span>
      </span>
    );
  }
  if (status === "PENDING") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-950/70 border border-amber-500/40 text-amber-300">
        <svg className="w-3 h-3 text-amber-300 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <circle cx="12" cy="12" r="9" strokeWidth={2} />
          <path strokeLinecap="round" strokeWidth={2} d="M12 7v5l3 2" />
        </svg>
        <span>{display || "Pending"}</span>
      </span>
    );
  }
  if (status === "FAILED") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-950/70 border border-rose-500/40 text-rose-300">
        <svg className="w-3 h-3 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
        <span>{display || "Failed"}</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-800 border border-zinc-700 text-zinc-300">
      {display || status}
    </span>
  );
}

// Permitted status transitions per order type
const STATUS_ACTIONS: Record<string, Record<string, { label: string; nextStatus: OrderStatus; style: string }[]>> = {
  DELIVERY: {
    PLACED: [
      { label: "Confirm Order", nextStatus: "CONFIRMED", style: "bg-blue-600 hover:bg-blue-700 text-white" },
      { label: "Cancel Order", nextStatus: "CANCELLED", style: "bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700" },
    ],
    CONFIRMED: [
      { label: "Start Preparing", nextStatus: "PREPARING", style: "bg-amber-600 hover:bg-amber-700 text-white" },
      { label: "Cancel Order", nextStatus: "CANCELLED", style: "bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700" },
    ],
    PREPARING: [
      { label: "Mark as Ready", nextStatus: "READY", style: "bg-purple-600 hover:bg-purple-700 text-white" },
      { label: "Send Out for Delivery", nextStatus: "OUT_FOR_DELIVERY", style: "bg-indigo-600 hover:bg-indigo-700 text-white" },
      { label: "Cancel Order", nextStatus: "CANCELLED", style: "bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700" },
    ],
    READY: [
      { label: "Send Out for Delivery", nextStatus: "OUT_FOR_DELIVERY", style: "bg-indigo-600 hover:bg-indigo-700 text-white" },
      { label: "Mark Delivered / Complete", nextStatus: "COMPLETED", style: "bg-emerald-600 hover:bg-emerald-700 text-white" },
      { label: "Cancel Order", nextStatus: "CANCELLED", style: "bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700" },
    ],
    OUT_FOR_DELIVERY: [
      { label: "Mark as Delivered & Complete", nextStatus: "COMPLETED", style: "bg-emerald-600 hover:bg-emerald-700 text-white" },
      { label: "Cancel Order", nextStatus: "CANCELLED", style: "bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700" },
    ],
  },
  PICKUP: {
    PLACED: [
      { label: "Confirm Order", nextStatus: "CONFIRMED", style: "bg-blue-600 hover:bg-blue-700 text-white" },
      { label: "Cancel Order", nextStatus: "CANCELLED", style: "bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700" },
    ],
    CONFIRMED: [
      { label: "Start Preparing", nextStatus: "PREPARING", style: "bg-amber-600 hover:bg-amber-700 text-white" },
      { label: "Cancel Order", nextStatus: "CANCELLED", style: "bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700" },
    ],
    PREPARING: [
      { label: "Mark Ready for Pickup", nextStatus: "READY", style: "bg-purple-600 hover:bg-purple-700 text-white" },
      { label: "Cancel Order", nextStatus: "CANCELLED", style: "bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700" },
    ],
    READY: [
      { label: "Mark as Collected & Complete", nextStatus: "COMPLETED", style: "bg-emerald-600 hover:bg-emerald-700 text-white" },
      { label: "Cancel Order", nextStatus: "CANCELLED", style: "bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700" },
    ],
  },
  DINE_IN: {
    PLACED: [
      { label: "Confirm Table Order", nextStatus: "CONFIRMED", style: "bg-blue-600 hover:bg-blue-700 text-white" },
      { label: "Cancel Order", nextStatus: "CANCELLED", style: "bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700" },
    ],
    CONFIRMED: [
      { label: "Send to Kitchen (Preparing)", nextStatus: "PREPARING", style: "bg-amber-600 hover:bg-amber-700 text-white" },
      { label: "Cancel Order", nextStatus: "CANCELLED", style: "bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700" },
    ],
    PREPARING: [
      { label: "Mark Food Ready / Served", nextStatus: "READY", style: "bg-purple-600 hover:bg-purple-700 text-white" },
      { label: "Cancel Order", nextStatus: "CANCELLED", style: "bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700" },
    ],
    READY: [
      { label: "Complete Dining Session", nextStatus: "COMPLETED", style: "bg-emerald-600 hover:bg-emerald-700 text-white" },
      { label: "Cancel Order", nextStatus: "CANCELLED", style: "bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700" },
    ],
  },
};

export default function AdminDashboardPage() {
  const [token, setToken] = useState<string | null>(null);
  const [staffUsername, setStaffUsername] = useState<string>("");
  const [isMounted, setIsMounted] = useState<boolean>(false);

  // Login form state
  const [loginUser, setLoginUser] = useState("admin");
  const [loginPass, setLoginPass] = useState("admin123");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Dashboard Data State
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Order Details Modal State
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);
  const [updatingPayment, setUpdatingPayment] = useState<boolean>(false);
  const [showPaymentConfirm, setShowPaymentConfirm] = useState<boolean>(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const selectedOrderIdRef = useRef<number | null>(null);

  // Keep ref in sync with selectedOrder
  useEffect(() => {
    selectedOrderIdRef.current = selectedOrder?.id ?? null;
  }, [selectedOrder]);

  // Close order detail modal and clear notices
  const closeModal = useCallback(() => {
    selectedOrderIdRef.current = null;
    setSelectedOrder(null);
    setShowPaymentConfirm(false);
    setStatusNotice(null);
  }, []);

  // Listen for Escape key to close confirmation dialog or modal
  useEffect(() => {
    if (!selectedOrder) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showPaymentConfirm) {
          setShowPaymentConfirm(false);
        } else {
          closeModal();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedOrder, showPaymentConfirm, closeModal]);

  // 1. Initialize Authentication Token from localStorage
  useEffect(() => {
    setIsMounted(true);
    const savedToken = localStorage.getItem(STORAGE_TOKEN_KEY);
    const savedUser = localStorage.getItem(STORAGE_USER_KEY);
    if (savedToken) {
      setToken(savedToken);
      if (savedUser) setStaffUsername(savedUser);
    }
  }, []);

  // 2. Fetch Dashboard & Orders
  const loadData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);

    // Fetch dashboard metrics
    const dashRes = await staffGetDashboard(token);
    if (dashRes.data) {
      setMetrics(dashRes.data.metrics);
    }

    // Fetch filtered orders
    const ordersRes = await staffGetOrders(token, {
      status: statusFilter,
      type: typeFilter,
      search: searchQuery,
    });

    if (ordersRes.error) {
      if (ordersRes.status === 401 || ordersRes.status === 403) {
        // Token invalid or expired
        setToken(null);
        localStorage.removeItem(STORAGE_TOKEN_KEY);
        localStorage.removeItem(STORAGE_USER_KEY);
        setError("Session expired or unauthorized. Please log in again.");
      } else {
        setError(ordersRes.error);
      }
    } else if (ordersRes.data) {
      setOrders(ordersRes.data);
      // If modal open, update selectedOrder with fresh data only if still open
      const currentSelectedId = selectedOrderIdRef.current;
      if (currentSelectedId) {
        const refreshed = ordersRes.data.find((o) => o.id === currentSelectedId);
        if (refreshed) {
          setSelectedOrder((prev) => (prev && prev.id === currentSelectedId ? refreshed : prev));
        }
      }
    }
    setLoading(false);
  }, [token, statusFilter, typeFilter, searchQuery]);

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token, statusFilter, typeFilter, searchQuery, loadData]);

  // 3. Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError(null);

    const res = await staffLogin({
      username: loginUser.trim(),
      password: loginPass.trim(),
    });

    if (res.error) {
      setLoginError(res.error);
    } else if (res.data) {
      setToken(res.data.token);
      setStaffUsername(res.data.user.username);
      localStorage.setItem(STORAGE_TOKEN_KEY, res.data.token);
      localStorage.setItem(STORAGE_USER_KEY, res.data.user.username);
    }
    setIsLoggingIn(false);
  };

  // 4. Handle Logout
  const handleLogout = () => {
    setToken(null);
    setStaffUsername("");
    closeModal();
    localStorage.removeItem(STORAGE_TOKEN_KEY);
    localStorage.removeItem(STORAGE_USER_KEY);
  };

  // 5. Handle Status Update
  const handleStatusUpdate = async (orderId: number, nextStatus: string) => {
    if (!token) return;
    setUpdatingStatus(true);
    setStatusNotice(null);

    const res = await staffUpdateOrderStatus(token, orderId, nextStatus);

    if (res.error) {
      setStatusNotice(`⚠️ ${res.error}`);
    } else if (res.data) {
      setStatusNotice(`✓ Order updated to ${res.data.order_status_display}`);
      setSelectedOrder(res.data);
      // Update local state list
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? (res.data as Order) : o))
      );
      // Refresh dashboard statistics
      staffGetDashboard(token).then((dashRes) => {
        if (dashRes.data) setMetrics(dashRes.data.metrics);
      });
    }
    setUpdatingStatus(false);
  };

  // 6. Handle Mark as Paid (for in-person payment methods)
  const handleMarkPaymentPaid = async (orderId: number) => {
    if (!token) return;
    setUpdatingPayment(true);
    setStatusNotice(null);

    const res = await staffUpdateOrderPayment(token, orderId, "PAID");

    if (res.error) {
      setStatusNotice(`⚠️ ${res.error}`);
    } else if (res.data) {
      setStatusNotice(`✓ Payment of ${formatINR(res.data.total_amount)} recorded as PAID`);
      setSelectedOrder(res.data);
      // Update local state list
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? (res.data as Order) : o))
      );
      // Refresh dashboard statistics
      staffGetDashboard(token).then((dashRes) => {
        if (dashRes.data) setMetrics(dashRes.data.metrics);
      });
    }
    setUpdatingPayment(false);
    setShowPaymentConfirm(false);
  };

  if (!isMounted) return null;

  // ----------------------------------------------------
  // View 1: Staff Login Screen (When Not Authenticated)
  // ----------------------------------------------------
  if (!token) {
    return (
      <div className="min-h-screen bg-[#141414] text-white flex flex-col justify-center items-center px-4 selection:bg-[#E51D2A] selection:text-white">
        <div className="w-full max-w-md bg-[#1F1F1F] border border-[#333333] rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-20 bg-[#E51D2A]/15 blur-2xl pointer-events-none -z-10" />

          {/* Brand Header */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#E51D2A] to-[#8F0E16] flex items-center justify-center mx-auto mb-3 shadow-lg shadow-[#E51D2A]/25">
              <span className="text-white font-black text-xl">US</span>
            </div>
            <h1 className="text-2xl font-black tracking-wider text-white">
              URBAN <span className="text-[#E51D2A]">SPICE</span>
            </h1>
            <p className="text-xs uppercase tracking-widest text-zinc-400 font-semibold mt-1">
              Staff &amp; Operations Portal
            </p>
          </div>

          {loginError && (
            <div className="mb-6 p-4 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs">
              ⚠️ {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-2">
                Staff Username
              </label>
              <input
                type="text"
                required
                value={loginUser}
                onChange={(e) => setLoginUser(e.target.value)}
                className="w-full bg-[#141414] border border-[#3A3A3A] focus:border-[#E51D2A] rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-2">
                Password
              </label>
              <input
                type="password"
                required
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                className="w-full bg-[#141414] border border-[#3A3A3A] focus:border-[#E51D2A] rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3.5 rounded-xl bg-[#E51D2A] hover:bg-[#c91420] text-white font-bold text-sm tracking-wide shadow-lg shadow-[#E51D2A]/25 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isLoggingIn ? "Authenticating..." : "Sign In to Admin Portal"}
            </button>
          </form>

          {/* Quick Demo Credentials Info */}
          <div className="mt-8 pt-6 border-t border-[#2C2C2C] text-center text-xs text-zinc-500 space-y-1">
            <p className="text-zinc-400 font-semibold">Staff Credentials for Evaluation:</p>
            <p>
              Username: <code className="text-[#E51D2A] font-mono">admin</code> | Password:{" "}
              <code className="text-[#E51D2A] font-mono">admin123</code>
            </p>
            <div className="pt-2">
              <Link href="/" className="text-xs text-zinc-400 hover:text-white transition-colors">
                ← Return to Customer Website
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // View 2: Authenticated Staff Admin Dashboard
  // ----------------------------------------------------
  return (
    <div className="min-h-screen bg-[#141414] text-white flex flex-col selection:bg-[#E51D2A] selection:text-white">
      {/* Top Staff Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#1A1A1A]/95 backdrop-blur-md border-b border-[#2C2C2C]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#E51D2A] flex items-center justify-center font-black text-white text-sm">
                US
              </div>
              <span className="font-extrabold tracking-wider text-base text-white">
                URBAN <span className="text-[#E51D2A]">SPICE</span>
              </span>
            </Link>
            <span className="text-zinc-600">|</span>
            <span className="text-xs uppercase font-bold tracking-widest text-zinc-400">
              Staff Order Dashboard
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-400 bg-[#222222] px-3 py-1.5 rounded-full border border-[#333333]">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Staff: <strong className="text-white">{staffUsername || "admin"}</strong></span>
            </div>

            <button
              onClick={handleLogout}
              className="px-3.5 py-1.5 rounded-xl bg-[#262626] hover:bg-[#333] border border-[#3A3A3A] text-zinc-300 hover:text-white text-xs font-semibold transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Dashboard Body */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1">
        {/* Operational Metrics Cards */}
        {metrics && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-8">
            <div className="bg-[#1C1C1C] border border-[#2E2E2E] rounded-2xl p-3.5 sm:p-4 shadow-sm">
              <span className="text-[10px] sm:text-[11px] text-zinc-400 uppercase font-semibold block">Total Orders</span>
              <span className="text-xl sm:text-2xl font-black text-white mt-1 block truncate">{metrics.total_orders}</span>
            </div>

            <div className="bg-[#1C1C1C] border border-[#2E2E2E] rounded-2xl p-3.5 sm:p-4 shadow-sm">
              <span className="text-[10px] sm:text-[11px] text-zinc-400 uppercase font-semibold block">Orders Today</span>
              <span className="text-xl sm:text-2xl font-black text-white mt-1 block truncate">{metrics.today_orders}</span>
            </div>

            <div className="bg-[#1C1C1C] border border-[#2E2E2E] rounded-2xl p-3.5 sm:p-4 shadow-sm">
              <span className="text-[10px] sm:text-[11px] text-amber-400 uppercase font-semibold block">Awaiting Confirm</span>
              <span className="text-xl sm:text-2xl font-black text-amber-400 mt-1 block truncate">{metrics.awaiting_confirmation}</span>
            </div>

            <div className="bg-[#1C1C1C] border border-[#2E2E2E] rounded-2xl p-3.5 sm:p-4 shadow-sm">
              <span className="text-[10px] sm:text-[11px] text-purple-400 uppercase font-semibold block">Active Kitchen</span>
              <span className="text-xl sm:text-2xl font-black text-purple-400 mt-1 block truncate">{metrics.active_kitchen}</span>
            </div>

            <div className="bg-[#1C1C1C] border border-[#2E2E2E] rounded-2xl p-3.5 sm:p-4 shadow-sm">
              <span className="text-[10px] sm:text-[11px] text-emerald-400 uppercase font-semibold block">Completed</span>
              <span className="text-xl sm:text-2xl font-black text-emerald-400 mt-1 block truncate">{metrics.completed_count}</span>
            </div>

            <div className="bg-[#1C1C1C] border border-[#2E2E2E] rounded-2xl p-3.5 sm:p-4 shadow-sm">
              <span className="text-[10px] sm:text-[11px] text-[#E51D2A] uppercase font-semibold block">Gross Sales</span>
              <span className="text-lg sm:text-2xl font-black text-white mt-1 block truncate">{formatINR(metrics.gross_sales)}</span>
            </div>
          </div>
        )}

        {/* Toolbar: Filters, Search, & Refresh */}
        <div className="bg-[#1C1C1C] border border-[#2E2E2E] rounded-2xl p-4 sm:p-5 mb-6 space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Filters Row */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Order Status Select */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400 font-semibold uppercase">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-[#242424] border border-[#383838] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E51D2A] cursor-pointer"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PLACED">Placed</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="PREPARING">Preparing</option>
                  <option value="READY">Ready</option>
                  <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              {/* Order Type Select */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400 font-semibold uppercase">Type:</span>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="bg-[#242424] border border-[#383838] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E51D2A] cursor-pointer"
                >
                  <option value="ALL">All Fulfilment</option>
                  <option value="DELIVERY">Home Delivery</option>
                  <option value="PICKUP">Pickup / Takeaway</option>
                  <option value="DINE_IN">Dine-in</option>
                </select>
              </div>
            </div>

            {/* Search Input & Refresh Button */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 sm:w-64">
                <input
                  type="text"
                  placeholder="Search reference, name, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#141414] border border-[#383838] focus:border-[#E51D2A] rounded-xl px-4 py-2 pl-9 text-xs text-white placeholder-zinc-500 focus:outline-none"
                />
                <svg
                  className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>

              <button
                onClick={loadData}
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-[#282828] hover:bg-[#333] border border-[#3A3A3A] text-zinc-300 hover:text-white text-xs font-semibold transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
                title="Refresh Orders"
              >
                <svg
                  className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span>{loading ? "Syncing..." : "Refresh"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Error Notice */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex justify-between items-center">
            <span>⚠️ {error}</span>
            <button onClick={loadData} className="underline font-bold text-xs">
              Retry
            </button>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && orders.length === 0 && (
          <div className="bg-[#1C1C1C] border border-[#2E2E2E] rounded-3xl p-8 space-y-4 animate-pulse">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-[#252525] rounded-xl w-full"></div>
            ))}
          </div>
        )}

        {/* Orders Table (Desktop) / Cards (Mobile) */}
        {!loading && orders.length === 0 ? (
          <div className="bg-[#1C1C1C] border border-[#2E2E2E] rounded-3xl p-12 text-center text-zinc-400">
            <div className="w-16 h-16 rounded-full bg-[#242424] flex items-center justify-center mx-auto mb-4 text-zinc-600">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-1">No Orders Found</h3>
            <p className="text-xs text-zinc-500 mb-4">No customer orders match the current filter or search criteria.</p>
            <button
              onClick={() => {
                setStatusFilter("ALL");
                setTypeFilter("ALL");
                setSearchQuery("");
              }}
              className="text-xs text-[#E51D2A] hover:underline font-semibold"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="bg-[#1C1C1C] border border-[#2E2E2E] rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[720px]">
                <thead className="bg-[#242424] border-b border-[#333333] text-zinc-400 uppercase font-semibold tracking-wider">
                  <tr>
                    <th className="py-4 px-5">Order Reference</th>
                    <th className="py-4 px-4">Customer</th>
                    <th className="py-4 px-4">Type</th>
                    <th className="py-4 px-4">Items Summary</th>
                    <th className="py-4 px-4">Payment</th>
                    <th className="py-4 px-4">Status</th>
                    <th className="py-4 px-4 text-right">Total</th>
                    <th className="py-4 px-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2B2B2B]">
                  {orders.map((ord) => {
                    const statusColor =
                      ord.order_status === "COMPLETED"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        : ord.order_status === "CANCELLED"
                        ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                        : ord.order_status === "PLACED"
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse"
                        : "bg-blue-500/10 text-blue-400 border-blue-500/30";

                    const typeIcon =
                      ord.order_type === "DELIVERY"
                        ? "🛵"
                        : ord.order_type === "PICKUP"
                        ? "🛍️"
                        : "🍽️";

                    return (
                      <tr
                        key={ord.id}
                        className="hover:bg-[#222222] transition-colors cursor-pointer group"
                        onClick={() => {
                          setSelectedOrder(ord);
                          setStatusNotice(null);
                        }}
                      >
                        <td className="py-4 px-5">
                          <span className="font-mono font-bold text-white group-hover:text-[#E51D2A] transition-colors block">
                            {ord.order_number}
                          </span>
                          <span className="text-[10px] text-zinc-500">
                            {new Date(ord.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </td>

                        <td className="py-4 px-4">
                          <span className="font-bold text-white block">{ord.customer_name}</span>
                          <span className="text-zinc-400 text-[11px]">{ord.customer_phone}</span>
                        </td>

                        <td className="py-4 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#262626] border border-[#383838] text-zinc-300">
                            <span>{typeIcon}</span>
                            <span>{ord.order_type_display}</span>
                          </span>
                        </td>

                        <td className="py-4 px-4 max-w-xs">
                          <span className="text-zinc-300 line-clamp-1">
                            {ord.items.map((i) => `${i.quantity}x ${i.item_name_snapshot}`).join(", ")}
                          </span>
                          <span className="text-[10px] text-zinc-500">
                            {ord.items.reduce((acc, cur) => acc + cur.quantity, 0)} total pieces
                          </span>
                        </td>

                        <td className="py-4 px-4">
                          <span className="text-zinc-300 text-xs block mb-1 font-medium">{ord.payment_method_display}</span>
                          <PaymentBadge status={ord.payment_status} display={ord.payment_status_display} />
                        </td>

                        <td className="py-4 px-4">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusColor}`}>
                            {ord.order_status_display}
                          </span>
                        </td>

                        <td className="py-4 px-4 text-right font-bold text-white text-sm">
                          {formatINR(ord.total_amount)}
                        </td>

                        <td className="py-4 px-5 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOrder(ord);
                              setStatusNotice(null);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-[#282828] hover:bg-[#E51D2A] text-zinc-200 hover:text-white border border-[#383838] hover:border-[#E51D2A] transition-all font-semibold"
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* ---------------------------------------------------- */}
      {/* Modal / Slide-out: Order Detail & Status Transition  */}
      {/* ---------------------------------------------------- */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4"
          onClick={closeModal}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            aria-hidden="true"
          />

          <div
            onClick={(e) => e.stopPropagation()}
            className="relative bg-[#1C1C1C] border border-[#333333] rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl space-y-6"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-[#2E2E2E]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#E51D2A] block">
                  Order Management
                </span>
                <h2 className="text-xl sm:text-2xl font-mono font-black text-white">
                  {selectedOrder.order_number}
                </h2>
                <span className="text-xs text-zinc-400">
                  Placed on {new Date(selectedOrder.created_at).toLocaleString()}
                </span>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="p-2 rounded-xl text-zinc-400 hover:text-white bg-[#262626] hover:bg-[#333] transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Status Notice Feedback */}
            {statusNotice && (
              <div className="p-3 rounded-xl bg-[#252525] border border-[#3A3A3A] text-xs text-white">
                {statusNotice}
              </div>
            )}

            {/* Workflow Status Progression Controls */}
            <div className="bg-[#242424] border border-[#383838] rounded-2xl p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-zinc-400 uppercase">
                  Current Status
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#1A1A1A] border border-[#444] text-white">
                  {selectedOrder.order_status_display}
                </span>
              </div>

              {/* Transition Action Buttons */}
              <div>
                <span className="text-xs text-zinc-400 block mb-2">Available Actions:</span>
                <div className="flex flex-wrap gap-2.5">
                  {STATUS_ACTIONS[selectedOrder.order_type]?.[selectedOrder.order_status]?.map(
                    (act) => (
                      <button
                        key={act.nextStatus}
                        disabled={updatingStatus}
                        onClick={() => handleStatusUpdate(selectedOrder.id, act.nextStatus)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 active:scale-95 cursor-pointer ${act.style}`}
                      >
                        {updatingStatus ? "Updating..." : act.label}
                      </button>
                    )
                  ) || (
                    <span className="text-xs text-zinc-500 italic">
                      Order is in its terminal state ({selectedOrder.order_status_display}).
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Customer & Fulfilment Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-[#242424] border border-[#333] rounded-2xl p-4 space-y-1.5">
                <span className="text-zinc-400 uppercase font-semibold block">Customer Information</span>
                <p className="text-sm font-bold text-white">{selectedOrder.customer_name}</p>
                <p className="text-zinc-300">📞 {selectedOrder.customer_phone}</p>
                {selectedOrder.customer_email && <p className="text-zinc-400">✉️ {selectedOrder.customer_email}</p>}
              </div>

              <div className="bg-[#242424] border border-[#333] rounded-2xl p-4 space-y-1.5">
                <span className="text-zinc-400 uppercase font-semibold block">Fulfilment Type</span>
                <p className="text-sm font-bold text-white">{selectedOrder.order_type_display}</p>
                {selectedOrder.order_type === "DELIVERY" && (
                  <p className="text-zinc-300 leading-relaxed">
                    📍 {selectedOrder.delivery_address}, {selectedOrder.city} — {selectedOrder.pincode}
                  </p>
                )}
                {selectedOrder.order_type === "DINE_IN" && (
                  <p className="text-zinc-300">🪑 Table: {selectedOrder.table_number || "Walk-in"}</p>
                )}
                {selectedOrder.order_type === "PICKUP" && (
                  <p className="text-zinc-300">⏰ Pickup Preference: {selectedOrder.pickup_time_preference || "Standard"}</p>
                )}
              </div>
            </div>

            {/* Customer Special Note */}
            {selectedOrder.customer_note && (
              <div className="bg-[#242424] border border-[#333] rounded-2xl p-4 text-xs">
                <span className="text-zinc-400 font-semibold block mb-1">Customer Special Note:</span>
                <p className="text-zinc-200 italic">&ldquo;{selectedOrder.customer_note}&rdquo;</p>
              </div>
            )}

            {/* Ordered Dishes Table */}
            <div>
              <h3 className="text-sm font-bold text-white mb-2">Ordered Dishes</h3>
              <div className="bg-[#242424] border border-[#333] rounded-2xl divide-y divide-[#333] overflow-hidden text-xs">
                {selectedOrder.items.map((item) => (
                  <div key={item.id} className="p-3 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white block">{item.item_name_snapshot}</span>
                      <span className="text-zinc-400">
                        {item.quantity} x {formatINR(item.unit_price_snapshot)}
                      </span>
                    </div>
                    <span className="font-bold text-white">{formatINR(item.line_total)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="pt-2 border-t border-[#2E2E2E] space-y-2 text-xs">
              <div className="flex justify-between text-zinc-300">
                <span>Subtotal</span>
                <span>{formatINR(selectedOrder.subtotal)}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Delivery Fee</span>
                <span>{Number(selectedOrder.delivery_fee) === 0 ? "FREE" : formatINR(selectedOrder.delivery_fee)}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Taxes (5% GST)</span>
                <span>{formatINR(selectedOrder.tax_amount)}</span>
              </div>
              <div className="pt-2 border-t border-[#333] flex justify-between items-baseline text-sm">
                <span className="font-bold text-white">Grand Total</span>
                <span className="text-xl font-black text-[#E51D2A]">{formatINR(selectedOrder.total_amount)}</span>
              </div>

              {/* Payment Settlement & Status Section */}
              <div className="pt-3 border-t border-[#2E2E2E] space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#242424] border border-[#333] rounded-2xl p-4">
                  <div className="space-y-1">
                    <span className="text-zinc-400 block text-[11px] font-semibold uppercase tracking-wider">
                      Payment Settlement
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-white text-sm">{selectedOrder.payment_method_display}</span>
                      <PaymentBadge status={selectedOrder.payment_status} display={selectedOrder.payment_status_display} />
                    </div>
                  </div>

                  {/* Mark as Paid Action for in-person orders with PENDING status */}
                  {selectedOrder.payment_status === "PENDING" &&
                    selectedOrder.payment_method !== "RAZORPAY" && (
                      <button
                        type="button"
                        disabled={updatingPayment}
                        onClick={() => setShowPaymentConfirm(true)}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer disabled:opacity-50"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Mark as Paid</span>
                      </button>
                    )}

                  {selectedOrder.payment_status === "PAID" && (
                    <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                      <span>✓</span> Payment Settled
                    </span>
                  )}
                </div>

                {/* Razorpay Online Payment Notice & Transaction Details */}
                {selectedOrder.payment_method === "RAZORPAY" && (
                  <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-600/30 text-xs text-blue-200 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base">ℹ️</span>
                      <span className="font-semibold text-white">Razorpay Online Payment (Test Mode)</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-zinc-300 pt-1 font-mono">
                      {selectedOrder.razorpay_order_id && (
                        <div>
                          <span className="text-zinc-400 block font-sans text-[10px] uppercase">Razorpay Order ID:</span>
                          <span className="text-zinc-200">{selectedOrder.razorpay_order_id}</span>
                        </div>
                      )}
                      {selectedOrder.razorpay_payment_id && (
                        <div>
                          <span className="text-zinc-400 block font-sans text-[10px] uppercase">Razorpay Payment ID:</span>
                          <span className="text-emerald-400 font-bold">{selectedOrder.razorpay_payment_id}</span>
                        </div>
                      )}
                    </div>
                    {selectedOrder.payment_status === "PENDING" && (
                      <p className="text-[11px] text-blue-300 pt-1">
                        Awaiting server-side signature verification from customer checkout. Manual mark-as-paid is disabled for security.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Close Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={closeModal}
                className="w-full py-3 rounded-xl bg-[#282828] hover:bg-[#333] text-zinc-200 font-bold text-xs border border-[#383838] transition-colors cursor-pointer"
              >
                Close Order View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* Payment Confirmation Dialog Modal                    */}
      {/* ---------------------------------------------------- */}
      {showPaymentConfirm && selectedOrder && (
        <div
          className="fixed inset-0 z-[60] overflow-hidden flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setShowPaymentConfirm(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative bg-[#1E1E1E] border border-[#3A3A3A] rounded-3xl w-full max-w-md p-6 sm:p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg shadow-emerald-950/50">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Confirm Payment Receipt</h3>
                <p className="text-xs text-zinc-400">Order #{selectedOrder.order_number}</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#262626] border border-[#383838] space-y-2 text-xs">
              <div className="flex justify-between text-zinc-300">
                <span className="text-zinc-400">Customer:</span>
                <span className="font-semibold text-white">{selectedOrder.customer_name}</span>
              </div>
              <div className="flex justify-between text-zinc-300">
                <span className="text-zinc-400">Payment Method:</span>
                <span className="font-semibold text-white">{selectedOrder.payment_method_display}</span>
              </div>
              <div className="flex justify-between text-zinc-300 pt-2 border-t border-[#383838]">
                <span className="text-zinc-300 font-semibold">Amount to Collect:</span>
                <span className="font-bold text-emerald-400 text-sm">{formatINR(selectedOrder.total_amount)}</span>
              </div>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Have you physically received <strong className="text-white">{formatINR(selectedOrder.total_amount)}</strong> from the customer? This will update the order payment status to <span className="text-emerald-400 font-bold">PAID</span>.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowPaymentConfirm(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-300 bg-[#2C2C2C] hover:bg-[#383838] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={updatingPayment}
                onClick={() => handleMarkPaymentPaid(selectedOrder.id)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-all cursor-pointer disabled:opacity-50 active:scale-95 shadow-lg shadow-emerald-900/40"
              >
                {updatingPayment ? "Recording..." : "Yes, Confirm Payment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
