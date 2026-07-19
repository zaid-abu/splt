import type { MoneyContext, OpenBalance } from "./types";
import type { BalanceEvent, SettlementScope } from "./balances";
import {
  aggregateOpenBalances,
  classifyPersonBalances,
  normalizeSignedMinor,
  orderBalances,
  selectSettlementTarget,
} from "./balances";

const groupCtx = (gid: string): MoneyContext => ({ type: "group", groupId: gid });
const directCtx = (fid: string): MoneyContext => ({
  type: "direct",
  friendshipId: fid,
});
const now = new Date("2026-07-19T12:00:00Z");
const earlier = new Date("2026-07-18T12:00:00Z");

function event(overrides: Partial<BalanceEvent> & { counterpartyId: string }): BalanceEvent {
  return {
    context: groupCtx("g1"),
    currency: "USD",
    signedAmountMinor: 0,
    date: now,
    ...overrides,
  };
}

function ob(overrides: Partial<OpenBalance> & { counterpartyId: string }): OpenBalance {
  return {
    context: groupCtx("g1"),
    currency: "USD",
    signedAmountMinor: 0,
    lastActivityAt: now,
    ...overrides,
  };
}

const usd = (amount: number) =>
  ob({ counterpartyId: "u1", currency: "USD", signedAmountMinor: amount });
const eur = (amount: number) =>
  ob({ counterpartyId: "u1", currency: "EUR", signedAmountMinor: amount });

describe("normalizeSignedMinor", () => {
  it("converts -0 to 0", () => {
    expect(normalizeSignedMinor(-0)).toBe(0);
  });

  it("leaves positive values unchanged", () => {
    expect(normalizeSignedMinor(500)).toBe(500);
  });

  it("leaves negative values unchanged", () => {
    expect(normalizeSignedMinor(-500)).toBe(-500);
  });

  it("leaves zero unchanged", () => {
    expect(normalizeSignedMinor(0)).toBe(0);
    expect(Object.is(normalizeSignedMinor(0), 0)).toBe(true);
  });
});

describe("aggregateOpenBalances", () => {
  it("sums events grouped by counterparty+context+currency", () => {
    const result = aggregateOpenBalances(
      [
        event({ counterpartyId: "u1", signedAmountMinor: 500 }),
        event({ counterpartyId: "u1", signedAmountMinor: 300 }),
        event({ counterpartyId: "u2", signedAmountMinor: -200 }),
      ],
      "me"
    );

    expect(result).toHaveLength(2);
    const u1 = result.find((b) => b.counterpartyId === "u1")!;
    expect(u1.signedAmountMinor).toBe(800);
    const u2 = result.find((b) => b.counterpartyId === "u2")!;
    expect(u2.signedAmountMinor).toBe(-200);
  });

  it("filters out self-referential events", () => {
    const result = aggregateOpenBalances(
      [
        event({ counterpartyId: "me", signedAmountMinor: 500 }),
        event({ counterpartyId: "u1", signedAmountMinor: 100 }),
      ],
      "me"
    );

    expect(result).toHaveLength(1);
    expect(result[0].counterpartyId).toBe("u1");
  });

  it("isolates different currencies for same counterparty", () => {
    const result = aggregateOpenBalances(
      [
        event({ counterpartyId: "u1", currency: "USD", signedAmountMinor: 500 }),
        event({ counterpartyId: "u1", currency: "EUR", signedAmountMinor: -300 }),
      ],
      "me"
    );

    expect(result).toHaveLength(2);
  });

  it("isolates different contexts for same counterparty and currency", () => {
    const result = aggregateOpenBalances(
      [
        event({
          counterpartyId: "u1",
          context: groupCtx("g1"),
          signedAmountMinor: 500,
        }),
        event({
          counterpartyId: "u1",
          context: groupCtx("g2"),
          signedAmountMinor: 200,
        }),
      ],
      "me"
    );

    expect(result).toHaveLength(2);
  });

  it("enforces per-group bilateral isolation", () => {
    const result = aggregateOpenBalances(
      [
        event({
          counterpartyId: "u1",
          context: groupCtx("g1"),
          currency: "USD",
          signedAmountMinor: 500,
        }),
        event({
          counterpartyId: "u1",
          context: groupCtx("g2"),
          currency: "USD",
          signedAmountMinor: -200,
        }),
      ],
      "me"
    );

    expect(result).toHaveLength(2);
    expect(result.find((b) => b.context.groupId === "g1")!.signedAmountMinor).toBe(500);
    expect(result.find((b) => b.context.groupId === "g2")!.signedAmountMinor).toBe(-200);
  });

  it("uses the latest date as lastActivityAt", () => {
    const result = aggregateOpenBalances(
      [
        event({
          counterpartyId: "u1",
          signedAmountMinor: 100,
          date: earlier,
        }),
        event({
          counterpartyId: "u1",
          signedAmountMinor: 200,
          date: now,
        }),
      ],
      "me"
    );

    expect(result).toHaveLength(1);
    expect(result[0].lastActivityAt).toEqual(now);
  });

  it("returns empty array for no events", () => {
    expect(aggregateOpenBalances([], "me")).toEqual([]);
  });
});

