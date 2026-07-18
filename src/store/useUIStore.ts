import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Appearance } from "react-native";
import { Currency, CURRENCIES } from "@/types";

export type ThemePreference = "system" | "light" | "dark";

const FALLBACK_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 151,
  INR: 83.5,
  CAD: 1.36,
  AUD: 1.53,
  CHF: 0.9,
  CNY: 7.23,
  MXN: 16.7,
  BRL: 5.0,
  AED: 3.67,
  SAR: 3.75,
  SGD: 1.35,
  HKD: 7.83,
  KRW: 1350,
  SEK: 10.7,
  NOK: 10.9,
  NZD: 1.67,
};

function resolveIsDarkMode(theme: ThemePreference): boolean {
  if (theme === "system") {
    return Appearance.getColorScheme() === "dark";
  }
  return theme === "dark";
}

export interface UIState {
  isAppLoading: boolean;
  setIsAppLoading: (loading: boolean) => void;

  preferredCurrency: Currency;
  setCurrency: (currency: Currency) => void;

  theme: ThemePreference;
  setTheme: (theme: ThemePreference) => void;

  isDarkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  syncThemeFromSystem: () => void;

  exchangeRates: Record<string, number>;
  setExchangeRates: (rates: Record<string, number>) => void;
  fetchExchangeRates: () => Promise<void>;

  convertCurrency: (amount: number, from: string, to: string) => number;
}

const initialTheme: ThemePreference = "system";
const initialIsDark = resolveIsDarkMode(initialTheme);

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      isAppLoading: false,
      setIsAppLoading: (loading) => set({ isAppLoading: loading }),

      theme: initialTheme,
      isDarkMode: initialIsDark,

      setTheme: (theme) =>
        set({
          theme,
          isDarkMode: resolveIsDarkMode(theme),
        }),

      setDarkMode: (dark) => {
        set({
          theme: dark ? "dark" : "light",
          isDarkMode: dark,
        });
      },

      syncThemeFromSystem: () => {
        const { theme } = get();
        set({ isDarkMode: resolveIsDarkMode(theme) });
      },

      preferredCurrency: CURRENCIES.find((c) => c.code === "USD") ?? CURRENCIES[0]!,
      setCurrency: (currency) => set({ preferredCurrency: currency }),

      exchangeRates: FALLBACK_RATES,
      setExchangeRates: (rates) => set({ exchangeRates: rates }),

      fetchExchangeRates: async () => {
        try {
          const res = await fetch("https://open.er-api.com/v6/latest/USD");
          const data = await res.json();
          if (data && data.result === "success" && data.rates) {
            set({ exchangeRates: data.rates });
          }
        } catch (err) {
          console.warn("Failed to fetch live rates, using fallbacks:", err);
        }
      },

      convertCurrency: (amount, from, to) => {
        if (from === to) return amount;
        const { exchangeRates } = get();
        const rateFrom = exchangeRates[from] || FALLBACK_RATES[from] || 1;
        const rateTo = exchangeRates[to] || FALLBACK_RATES[to] || 1;
        return (amount / rateFrom) * rateTo;
      },
    }),
    {
      name: "splt-ui-store",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        preferredCurrency: state.preferredCurrency,
        exchangeRates: state.exchangeRates,
        theme: state.theme,
      }),
      onRehydrateStorage: () => {
        return (state) => {
          if (state) {
            state.isDarkMode = resolveIsDarkMode(state.theme ?? "system");
          }
        };
      },
    }
  )
);
