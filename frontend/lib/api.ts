/**
 * Urban Spice API Client Helper
 */

import { MenuCategory, MenuItem } from "@/types/menu";
import {
  Order,
  CreateOrderPayload,
  CreateOrderResponse,
  RazorpayOrderData,
  RazorpayVerifyPayload,
  RazorpayVerifyResponse,
  RazorpayFailedPayload,
} from "@/types/order";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[] | string>;
  status: number;
}

export async function fetchApi<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      // Ensure fast fresh data in development
      cache: "no-store",
    });

    if (!res.ok) {
      let errorMsg = `HTTP ${res.status}: ${res.statusText}`;
      let fieldErrors: Record<string, string[] | string> | undefined = undefined;

      try {
        const errorBody = await res.json();
        if (typeof errorBody === "object" && errorBody !== null) {
          fieldErrors = errorBody;
          if ("error" in errorBody) {
            errorMsg = String(errorBody.error);
          } else if ("detail" in errorBody) {
            errorMsg = String(errorBody.detail);
          } else {
            const firstKey = Object.keys(errorBody)[0];
            const firstVal = errorBody[firstKey];
            errorMsg = Array.isArray(firstVal) ? firstVal[0] : String(firstVal);
          }
        }
      } catch {
        // Fallback to res.statusText
      }

      return {
        error: errorMsg,
        fieldErrors,
        status: res.status,
      };
    }

    const data = (await res.json()) as T;
    return { data, status: res.status };
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "Network error connecting to backend";
    return {
      error: errorMessage,
      status: 0,
    };
  }
}

// ---------------- Public Menu & Order APIs ----------------

export async function getMenuCategories(): Promise<ApiResponse<MenuCategory[]>> {
  return fetchApi<MenuCategory[]>("/menu/categories/");
}

export async function getMenuItems(params?: {
  category?: string;
  vegetarian?: boolean;
  search?: string;
}): Promise<ApiResponse<MenuItem[]>> {
  const query = new URLSearchParams();
  if (params?.category && params.category !== "all") {
    query.set("category", params.category);
  }
  if (params?.vegetarian !== undefined && params.vegetarian !== false) {
    query.set("vegetarian", "true");
  }
  if (params?.search && params.search.trim() !== "") {
    query.set("search", params.search.trim());
  }

  const queryString = query.toString() ? `?${query.toString()}` : "";
  return fetchApi<MenuItem[]>(`/menu/items/${queryString}`);
}

export async function getMenuItem(
  id: string | number
): Promise<ApiResponse<MenuItem>> {
  return fetchApi<MenuItem>(`/menu/items/${id}/`);
}

export async function createOrder(
  payload: CreateOrderPayload
): Promise<ApiResponse<CreateOrderResponse>> {
  return fetchApi<CreateOrderResponse>("/orders/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function createRazorpayOrder(
  orderNumber: string
): Promise<ApiResponse<{ order: Order; razorpay: RazorpayOrderData }>> {
  return fetchApi<{ order: Order; razorpay: RazorpayOrderData }>(
    `/orders/${orderNumber}/razorpay/create/`,
    { method: "POST" }
  );
}

export async function verifyRazorpayPayment(
  payload: RazorpayVerifyPayload
): Promise<ApiResponse<RazorpayVerifyResponse>> {
  return fetchApi<RazorpayVerifyResponse>("/orders/razorpay/verify/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function recordRazorpayFailure(
  payload: RazorpayFailedPayload
): Promise<ApiResponse<{ message: string; order: Order }>> {
  return fetchApi<{ message: string; order: Order }>("/orders/razorpay/failed/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getOrderDetails(
  orderNumber: string
): Promise<ApiResponse<Order>> {
  return fetchApi<Order>(`/orders/${orderNumber}/`);
}

// ---------------- Protected Staff Admin APIs ----------------

export interface StaffAuthResponse {
  token: string;
  user: {
    id: number;
    username: string;
    email: string;
    is_staff: boolean;
    is_superuser: boolean;
  };
}

export interface DashboardMetrics {
  total_orders: number;
  today_orders: number;
  awaiting_confirmation: number;
  active_kitchen: number;
  completed_count: number;
  gross_sales: string;
}

export interface StaffDashboardData {
  metrics: DashboardMetrics;
  recent_orders: Order[];
}

export async function staffLogin(
  credentials: { username: string; password: string }
): Promise<ApiResponse<StaffAuthResponse>> {
  return fetchApi<StaffAuthResponse>("/admin/login/", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

export async function staffGetDashboard(
  token: string
): Promise<ApiResponse<StaffDashboardData>> {
  return fetchApi<StaffDashboardData>("/admin/dashboard/", {
    headers: {
      Authorization: `Token ${token}`,
    },
  });
}

export async function staffGetOrders(
  token: string,
  params?: {
    status?: string;
    type?: string;
    search?: string;
  }
): Promise<ApiResponse<Order[]>> {
  const query = new URLSearchParams();
  if (params?.status && params.status !== "ALL") {
    query.set("status", params.status);
  }
  if (params?.type && params.type !== "ALL") {
    query.set("type", params.type);
  }
  if (params?.search && params.search.trim() !== "") {
    query.set("search", params.search.trim());
  }

  const queryString = query.toString() ? `?${query.toString()}` : "";
  return fetchApi<Order[]>(`/admin/orders/${queryString}`, {
    headers: {
      Authorization: `Token ${token}`,
    },
  });
}

export async function staffGetOrderDetail(
  token: string,
  orderId: number | string
): Promise<ApiResponse<Order>> {
  return fetchApi<Order>(`/admin/orders/${orderId}/`, {
    headers: {
      Authorization: `Token ${token}`,
    },
  });
}

export async function staffUpdateOrderStatus(
  token: string,
  orderId: number | string,
  orderStatus: string
): Promise<ApiResponse<Order>> {
  return fetchApi<Order>(`/admin/orders/${orderId}/status/`, {
    method: "PATCH",
    headers: {
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify({ order_status: orderStatus }),
  });
}

export async function staffUpdateOrderPayment(
  token: string,
  orderId: number | string,
  paymentStatus: string = "PAID"
): Promise<ApiResponse<Order>> {
  return fetchApi<Order>(`/admin/orders/${orderId}/payment/`, {
    method: "PATCH",
    headers: {
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify({ payment_status: paymentStatus }),
  });
}

