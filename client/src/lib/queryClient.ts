import { QueryClient, QueryFunction } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";

// Configure axios instance to use deployed Render backend
export const api = axios.create({
  baseURL: "https://hvac-management-api.onrender.com",
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
      const response = await api.get(queryKey.join("/") as string);
      return response.data;
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
