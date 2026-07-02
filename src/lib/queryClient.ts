import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // standard caching and retry strategies for React Native apps
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
      refetchOnWindowFocus: false, // Window focus refetching is often annoying in React Native
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1, // Usually you only want to retry mutations once, if at all, to prevent duplicate POSTs
    },
  },
});
