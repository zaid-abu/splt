import React, { useEffect } from "react";
import type { JSX, ReactNode } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Appearance } from "react-native";
import { HeroUINativeProvider } from "heroui-native";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { QueryClientProvider, onlineManager } from "@tanstack/react-query";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { AuthProvider } from "@/context/AppContext";
import { useUIStore } from "@/store/useUIStore";
import { queryClient } from "@/lib/queryClient";
import { GlobalQueryToast } from "@/components/feedback/GlobalQueryToast";

interface AppProviderProps {
  children: ReactNode;
}

// Setup online manager for React Query
onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    setOnline(!!state.isConnected);
  });
});

// Setup query cache persistence for offline reads
const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  throttleTime: 3000,
});

persistQueryClient({
  queryClient,
  persister: asyncStoragePersister,
  maxAge: 1000 * 60 * 60 * 24, // 24 hours
});

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
              <AuthProvider>{children}</AuthProvider>
            </BottomSheetModalProvider>
          </HeroUINativeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
