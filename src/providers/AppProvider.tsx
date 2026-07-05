import React, { useEffect } from "react";
import type { JSX, ReactNode } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Appearance } from "react-native";
import { HeroUINativeProvider } from "heroui-native";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { QueryClientProvider } from "@tanstack/react-query";

import { AuthProvider } from "@/context/AppContext";
import { useUIStore } from "@/store/useUIStore";
import { queryClient } from "@/lib/queryClient";
import { GlobalQueryToast } from "@/components/feedback/GlobalQueryToast";

// Force light theme application-wide
Appearance.setColorScheme("light");

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
    }, 1000);
    return () => clearTimeout(timer);
  }, [fetchExchangeRates, setIsAppLoading]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <HeroUINativeProvider config={{ devInfo: { stylingPrinciples: false } }}>
            <GlobalQueryToast />
            <BottomSheetModalProvider>
              <AuthProvider>{children}</AuthProvider>
            </BottomSheetModalProvider>
          </HeroUINativeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
