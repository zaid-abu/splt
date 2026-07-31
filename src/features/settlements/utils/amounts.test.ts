import {
  isPositiveSettlementInput,
  isSettlementInputWithinBalance,
  SETTLEMENT_AMOUNT_PRESETS,
  settlementPresetInput,
  settlementPresetMinor,
} from "./amounts";

describe("settlement amount helpers", () => {
  it("offers only shortcuts that change the amount", () => {
    expect(SETTLEMENT_AMOUNT_PRESETS.map((preset) => preset.key)).toEqual(["full", "half"]);
  });

  it("accepts positive decimal major-unit input", () => {
    expect(isPositiveSettlementInput("0.50", "USD")).toBe(true);
  });

  it.each(["", "0", "-1", "not-a-number"])("rejects invalid or non-positive input %p", (input) => {
    expect(isPositiveSettlementInput(input, "USD")).toBe(false);
  });

  it("accepts amounts up to the open balance and rejects overpayment", () => {
    expect(isSettlementInputWithinBalance("0.50", "USD", 1500)).toBe(true);
    expect(isSettlementInputWithinBalance("15", "USD", -1500)).toBe(true);
    expect(isSettlementInputWithinBalance("15.01", "USD", 1500)).toBe(false);
  });

  it("converts Full and Half presets from USD minor units to input values", () => {
    expect(settlementPresetInput(1501, "USD", "full")).toBe("15.01");
    expect(settlementPresetInput(1501, "USD", "half")).toBe("7.5");
  });

  it("preserves zero-decimal currency semantics", () => {
    expect(settlementPresetInput(501, "JPY", "full")).toBe("501");
    expect(settlementPresetInput(501, "JPY", "half")).toBe("250");
  });

  it("never returns a negative preset amount", () => {
    expect(settlementPresetMinor(-1501, "full")).toBe(1501);
    expect(settlementPresetMinor(-1501, "half")).toBe(750);
  });
});
