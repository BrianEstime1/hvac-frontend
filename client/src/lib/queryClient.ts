import { QueryClient, QueryFunction } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import {
  transformAppointmentFromAPI,
  transformInvoiceFromAPI,
  transformCustomerFromAPI,
  transformInventoryFromAPI,
  transformQuoteFromAPI,
} from "./apiTransformers";

const baseURL = import.meta.env.VITE_API_BASE_URL || "";

// Configure axios instance to use configured backend
export const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
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
      throw new Error(
        axiosError.response?.data as string ||
        axiosError.message ||
        "An error occurred"
      );
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
      const path = queryKey[0] as string;
      const response = await api.get(path);

      
      // Transform data based on endpoint
      let transformedData = response.data;
      
      if (path.includes("/api/appointments")) {
        // Transform appointments
        transformedData = Array.isArray(response.data)
          ? response.data.map(transformAppointmentFromAPI)
          : transformAppointmentFromAPI(response.data);
      } else if (path.includes("/api/invoices")) {
        // Transform invoices
        transformedData = Array.isArray(response.data)
          ? response.data.map(transformInvoiceFromAPI)
          : transformInvoiceFromAPI(response.data);
      } else if (path.includes("/api/customers")) {
        // Transform customers
        transformedData = Array.isArray(response.data)
          ? response.data.map(transformCustomerFromAPI)
          : transformCustomerFromAPI(response.data);
      } else if (path.includes("/api/inventory")) {
        // Transform inventory
        transformedData = Array.isArray(response.data)
          ? response.data.map(transformInventoryFromAPI)
          : transformInventoryFromAPI(response.data);
      } else if (path.includes("/api/quotes")) {
        transformedData = Array.isArray(response.data)
          ? response.data.map(transformQuoteFromAPI)
          : transformQuoteFromAPI(response.data);
      } else if (path.includes("/api/dashboard/stats")) {
        // Transform dashboard stats
        transformedData = {
          totalCustomers: response.data.total_customers || 0,
          upcomingAppointments: response.data.upcoming_appointments || 0,
          lowStockItems: Array.isArray(response.data.low_stock_items)
            ? response.data.low_stock_items.map(transformInventoryFromAPI)
            : [],
        };
      }
      
      return transformedData;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        if (unauthorizedBehavior === "returnNull" && axiosError.response?.status === 401) {
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
