/**
 * Tests for useUIStore — currency conversion, exchange rates, loading state.
 *
 * Zustand stores must be reset between tests. We import the store
 * directly and use `.setState()` to isolate state.
 */

// Mock env config to avoid import failures
jest.mock("@/config/env", () => ({
  env: {
    EXPO_PUBLIC_SUPABASE_URL: "http://localhost",
    EXPO_PUBLIC_SUPABASE_ANON_KEY: "test-key",
  },
}));
jest.mock("react-native-url-polyfill/auto", () => ({}));

import { useUIStore } from "@/store/useUIStore";
import { USD_CURRENCY, INR_CURRENCY } from "../setup/fixtures";

// Reset store state before each test
beforeEach(() => {
  useUIStore.setState({
    isAppLoading: true,
    preferredCurrency: INR_CURRENCY,
    exchangeRates: {
      USD: 1,
      EUR: 0.92,
      GBP: 0.79,
      INR: 83.5,
    },
  });
});

// ─── convertCurrency ──────────────────────────────────────────────────────────

describe("useUIStore.convertCurrency", () => {
  const { convertCurrency } = useUIStore.getState();

  it("returns amount unchanged when from === to", () => {
    const result = useUIStore.getState().convertCurrency(100, "USD", "USD");
    expect(result).toBe(100);
  });

  it("converts USD to EUR using exchange rates", () => {
    // EUR rate = 0.92, USD rate = 1 → 100 USD = (100/1) * 0.92 = 92 EUR
    const result = useUIStore.getState().convertCurrency(100, "USD", "EUR");
    expect(result).toBeCloseTo(92);
  });

  it("converts EUR to USD", () => {
    // 92 EUR → (92 / 0.92) * 1 = 100 USD
    const result = useUIStore.getState().convertCurrency(92, "EUR", "USD");
    expect(result).toBeCloseTo(100);
  });

  it("converts USD to INR", () => {
    // 1 USD = 83.5 INR → 10 USD = 835 INR
    const result = useUIStore.getState().convertCurrency(10, "USD", "INR");
    expect(result).toBeCloseTo(835);
  });

  it("uses fallback rate of 1 for unknown currencies", () => {
    // Unknown → treated as 1, so amount is returned as-is
    useUIStore.setState({ exchangeRates: {} });
    const result = useUIStore.getState().convertCurrency(100, "XYZ", "USD");
    expect(result).toBe(100); // (100 / 1) * 1 = 100
  });
});

// ─── setCurrency ──────────────────────────────────────────────────────────────

describe("useUIStore.setCurrency", () => {
  it("updates the preferredCurrency", () => {
    useUIStore.getState().setCurrency(USD_CURRENCY);
    expect(useUIStore.getState().preferredCurrency.code).toBe("USD");
  });
});

// ─── setExchangeRates ─────────────────────────────────────────────────────────

describe("useUIStore.setExchangeRates", () => {
  it("replaces exchange rates and affects subsequent conversions", () => {
    useUIStore.getState().setExchangeRates({ USD: 1, EUR: 0.5 }); // custom rate
    const result = useUIStore.getState().convertCurrency(100, "USD", "EUR");
    expect(result).toBeCloseTo(50);
  });
});

// ─── setIsAppLoading ──────────────────────────────────────────────────────────

describe("useUIStore.setIsAppLoading", () => {
  it("sets isAppLoading to false", () => {
    useUIStore.getState().setIsAppLoading(false);
    expect(useUIStore.getState().isAppLoading).toBe(false);
  });

  it("sets isAppLoading to true", () => {
    useUIStore.setState({ isAppLoading: false });
    useUIStore.getState().setIsAppLoading(true);
    expect(useUIStore.getState().isAppLoading).toBe(true);
  });
});

// ─── fetchExchangeRates ───────────────────────────────────────────────────────

describe("useUIStore.fetchExchangeRates", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("updates exchange rates on successful fetch", async () => {
    const mockRates = { USD: 1, EUR: 0.9, GBP: 0.8 };
    global.fetch = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue({ result: "success", rates: mockRates }),
    } as any);

    await useUIStore.getState().fetchExchangeRates();
    expect(useUIStore.getState().exchangeRates).toEqual(mockRates);
  });

  it("keeps fallback rates when fetch fails", async () => {
    const originalRates = { ...useUIStore.getState().exchangeRates };
    global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));

    await useUIStore.getState().fetchExchangeRates();
    // Rates should remain unchanged
    expect(useUIStore.getState().exchangeRates).toEqual(originalRates);
  });

  it("keeps fallback rates when response result is not success", async () => {
    const originalRates = { ...useUIStore.getState().exchangeRates };
    global.fetch = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue({ result: "error" }),
    } as any);

    await useUIStore.getState().fetchExchangeRates();
    expect(useUIStore.getState().exchangeRates).toEqual(originalRates);
  });
});
