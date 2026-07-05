/**
 * Tests for useDataStore — balance getters:
 * getGroupBalances, getSimplifiedDebts, getExactPairwiseDebts,
 * getUserBalances, getTotalOwedToMe, getTotalIOwe, getNetBalance
 */

jest.mock("@/config/env", () => ({
  env: {
    EXPO_PUBLIC_SUPABASE_URL: "http://localhost",
    EXPO_PUBLIC_SUPABASE_ANON_KEY: "test-key",
  },
}));
jest.mock("react-native-url-polyfill/auto", () => ({}));

// Identity converter — keeps amounts as-is, USD as preferred
jest.mock("@/store/useUIStore", () => ({
  useUIStore: {
    getState: () => ({
      preferredCurrency: { code: "USD" },
      convertCurrency: (amount: number) => amount,
    }),
  },
}));

import { useDataStore } from "@/store/useDataStore";
import { USER_1, USER_2, USER_3, GROUP_1, EXPENSE_EQUAL, EXPENSE_2, SETTLEMENT_1 } from "../setup/fixtures";

// ─── Reset store to a controlled state before each test ───────────────────────

function loadState(opts: { withSettlement?: boolean; withExpense2?: boolean } = {}) {
  useDataStore.setState({
    groups: [GROUP_1],
    expenses: [
      EXPENSE_EQUAL,
      ...(opts.withExpense2 ? [EXPENSE_2] : []),
    ],
    activities: [],
    settlements: opts.withSettlement ? [SETTLEMENT_1] : [],
  });
}

beforeEach(() => loadState());

// ─── getGroupBalances ─────────────────────────────────────────────────────────

describe("useDataStore.getGroupBalances", () => {
  it("returns empty map when no expenses", () => {
    useDataStore.setState({ expenses: [], settlements: [], groups: [GROUP_1] });
    const result = useDataStore.getState().getGroupBalances("group-1");
    expect(result.size).toBe(0);
  });

  it("credits payer and debits split members (excluding payer's own split)", () => {
    // EXPENSE_EQUAL: user-1 paid 300; user-2 & user-3 each owe 100
    const balances = useDataStore.getState().getGroupBalances("group-1");
    expect(balances.get("user-1")).toBeCloseTo(200); // owed 100 from user-2 + 100 from user-3
    expect(balances.get("user-2")).toBeCloseTo(-100);
    expect(balances.get("user-3")).toBeCloseTo(-100);
  });

  it("reduces debt after a settlement", () => {
    loadState({ withSettlement: true });
    // Settlement: user-2 paid user-1 $100
    const balances = useDataStore.getState().getGroupBalances("group-1");
    expect(balances.get("user-1")).toBeCloseTo(100); // was 200, now 100
    expect(balances.get("user-2")).toBeCloseTo(0); // was -100, now 0
    expect(balances.get("user-3")).toBeCloseTo(-100);
  });
});

// ─── getSimplifiedDebts ───────────────────────────────────────────────────────

describe("useDataStore.getSimplifiedDebts", () => {
  it("returns empty array when there are no debts", () => {
    useDataStore.setState({ expenses: [], settlements: [], groups: [GROUP_1] });
    const result = useDataStore.getState().getSimplifiedDebts("group-1");
    expect(result).toHaveLength(0);
  });

  it("minimizes transactions for 2 debtors, 1 creditor", () => {
    // user-1 owed 200; user-2 owes 100, user-3 owes 100 → 2 payments needed
    const debts = useDataStore.getState().getSimplifiedDebts("group-1");
    expect(debts).toHaveLength(2);
    debts.forEach((d) => expect(d.toUserId).toBe("user-1"));
  });

  it("returns empty when all debts are settled", () => {
    const settle2 = { ...SETTLEMENT_1, fromUserId: "user-2", amount: 100 };
    const settle3 = { ...SETTLEMENT_1, id: "settle-2", fromUserId: "user-3", amount: 100 };
    useDataStore.setState({
      groups: [GROUP_1],
      expenses: [EXPENSE_EQUAL],
      settlements: [settle2, settle3],
      activities: [],
    });
    const debts = useDataStore.getState().getSimplifiedDebts("group-1");
    expect(debts).toHaveLength(0);
  });
});

// ─── getExactPairwiseDebts ────────────────────────────────────────────────────

