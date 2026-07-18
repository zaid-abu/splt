import React, { useEffect } from "react";
import type { JSX, ReactNode } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Appearance } from "react-native";
import { HeroUINativeProvider } from "heroui-native";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { QueryClientProvider } from "@tanstack/react-query";

import { AuthProvider } from "@/context/AppContext";
import { AuthLifecycleGuard } from "@/features/auth/components/AuthLifecycleGuard";
import { useUIStore } from "@/store/useUIStore";
import { queryClient } from "@/lib/queryClient";
import { GlobalQueryToast } from "@/components/feedback/GlobalQueryToast";

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps): JSX.Element {
  const isDarkMode = useUIStore((s) => s.isDarkMode);
  const fetchExchangeRates = useUIStore((s) => s.fetchExchangeRates);

  useEffect(() => {
    Appearance.setColorScheme(isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  useEffect(() => {
    fetchExchangeRates();
  }, [fetchExchangeRates]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <HeroUINativeProvider>
            <GlobalQueryToast />
            <BottomSheetModalProvider>
              <AuthProvider>
                <AuthLifecycleGuard>{children}</AuthLifecycleGuard>
              </AuthProvider>
            </BottomSheetModalProvider>
          </HeroUINativeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
