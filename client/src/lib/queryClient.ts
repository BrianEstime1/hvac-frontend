import { QueryClient, QueryFunction } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { clearToken, getToken } from "@/lib/auth";
import {
  transformAppointmentFromAPI,
  transformInvoiceFromAPI,
  transformCustomerFromAPI,
  transformInventoryFromAPI,
  transformQuoteFromAPI,
} from "./apiTransformers";

const DEFAULT_API_BASE_URL = "https://hvac-management-api.onrender.com";

const baseURL =
  import.meta.env.VITE_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL;

// Configure axios instance to use configured backend
export const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = getToken();

  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Pages that don't belong to the admin dashboard: the marketing site,
// customer booking, and customer signing links. An expired admin token
// must never yank these visitors (or the PWA) to the wrong place.
function isPublicPage(pathname: string) {
  return (
    pathname === "/" ||
    pathname === "/admin" ||
    pathname.startsWith("/book") ||
    pathname.startsWith("/sign")
  );
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      clearToken();
      // Send expired sessions back to the login screen, not the website home
      if (typeof window !== "undefined" && !isPublicPage(window.location.pathname)) {
        window.location.href = "/admin";
      }
    }

    return Promise.reject(error);
  }
);

// Universal API request wrapper
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined
): Promise<any> {
  try {
    const response = await api.request({
      method,
      url,
      data,
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      const data = axiosError.response?.data as any;
      // Backend returns { error: "..." } — extract the message properly
      const message =
        (typeof data === "object" && data !== null && (data.error || data.message)) ||
        (typeof data === "string" && data) ||
        axiosError.message ||
        "An error occurred";
      throw new Error(message);
    }
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";

export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      // FIXED: Only use the first element of queryKey
      const path = queryKey[0] as string;
      const response = await api.get(path);
      const raw = response.data;

      let transformedData: any = raw;

      // --- Helper to force any backend shape into a clean array ---
      const normalizeList = (value: any) => {
        if (Array.isArray(value)) return value;
        if (Array.isArray(value?.data)) return value.data;
        if (Array.isArray(value?.items)) return value.items;
        if (Array.isArray(value?.customers)) return value.customers;
        if (Array.isArray(value?.invoices)) return value.invoices;
        if (Array.isArray(value?.quotes)) return value.quotes;
        return value ? [value] : [];
      };

      // --- Transform endpoints safely ---
      if (path.includes("/api/appointments")) {
        const list = normalizeList(raw);
        transformedData = list.map(transformAppointmentFromAPI);

      } else if (path.includes("/photos")) {
        // Photos endpoints return array directly, no transformation needed
        transformedData = Array.isArray(raw) ? raw : [];

      } else if (path.includes("/api/invoices")) {
        const list = normalizeList(raw);
        transformedData = list.map(transformInvoiceFromAPI);

      } else if (path.includes("/api/customers")) {
        const list = normalizeList(raw);
        transformedData = list.map(transformCustomerFromAPI);

      } else if (path.includes("/api/inventory")) {
        const list = normalizeList(raw);
        transformedData = list.map(transformInventoryFromAPI);

      } else if (path.includes("/api/quotes")) {
        const list = normalizeList(raw);
        transformedData = list.map(transformQuoteFromAPI);

      } else if (path.includes("/api/dashboard/stats")) {
        // Dashboard stats are custom — leave them intact
        transformedData = {
          totalCustomers: raw.total_customers || 0,
          upcomingAppointments: raw.upcoming_appointments || 0,
          lowStockItems: Array.isArray(raw.low_stock_items)
            ? raw.low_stock_items.map(transformInventoryFromAPI)
            : [],
          unpaidTotal: raw.unpaid_total || 0,
          unpaidCount: raw.unpaid_count || 0,
        };
      }

      return transformedData;

    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        if (
          unauthorizedBehavior === "returnNull" &&
          axiosError.response?.status === 401
        ) {
          return null;
        }
        throw new Error(
          axiosError.response?.data as string ||
            axiosError.message ||
            "An error occurred"
        );
      }
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