describe("useDataStore.getExactPairwiseDebts", () => {
  it("returns exact per-pair debts", () => {
    // EXPENSE_EQUAL: user-2 owes user-1 100, user-3 owes user-1 100
    const debts = useDataStore.getState().getExactPairwiseDebts("group-1");
    const u2u1 = debts.find((d) => d.fromUserId === "user-2" && d.toUserId === "user-1");
    const u3u1 = debts.find((d) => d.fromUserId === "user-3" && d.toUserId === "user-1");
    expect(u2u1?.amount).toBeCloseTo(100);
    expect(u3u1?.amount).toBeCloseTo(100);
  });

  it("nets out reciprocal debts", () => {
    // With EXPENSE_EQUAL + EXPENSE_2:
    // user-2 owes user-1 100 (from EXPENSE_EQUAL)
    // user-1 owes user-2 25 (from EXPENSE_2)
    // → net: user-2 owes user-1 75
    loadState({ withExpense2: true });
    const debts = useDataStore.getState().getExactPairwiseDebts("group-1");
    const u2u1 = debts.find((d) => d.fromUserId === "user-2" && d.toUserId === "user-1");
    expect(u2u1?.amount).toBeCloseTo(75);
  });

  it("returns debts sorted by amount descending", () => {
    const debts = useDataStore.getState().getExactPairwiseDebts("group-1");
    for (let i = 1; i < debts.length; i++) {
      expect(debts[i - 1].amount).toBeGreaterThanOrEqual(debts[i].amount);
    }
  });
});

// ─── getUserBalances ──────────────────────────────────────────────────────────

describe("useDataStore.getUserBalances", () => {
  it("shows positive balance for users who owe the current user", () => {
    const balances = useDataStore.getState().getUserBalances("user-1");
    // user-2 and user-3 owe user-1 money → positive
    expect((balances.get("user-2") ?? 0)).toBeGreaterThan(0);
    expect((balances.get("user-3") ?? 0)).toBeGreaterThan(0);
  });

  it("shows negative balance when current user owes someone", () => {
    const balances = useDataStore.getState().getUserBalances("user-2");
    // user-2 owes user-1 → negative
    expect((balances.get("user-1") ?? 0)).toBeLessThan(0);
  });

  it("returns scoped balances when groupId is provided", () => {
    const balances = useDataStore.getState().getUserBalances("user-1", "group-1");
    // Should still reflect the group-1 debts
    expect(balances.size).toBeGreaterThan(0);
  });
});

// ─── getTotalOwedToMe ─────────────────────────────────────────────────────────

describe("useDataStore.getTotalOwedToMe", () => {
  it("returns total amount owed to the current user", () => {
    // user-1 is owed 100 by user-2 and 100 by user-3 (from GROUP_1, exact pairwise)
    const total = useDataStore.getState().getTotalOwedToMe("user-1");
    expect(total).toBeGreaterThan(0);
  });

  it("returns 0 when user is owed nothing", () => {
    useDataStore.setState({ expenses: [], settlements: [], groups: [GROUP_1] });
    const total = useDataStore.getState().getTotalOwedToMe("user-1");
    expect(total).toBe(0);
  });
});

// ─── getTotalIOwe ─────────────────────────────────────────────────────────────

describe("useDataStore.getTotalIOwe", () => {
  it("returns total amount current user owes", () => {
    // user-2 owes user-1 100
    const total = useDataStore.getState().getTotalIOwe("user-2");
    expect(total).toBeGreaterThan(0);
  });

  it("returns 0 when user owes nothing", () => {
    useDataStore.setState({ expenses: [], settlements: [], groups: [GROUP_1] });
    const total = useDataStore.getState().getTotalIOwe("user-2");
    expect(total).toBe(0);
  });
});

// ─── getNetBalance ────────────────────────────────────────────────────────────

describe("useDataStore.getNetBalance", () => {
  it("returns positive net for a creditor", () => {
    // user-1 is owed money → positive net
    const net = useDataStore.getState().getNetBalance("user-1");
    expect(net).toBeGreaterThan(0);
  });

  it("returns negative net for a debtor", () => {
    // user-2 owes money → negative net
    const net = useDataStore.getState().getNetBalance("user-2");
    expect(net).toBeLessThan(0);
  });

  it("returns 0 when user has no outstanding balances", () => {
    useDataStore.setState({ expenses: [], settlements: [], groups: [GROUP_1] });
    const net = useDataStore.getState().getNetBalance("user-1");
    expect(net).toBe(0);
  });
});
