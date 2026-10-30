/**
 * Order & Checkout Types for Urban Spice
 */

export type OrderType = "DELIVERY" | "PICKUP" | "DINE_IN";
export type PaymentMethod = "COD" | "PAY_AT_PICKUP" | "PAY_AT_RESTAURANT" | "RAZORPAY";
export type OrderStatus = "PLACED" | "CONFIRMED" | "PREPARING" | "READY" | "OUT_FOR_DELIVERY" | "COMPLETED" | "CANCELLED";
export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED" | "CANCELLED";

export interface OrderItemSnapshot {
  id: number;
  menu_item?: number | null;
  item_name_snapshot: string;
  unit_price_snapshot: string | number;
  quantity: number;
  line_total: string | number;
}

export interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  order_type: OrderType;
  order_type_display: string;
  delivery_address?: string;
  city?: string;
  pincode?: string;
  landmark?: string;
  table_number?: string;
  pickup_time_preference?: string;
  customer_note?: string;
  order_status: OrderStatus;
  order_status_display: string;
  payment_method: PaymentMethod;
  payment_method_display: string;
  payment_status: PaymentStatus;
  payment_status_display: string;
  razorpay_order_id?: string | null;
  razorpay_payment_id?: string | null;
  subtotal: string | number;
  delivery_fee: string | number;
  tax_amount: string | number;
  discount_amount: string | number;
  total_amount: string | number;
  currency: string;
  items: OrderItemSnapshot[];
  created_at: string;
  updated_at: string;
}

export interface RazorpayOrderData {
  razorpay_order_id: string;
  amount: number;
  currency: string;
  key_id: string;
}

export interface CreateOrderResponse extends Order {
  razorpay?: RazorpayOrderData | null;
  razorpay_error?: string | null;
}

export interface RazorpayVerifyPayload {
  order_number: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface RazorpayVerifyResponse {
  success: boolean;
  message: string;
  order: Order;
}

export interface RazorpayFailedPayload {
  order_number: string;
  razorpay_order_id?: string;
  error_description?: string;
}

export interface CreateOrderPayload {
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  order_type: OrderType;
  delivery_address?: string;
  city?: string;
  pincode?: string;
  landmark?: string;
  table_number?: string;
  pickup_time_preference?: string;
  customer_note?: string;
  payment_method?: PaymentMethod;
  items: {
    menu_item_id: number | string;
    quantity: number;
  }[];
}

