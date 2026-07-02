import React, { useEffect } from "react";
import type { JSX, ReactNode } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { HeroUINativeProvider } from "heroui-native";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { AuthProvider } from "@/context/AppContext";
import { useUIStore } from "@/store/useUIStore";

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
        <HeroUINativeProvider config={{ devInfo: { stylingPrinciples: false } }}>
          <BottomSheetModalProvider>
            <AuthProvider>{children}</AuthProvider>
          </BottomSheetModalProvider>
        </HeroUINativeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
