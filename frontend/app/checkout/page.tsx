"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useCart } from "@/context/CartContext";
import { formatINR } from "@/lib/currency";
import {
  createOrder,
  verifyRazorpayPayment,
  recordRazorpayFailure,
} from "@/lib/api";
import { OrderType, PaymentMethod, RazorpayOrderData } from "@/types/order";

const DELIVERY_FEE = 50.0;
const TAX_RATE = 0.05;

// Dynamic loader for official Razorpay Checkout SDK
const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems, subtotal, clearCart } = useCart();

  const [orderType, setOrderType] = useState<OrderType>("DELIVERY");

  // Form Fields
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");

  // Delivery Fields
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [city, setCity] = useState("New Delhi");
  const [pincode, setPincode] = useState("");
  const [landmark, setLandmark] = useState("");

  // Dine-in / Pickup Fields
  const [tableNumber, setTableNumber] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [customerNote, setCustomerNote] = useState("");

  // Payment Selection: Razorpay Online vs In-person
  const [paymentType, setPaymentType] = useState<"RAZORPAY" | "OFFLINE">("RAZORPAY");

  // UI States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [createdOrderNumber, setCreatedOrderNumber] = useState<string | null>(null);
  const [pendingRazorpayData, setPendingRazorpayData] = useState<RazorpayOrderData | null>(null);

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleOrderTypeChange = (type: OrderType) => {
    setOrderType(type);
    if (type !== "DELIVERY") {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.delivery_address;
        delete next.city;
        delete next.pincode;
        return next;
      });
    }
  };

  // Financial Calculations (Calculated on server, previewed here)
  const calculatedDeliveryFee = orderType === "DELIVERY" ? DELIVERY_FEE : 0.0;
  const calculatedTax = subtotal * TAX_RATE;
  const calculatedTotal = subtotal + calculatedDeliveryFee + calculatedTax;

  // In-person Payment Label based on fulfilment choice
  const offlineMethod: PaymentMethod =
    orderType === "DELIVERY"
      ? "COD"
      : orderType === "PICKUP"
      ? "PAY_AT_PICKUP"
      : "PAY_AT_RESTAURANT";

  const offlineMethodLabel =
    orderType === "DELIVERY"
      ? "Cash on Delivery (COD)"
      : orderType === "PICKUP"
      ? "Pay at Pickup Counter"
      : "Pay at Restaurant (Table Service)";

  // Validation constants & helpers
  const INVALID_PLACEHOLDERS = new Set([
    "na", "n/a", "none", "null", "nil", "test", "testing", "undefined",
    "-", "--", "...", "no", "nope", "0", "asdf", "xyz", "n.a", "n.a.", "nothing"
  ]);

  const isPlaceholder = (val: string): boolean => {
    if (!val) return true;
    const cleaned = val.trim().toLowerCase();
    const alphanumeric = cleaned.replace(/[^a-z0-9]/g, "");
    return (
      INVALID_PLACEHOLDERS.has(cleaned) ||
      ["na", "none", "null", "nil", "test", "asdf"].includes(alphanumeric) ||
      cleaned.length === 0
    );
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // 1. Customer Name
    const trimmedName = customerName.trim();
    if (!trimmedName || isPlaceholder(trimmedName)) {
      errors.customer_name = "A valid customer name is required. Placeholder values like 'na' or 'none' are not allowed.";
    } else if (trimmedName.length < 2 || !/[A-Za-z\u0900-\u097F]/.test(trimmedName)) {
      errors.customer_name = "Customer name must be at least 2 letters.";
    }

    // 2. Customer Phone
    const trimmedPhone = customerPhone.trim();
    const digits = trimmedPhone.replace(/\D/g, "");
    const normalizedDigits = digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;
    if (!trimmedPhone || isPlaceholder(trimmedPhone)) {
      errors.customer_phone = "A valid phone number is required. Placeholder values are not allowed.";
    } else if (normalizedDigits.length < 10 || normalizedDigits.length > 13) {
      errors.customer_phone = "Please provide a valid 10-digit mobile number.";
    } else if (/^(\d)\1{9}$/.test(normalizedDigits)) {
      errors.customer_phone = "Please provide a genuine, active phone number.";
    }

    // 3. Conditional Delivery Fields
    if (orderType === "DELIVERY") {
      const trimmedAddress = deliveryAddress.trim();
      if (!trimmedAddress || isPlaceholder(trimmedAddress)) {
        errors.delivery_address = "A complete delivery address is required for Home Delivery. Placeholder values are not allowed.";
      } else if (trimmedAddress.length < 8) {
        errors.delivery_address = "Please provide complete street address with house/flat number (at least 8 characters).";
      }

      const trimmedCity = city.trim();
      if (!trimmedCity || isPlaceholder(trimmedCity)) {
        errors.city = "City is required for Home Delivery. Placeholder values are not allowed.";
      } else if (trimmedCity.length < 2) {
        errors.city = "Please enter a valid city name.";
      }

      const trimmedPincode = pincode.trim().replace(/\D/g, "");
      if (!pincode.trim() || isPlaceholder(pincode)) {
        errors.pincode = "PIN code is required for Home Delivery.";
      } else if (trimmedPincode.length !== 6) {
        errors.pincode = "Please enter a valid 6-digit postal PIN code.";
      }
      // Landmark is strictly optional
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Launch Razorpay Checkout Modal
  const launchRazorpayCheckout = async (
    orderNumber: string,
    razorpayData: RazorpayOrderData
  ) => {
    setIsSubmitting(true);
    setProcessingStatus("Opening Razorpay Checkout...");

    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      setIsSubmitting(false);
      setProcessingStatus(null);
      setErrorMessage(
        "Unable to load Razorpay payment SDK. Please check your internet connection or switch to Cash / Pay in Person."
      );
      return;
    }

    const options = {
      key: razorpayData.key_id,
      amount: razorpayData.amount,
      currency: razorpayData.currency || "INR",
      name: "Urban Spice",
      description: `Order ${orderNumber}`,
      image: typeof window !== "undefined" ? `${window.location.origin}/favicon.ico` : undefined,
      order_id: razorpayData.razorpay_order_id,
      prefill: {
        name: customerName.trim(),
        email: customerEmail.trim(),
        contact: customerPhone.trim(),
      },
      notes: {
        order_number: orderNumber,
      },
      theme: {
        color: "#E51D2A",
      },
      modal: {
        ondismiss: async function () {
          setIsSubmitting(false);
          setProcessingStatus(null);
          setErrorMessage(
            `Payment popup was closed. Your order #${orderNumber} has been saved with payment status PENDING. You can retry paying below or choose to pay in cash.`
          );
          await recordRazorpayFailure({
            order_number: orderNumber,
            razorpay_order_id: razorpayData.razorpay_order_id,
            error_description: "Payment popup closed by customer before completion.",
          });
        },
      },
      handler: async function (response: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      }) {
        setProcessingStatus("Verifying payment signature with server...");
        const verifyRes = await verifyRazorpayPayment({
          order_number: orderNumber,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        });

        if (verifyRes.error) {
          setIsSubmitting(false);
          setProcessingStatus(null);
          setErrorMessage(
            `Payment signature verification failed: ${verifyRes.error}. Please contact restaurant support with Order #${orderNumber}.`
          );
        } else if (verifyRes.data?.success) {
          clearCart();
          router.push(
            `/order/success?orderNumber=${encodeURIComponent(orderNumber)}&payment=success`
          );
        }
      },
    };

    try {
      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", async function (response: any) {
        setIsSubmitting(false);
        setProcessingStatus(null);
        const desc = response.error?.description || "Transaction failed or declined by issuing bank.";
        setErrorMessage(
          `Payment failed: ${desc}. Order #${orderNumber} is saved with status PENDING. You can retry below or choose Pay in Person.`
        );
        await recordRazorpayFailure({
          order_number: orderNumber,
          razorpay_order_id: razorpayData.razorpay_order_id,
          error_description: desc,
        });
      });
      rzp.open();
    } catch (err: any) {
      setIsSubmitting(false);
      setProcessingStatus(null);
      setErrorMessage(`Failed to open Razorpay modal: ${err?.message || err}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (cartItems.length === 0) {
      setErrorMessage("Your cart is empty. Please add dishes before placing an order.");
      return;
    }

    if (!validateForm()) {
      setErrorMessage("Please correct the highlighted errors in the form before proceeding.");
      return;
    }

    setIsSubmitting(true);
    setProcessingStatus(
      paymentType === "RAZORPAY"
        ? "Securing order & connecting to Razorpay..."
        : "Placing your order..."
    );

    const chosenPaymentMethod: PaymentMethod =
      paymentType === "RAZORPAY" ? "RAZORPAY" : offlineMethod;

    const payload = {
      customer_name: customerName.trim(),
      customer_phone: customerPhone.trim(),
      customer_email: customerEmail.trim() || undefined,
      order_type: orderType,
      delivery_address: orderType === "DELIVERY" ? deliveryAddress.trim() : undefined,
      city: orderType === "DELIVERY" ? city.trim() : undefined,
      pincode: orderType === "DELIVERY" ? pincode.trim() : undefined,
      landmark: orderType === "DELIVERY" ? (landmark.trim() || undefined) : undefined,
      table_number: orderType === "DINE_IN" ? tableNumber.trim() : undefined,
      pickup_time_preference: orderType === "PICKUP" ? pickupTime.trim() : undefined,
      customer_note: customerNote.trim() || undefined,
      payment_method: chosenPaymentMethod,
      items: cartItems.map((ci) => ({
        menu_item_id: Number(ci.item.id),
        quantity: ci.quantity,
      })),
    };

    const res = await createOrder(payload);

    if (res.error) {
      if (res.fieldErrors && typeof res.fieldErrors === "object") {
        const mapped: Record<string, string> = {};
        for (const [key, val] of Object.entries(res.fieldErrors)) {
          mapped[key] = Array.isArray(val) ? val[0] : String(val);
        }
        setFieldErrors(mapped);
      }
      setErrorMessage(res.error);
      setIsSubmitting(false);
      setProcessingStatus(null);
      return;
    }

    if (!res.data) {
      setErrorMessage("Unexpected response from order service. Please try again.");
      setIsSubmitting(false);
      setProcessingStatus(null);
      return;
    }

    const orderData = res.data;
    setCreatedOrderNumber(orderData.order_number);

    // 1. If Offline In-person Payment (COD / Pickup / Dine-in)
    if (paymentType === "OFFLINE" || chosenPaymentMethod !== "RAZORPAY") {
      clearCart();
      router.push(`/order/success?orderNumber=${encodeURIComponent(orderData.order_number)}`);
      return;
    }

    // 2. If Razorpay Online Payment
    if (orderData.razorpay_error) {
      setIsSubmitting(false);
      setProcessingStatus(null);
      setErrorMessage(
        `Order #${orderData.order_number} created with payment status PENDING, but Razorpay initiation reported: ${orderData.razorpay_error}. Please configure valid Test credentials in backend/.env.`
      );
      return;
    }

    if (!orderData.razorpay) {
      setIsSubmitting(false);
      setProcessingStatus(null);
      setErrorMessage(
        `Order #${orderData.order_number} created with payment status PENDING, but Razorpay details were not returned. Please check backend configuration.`
      );
      return;
    }

    setPendingRazorpayData(orderData.razorpay);
    launchRazorpayCheckout(orderData.order_number, orderData.razorpay);
  };

  return (
    <div className="min-h-screen bg-[#171717] text-white flex flex-col selection:bg-[#E51D2A] selection:text-white">
      {/* Razorpay SDK Script Preload */}
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        {/* Breadcrumb & Heading */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs text-zinc-400 mb-2">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link href="/cart" className="hover:text-white transition-colors">
              Cart
            </Link>
            <span>/</span>
            <span className="text-[#E51D2A] font-semibold">Checkout</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-black text-white">
            Complete Your Order
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Choose your fulfilment method, enter your details, and select payment.
          </p>
        </div>

        {cartItems.length === 0 ? (
          <div className="bg-[#242424] border border-[#333333] rounded-3xl p-12 text-center max-w-xl mx-auto my-8">
            <h2 className="text-xl font-bold text-white mb-2">Your Cart is Empty</h2>
            <p className="text-zinc-400 text-sm mb-6">
              You must add items to your cart before proceeding to checkout.
            </p>
            <Link
              href="/#menu"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#E51D2A] text-white font-bold text-sm shadow-md"
            >
              Return to Menu
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Left 7 Cols: Fulfilment Selector & Form Fields */}
            <div className="lg:col-span-7 space-y-8">
              {/* Step 1: Select Fulfilment Method */}
              <div className="bg-[#242424] border border-[#333333] rounded-3xl p-6 sm:p-8">
                <span className="text-xs uppercase tracking-wider text-[#E51D2A] font-bold block mb-1">
                  Step 1
                </span>
                <h2 className="text-xl font-bold text-white mb-4">Choose Fulfilment Method</h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Delivery */}
                  <button
                    type="button"
                    onClick={() => handleOrderTypeChange("DELIVERY")}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      orderType === "DELIVERY"
                        ? "bg-[#2E1E1E] border-[#E51D2A] shadow-md shadow-[#E51D2A]/10"
                        : "bg-[#1E1E1E] border-[#333333] hover:border-zinc-500"
                    }`}
                  >
                    <span className="text-xl mb-1 block">🛵</span>
                    <span className="font-bold text-sm text-white block">Home Delivery</span>
                    <span className="text-xs text-zinc-400">Direct to doorstep (₹50 fee)</span>
                  </button>

                  {/* Pickup */}
                  <button
                    type="button"
                    onClick={() => handleOrderTypeChange("PICKUP")}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      orderType === "PICKUP"
                        ? "bg-[#2E1E1E] border-[#E51D2A] shadow-md shadow-[#E51D2A]/10"
                        : "bg-[#1E1E1E] border-[#333333] hover:border-zinc-500"
                    }`}
                  >
                    <span className="text-xl mb-1 block">🛍️</span>
                    <span className="font-bold text-sm text-white block">Pickup / Takeaway</span>
                    <span className="text-xs text-zinc-400">Collect at counter (Free)</span>
                  </button>

                  {/* Dine-in */}
                  <button
                    type="button"
                    onClick={() => handleOrderTypeChange("DINE_IN")}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      orderType === "DINE_IN"
                        ? "bg-[#2E1E1E] border-[#E51D2A] shadow-md shadow-[#E51D2A]/10"
                        : "bg-[#1E1E1E] border-[#333333] hover:border-zinc-500"
                    }`}
                  >
                    <span className="text-xl mb-1 block">🍽️</span>
                    <span className="font-bold text-sm text-white block">Dine-in</span>
                    <span className="text-xs text-zinc-400">Table booking (Free)</span>
                  </button>
                </div>
              </div>

              {/* Step 2: Contact Information */}
              <div className="bg-[#242424] border border-[#333333] rounded-3xl p-6 sm:p-8 space-y-4">
                <span className="text-xs uppercase tracking-wider text-[#E51D2A] font-bold block mb-1">
                  Step 2
                </span>
                <h2 className="text-xl font-bold text-white mb-2">Customer Details</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Aarav Sharma"
                      value={customerName}
                      onChange={(e) => {
                        setCustomerName(e.target.value);
                        clearFieldError("customer_name");
                      }}
                      className={`w-full bg-[#1A1A1A] border ${
                        fieldErrors.customer_name
                          ? "border-red-500 ring-1 ring-red-500"
                          : "border-[#383838] focus:border-[#E51D2A]"
                      } rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-colors`}
                    />
                    {fieldErrors.customer_name && (
                      <p className="mt-1.5 text-xs text-red-400 font-medium flex items-center gap-1">
                        <span>⚠️</span> {fieldErrors.customer_name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={customerPhone}
                      onChange={(e) => {
                        setCustomerPhone(e.target.value);
                        clearFieldError("customer_phone");
                      }}
                      className={`w-full bg-[#1A1A1A] border ${
                        fieldErrors.customer_phone
                          ? "border-red-500 ring-1 ring-red-500"
                          : "border-[#383838] focus:border-[#E51D2A]"
                      } rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-colors`}
                    />
                    {fieldErrors.customer_phone && (
                      <p className="mt-1.5 text-xs text-red-400 font-medium flex items-center gap-1">
                        <span>⚠️</span> {fieldErrors.customer_phone}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-2">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="name@example.com (for order receipt & Razorpay payment)"
                    value={customerEmail}
                    onChange={(e) => {
                      setCustomerEmail(e.target.value);
                      clearFieldError("customer_email");
                    }}
                    className={`w-full bg-[#1A1A1A] border ${
                      fieldErrors.customer_email
                        ? "border-red-500 ring-1 ring-red-500"
                        : "border-[#383838] focus:border-[#E51D2A]"
                    } rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-colors`}
                  />
                  {fieldErrors.customer_email && (
                    <p className="mt-1.5 text-xs text-red-400 font-medium flex items-center gap-1">
                      <span>⚠️</span> {fieldErrors.customer_email}
                    </p>
                  )}
                </div>
              </div>

              {/* Step 3: Fulfilment Details (Conditional) */}
              <div className="bg-[#242424] border border-[#333333] rounded-3xl p-6 sm:p-8 space-y-4">
                <span className="text-xs uppercase tracking-wider text-[#E51D2A] font-bold block mb-1">
                  Step 3
                </span>
                <h2 className="text-xl font-bold text-white mb-2">
                  {orderType === "DELIVERY"
                    ? "Delivery Address"
                    : orderType === "PICKUP"
                    ? "Pickup Details"
                    : "Table / Seating Details"}
                </h2>

                {orderType === "DELIVERY" && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-2">
                        Delivery Street Address *
                      </label>
                      <textarea
                        rows={2}
                        placeholder="House / Flat No., Apartment, Street name"
                        value={deliveryAddress}
                        onChange={(e) => {
                          setDeliveryAddress(e.target.value);
                          clearFieldError("delivery_address");
                        }}
                        className={`w-full bg-[#1A1A1A] border ${
                          fieldErrors.delivery_address
                            ? "border-red-500 ring-1 ring-red-500"
                            : "border-[#383838] focus:border-[#E51D2A]"
                        } rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-colors resize-none`}
                      />
                      {fieldErrors.delivery_address && (
                        <p className="mt-1.5 text-xs text-red-400 font-medium flex items-center gap-1">
                          <span>⚠️</span> {fieldErrors.delivery_address}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-2">
                          City *
                        </label>
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => {
                            setCity(e.target.value);
                            clearFieldError("city");
                          }}
                          className={`w-full bg-[#1A1A1A] border ${
                            fieldErrors.city
                              ? "border-red-500 ring-1 ring-red-500"
                              : "border-[#383838] focus:border-[#E51D2A]"
                          } rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-colors`}
                        />
                        {fieldErrors.city && (
                          <p className="mt-1.5 text-xs text-red-400 font-medium flex items-center gap-1">
                            <span>⚠️</span> {fieldErrors.city}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-2">
                          PIN Code *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 110027"
                          value={pincode}
                          onChange={(e) => {
                            setPincode(e.target.value);
                            clearFieldError("pincode");
                          }}
                          className={`w-full bg-[#1A1A1A] border ${
                            fieldErrors.pincode
                              ? "border-red-500 ring-1 ring-red-500"
                              : "border-[#383838] focus:border-[#E51D2A]"
                          } rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-colors`}
                        />
                        {fieldErrors.pincode && (
                          <p className="mt-1.5 text-xs text-red-400 font-medium flex items-center gap-1">
                            <span>⚠️</span> {fieldErrors.pincode}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-2">
                        Nearby Landmark (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Near Metro Pillar 410"
                        value={landmark}
                        onChange={(e) => setLandmark(e.target.value)}
                        className="w-full bg-[#1A1A1A] border border-[#383838] focus:border-[#E51D2A] rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                )}

                {orderType === "PICKUP" && (
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-2">
                      Preferred Pickup Time or Note
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. In 30 mins / 7:30 PM"
                      value={pickupTime}
                      onChange={(e) => setPickupTime(e.target.value)}
                      className="w-full bg-[#1A1A1A] border border-[#383838] focus:border-[#E51D2A] rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-colors"
                    />
                    <p className="text-xs text-zinc-500 mt-2">
                      Pick up directly from: Urban Spice, 12 Rajouri Garden Heritage Square, New Delhi.
                    </p>
                  </div>
                )}

                {orderType === "DINE_IN" && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-2">
                        Table Number or Booking Reference
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Table 8 or Walk-in"
                        value={tableNumber}
                        onChange={(e) => setTableNumber(e.target.value)}
                        className="w-full bg-[#1A1A1A] border border-[#383838] focus:border-[#E51D2A] rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-2">
                    Special Instructions (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Extra napkins, less spicy, call before arriving..."
                    value={customerNote}
                    onChange={(e) => setCustomerNote(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-[#383838] focus:border-[#E51D2A] rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Step 4: Payment Option */}
              <div className="bg-[#242424] border border-[#333333] rounded-3xl p-6 sm:p-8 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs uppercase tracking-wider text-[#E51D2A] font-bold block mb-1">
                      Step 4
                    </span>
                    <h2 className="text-xl font-bold text-white">Payment Method</h2>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    Razorpay Test Mode
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Option 1: Razorpay Online */}
                  <button
                    type="button"
                    onClick={() => setPaymentType("RAZORPAY")}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative ${
                      paymentType === "RAZORPAY"
                        ? "bg-[#2A1E1E] border-[#E51D2A] shadow-md shadow-[#E51D2A]/15 ring-1 ring-[#E51D2A]"
                        : "bg-[#1E1E1E] border-[#333333] hover:border-zinc-500"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">💳</span>
                        <span className="font-bold text-sm text-white">Online Payment</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#E51D2A] text-white">
                        Recommended
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                      Instant payment via UPI, Credit/Debit Cards, NetBanking, or Wallets.
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-zinc-400">
                      <span className="px-2 py-0.5 rounded bg-[#282828] border border-[#3A3A3A] text-zinc-300 font-mono font-semibold">UPI</span>
                      <span className="px-2 py-0.5 rounded bg-[#282828] border border-[#3A3A3A] text-zinc-300 font-mono font-semibold">Cards</span>
                      <span className="px-2 py-0.5 rounded bg-[#282828] border border-[#3A3A3A] text-zinc-300 font-mono font-semibold">NetBanking</span>
                    </div>
                  </button>

                  {/* Option 2: Pay in Person / Cash */}
                  <button
                    type="button"
                    onClick={() => setPaymentType("OFFLINE")}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative ${
                      paymentType === "OFFLINE"
                        ? "bg-[#1E2720] border-emerald-500 shadow-md shadow-emerald-500/15 ring-1 ring-emerald-500"
                        : "bg-[#1E1E1E] border-[#333333] hover:border-zinc-500"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">💵</span>
                        <span className="font-bold text-sm text-white">{offlineMethodLabel}</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        In Person
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                      {orderType === "DELIVERY"
                        ? "Pay cash or UPI upon delivery at your doorstep."
                        : orderType === "PICKUP"
                        ? "Pay at the counter when collecting your takeaway."
                        : "Pay at your dining table after your meal."}
                    </p>
                    <div className="text-[10px] text-zinc-400">
                      <span>✓ Cash, UPI or Card accepted at counter / doorstep</span>
                    </div>
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-[#1D1D1D] border border-[#333333] flex items-center gap-2 text-xs text-zinc-400">
                  <span className="text-base text-amber-400">🔒</span>
                  <span>
                    {paymentType === "RAZORPAY"
                      ? "Razorpay Test Mode active. 256-bit SSL encrypted & HMAC SHA256 verified."
                      : "No upfront payment required. Your order will be sent to the kitchen right away."}
                  </span>
                </div>
              </div>
            </div>

            {/* Right 5 Cols: Order Summary & Place Order */}
            <div className="lg:col-span-5 bg-[#242424] border border-[#333333] rounded-3xl p-6 sm:p-8 space-y-6 sticky top-28 shadow-xl">
              <h2 className="text-xl font-bold text-white pb-3 border-b border-[#333333]">
                Order Items ({cartItems.length})
              </h2>

              {/* Items mini list */}
              <div className="max-h-64 overflow-y-auto space-y-3 pr-1">
                {cartItems.map(({ item, quantity }) => (
                  <div key={String(item.id)} className="flex items-center justify-between text-xs sm:text-sm">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-[#171717]">
                        <Image
                          src={item.image || "/images/hero-dish.jpg"}
                          alt={item.name}
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      </div>
                      <div className="truncate">
                        <span className="font-semibold text-white truncate block">{item.name}</span>
                        <span className="text-zinc-400 text-xs">{quantity} x {formatINR(item.price)}</span>
                      </div>
                    </div>
                    <span className="font-bold text-white ml-2">
                      {formatINR(Number(item.price) * quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Price Calculation Breakdown */}
              <div className="pt-4 border-t border-[#333333] space-y-2.5 text-xs sm:text-sm">
                <div className="flex justify-between text-zinc-300">
                  <span>Items Subtotal</span>
                  <span className="font-bold text-white">{formatINR(subtotal)}</span>
                </div>

                <div className="flex justify-between text-zinc-400">
                  <span>Delivery Fee</span>
                  <span>
                    {calculatedDeliveryFee === 0 ? "FREE" : formatINR(calculatedDeliveryFee)}
                  </span>
                </div>

                <div className="flex justify-between text-zinc-400">
                  <span>Estimated Taxes (5% GST)</span>
                  <span className="text-white">{formatINR(calculatedTax)}</span>
                </div>
              </div>

              {/* Final Amount */}
              <div className="pt-4 border-t border-[#333333] flex justify-between items-baseline">
                <div>
                  <span className="text-xs uppercase tracking-wider text-zinc-400 block font-semibold">
                    Grand Total
                  </span>
                  <span className="text-xs text-zinc-500">Includes all taxes & fees</span>
                </div>
                <span className="text-3xl font-black text-[#E51D2A]">
                  {formatINR(calculatedTotal)}
                </span>
              </div>

              {/* Processing status notice */}
              {processingStatus && (
                <div className="p-3.5 rounded-xl bg-blue-950/60 border border-blue-500/40 text-xs text-blue-200 flex items-center gap-2.5 animate-pulse">
                  <div className="w-4 h-4 rounded-full border-2 border-blue-400 border-t-transparent animate-spin shrink-0"></div>
                  <span>{processingStatus}</span>
                </div>
              )}

              {/* Error Notice */}
              {errorMessage && (
                <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-500/40 text-xs text-rose-300 space-y-2">
                  <p>⚠️ {errorMessage}</p>
                  {/* Retry Razorpay button if order already exists */}
                  {createdOrderNumber && pendingRazorpayData && (
                    <button
                      type="button"
                      onClick={() => launchRazorpayCheckout(createdOrderNumber, pendingRazorpayData)}
                      className="inline-block mt-2 px-3 py-1.5 rounded-lg bg-[#E51D2A] hover:bg-[#c91420] text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      Retry Payment for #{createdOrderNumber}
                    </button>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-xl bg-[#E51D2A] hover:bg-[#c91420] disabled:opacity-50 text-white font-bold text-sm tracking-wide shadow-xl shadow-[#E51D2A]/30 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                {isSubmitting ? (
                  <span>{processingStatus || "Processing..."}</span>
                ) : paymentType === "RAZORPAY" ? (
                  <>
                    <span>Pay Online with Razorpay ({formatINR(calculatedTotal)})</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </>
                ) : (
                  <>
                    <span>Place Order ({formatINR(calculatedTotal)})</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </>
                )}
              </button>

              <p className="text-[11px] text-zinc-500 text-center">
                By placing this order you agree to our Terms of Service & Cancellation Policy.
              </p>
            </div>
          </form>
        )}
      </main>

      <Footer />
    </div>
  );
}
