import React, { useEffect } from "react";
import type { JSX, ReactNode } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Appearance } from "react-native";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { QueryClientProvider } from "@tanstack/react-query";
import Toast from "react-native-toast-message";

import { AuthProvider } from "@/context/AppContext";
import { useUIStore } from "@/store/useUIStore";
import { queryClient } from "@/lib/queryClient";
import { GlobalQueryToast } from "@/components/feedback/GlobalQueryToast";

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps): JSX.Element {
  const setIsAppLoading = useUIStore((s) => s.setIsAppLoading);
  const fetchExchangeRates = useUIStore((s) => s.fetchExchangeRates);

  useEffect(() => {
    fetchExchangeRates();
    const timer = setTimeout(() => {
      setIsAppLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [fetchExchangeRates, setIsAppLoading]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <GlobalQueryToast />
          <BottomSheetModalProvider>
            <AuthProvider>{children}</AuthProvider>
          </BottomSheetModalProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
      <Toast />
    </GestureHandlerRootView>
  );
}