describe("classifyPersonBalances", () => {
  it("returns mixed when balances have both positive and negative", () => {
    expect(classifyPersonBalances([usd(500), eur(-200)])).toBe("mixed");
  });

  it("returns owes-you when all positive", () => {
    expect(classifyPersonBalances([usd(500)])).toBe("owes-you");
  });

  it("returns you-owe when all negative", () => {
    expect(classifyPersonBalances([eur(-200)])).toBe("you-owe");
  });

  it("returns settled when empty", () => {
    expect(classifyPersonBalances([])).toBe("settled");
  });

  it("returns settled when all zero", () => {
    expect(classifyPersonBalances([usd(0), eur(0)])).toBe("settled");
  });

  it("returns owes-you when positive and zero mix", () => {
    expect(classifyPersonBalances([usd(100), eur(0)])).toBe("owes-you");
  });

  it("returns you-owe when negative and zero mix", () => {
    expect(classifyPersonBalances([usd(0), eur(-100)])).toBe("you-owe");
  });

  it("handles single positive row", () => {
    expect(classifyPersonBalances([ob({ counterpartyId: "a", signedAmountMinor: 1 })])).toBe(
      "owes-you"
    );
  });

  it("handles single negative row", () => {
    expect(classifyPersonBalances([ob({ counterpartyId: "a", signedAmountMinor: -1 })])).toBe(
      "you-owe"
    );
  });
});

describe("orderBalances", () => {
  it("puts preferred currency first", () => {
    const rows = [
      ob({ counterpartyId: "u1", currency: "EUR", signedAmountMinor: 100 }),
      ob({ counterpartyId: "u2", currency: "USD", signedAmountMinor: 200 }),
    ];
    const result = orderBalances(rows, "USD");
    expect(result[0].currency).toBe("USD");
    expect(result[1].currency).toBe("EUR");
  });

  it("sorts by currency code after preferred", () => {
    const rows = [
      ob({ counterpartyId: "u1", currency: "GBP", signedAmountMinor: 100 }),
      ob({ counterpartyId: "u2", currency: "EUR", signedAmountMinor: 200 }),
    ];
    const result = orderBalances(rows, "USD");
    // EUR comes before GBP alphabetically
    expect(result[0].currency).toBe("EUR");
    expect(result[1].currency).toBe("GBP");
  });

  it("sorts by absolute amount descending within same currency", () => {
    const rows = [
      ob({ counterpartyId: "u1", currency: "USD", signedAmountMinor: 100 }),
      ob({ counterpartyId: "u2", currency: "USD", signedAmountMinor: -300 }),
      ob({ counterpartyId: "u3", currency: "USD", signedAmountMinor: 200 }),
    ];
    const result = orderBalances(rows, "USD");
    expect(result[0].signedAmountMinor).toBe(-300);
    expect(result[1].signedAmountMinor).toBe(200);
    expect(result[2].signedAmountMinor).toBe(100);
  });

  it("breaks ties by counterpartyId ascending", () => {
    const rows = [
      ob({ counterpartyId: "b", currency: "USD", signedAmountMinor: 100 }),
      ob({ counterpartyId: "a", currency: "USD", signedAmountMinor: 100 }),
    ];
    const result = orderBalances(rows, "USD");
    expect(result[0].counterpartyId).toBe("a");
    expect(result[1].counterpartyId).toBe("b");
  });

  it("returns empty for empty input", () => {
    expect(orderBalances([], "USD")).toEqual([]);
  });

  it("does not mutate the original array", () => {
    const rows = [
      ob({ counterpartyId: "b", currency: "USD", signedAmountMinor: 100 }),
      ob({ counterpartyId: "a", currency: "USD", signedAmountMinor: 200 }),
    ];
    const copy = [...rows];
    orderBalances(rows, "USD");
    expect(rows).toEqual(copy);
  });
});

describe("selectSettlementTarget", () => {
  it("selects largest positive balance for global scope", () => {
    const rows = [
      ob({ counterpartyId: "u1", signedAmountMinor: 500 }),
      ob({ counterpartyId: "u2", signedAmountMinor: 1200 }),
    ];
    const result = selectSettlementTarget(rows, "global");
    expect(result).not.toBeNull();
    expect(result!.counterpartyId).toBe("u2");
    expect(result!.amountMinor).toBe(1200);
  });

  it("selects smallest negative (closest to zero) when no positive balances", () => {
    const rows = [
      ob({ counterpartyId: "u1", signedAmountMinor: -500 }),
      ob({ counterpartyId: "u2", signedAmountMinor: -200 }),
    ];
    const result = selectSettlementTarget(rows, "global");
    expect(result).not.toBeNull();
    expect(result!.counterpartyId).toBe("u2");
    expect(result!.amountMinor).toBe(-200);
  });

  it("returns null when all zero", () => {
    const result = selectSettlementTarget(
      [ob({ counterpartyId: "u1", signedAmountMinor: 0 })],
      "global"
    );
    expect(result).toBeNull();
  });

  it("returns null for empty rows", () => {
    expect(selectSettlementTarget([], "global")).toBeNull();
  });

  it("works with group scope", () => {
    const rows = [
      ob({ counterpartyId: "u1", signedAmountMinor: 300 }),
      ob({ counterpartyId: "u2", signedAmountMinor: 500 }),
    ];
    const result = selectSettlementTarget(rows, "group");
    expect(result).not.toBeNull();
    expect(result!.counterpartyId).toBe("u2");
  });

  it("works with friendship scope", () => {
    const rows = [
      ob({
        counterpartyId: "u1",
        context: directCtx("f1"),
        signedAmountMinor: 700,
      }),
    ];
    const result = selectSettlementTarget(rows, "friendship");
    expect(result).not.toBeNull();
    expect(result!.counterpartyId).toBe("u1");
    expect(result!.amountMinor).toBe(700);
  });

  it("settlement selector ambiguity: multiple positives picks largest", () => {
    const rows = [
      ob({ counterpartyId: "a", signedAmountMinor: 150 }),
      ob({ counterpartyId: "b", signedAmountMinor: 250 }),
      ob({ counterpartyId: "c", signedAmountMinor: 100 }),
    ];
    const result = selectSettlementTarget(rows, "global");
    expect(result!.counterpartyId).toBe("b");
    expect(result!.amountMinor).toBe(250);
  });
});
