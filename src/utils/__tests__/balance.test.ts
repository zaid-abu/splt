jest.mock("@/components/ui/AmountDisplay", () => ({
  formatAmount: (amount: number, currencyCode: string) => {
    const symbol = currencyCode === "USD" ? "$" : currencyCode;
    return `${symbol}${amount.toFixed(2)}`;
  },
}))

jest.mock("@/components/ui/native-ui", () => ({
  UI: {
    color: {
      success: "#4CAF82",
      successTint: "#F5FCF8",
      danger: "#E85D5D",
      dangerTint: "#FFF7F5",
      muted: "#6E6D68",
      control: "#FFFFFF",
    },
  },
}))

import { getBalanceCopy } from "@/utils/balance"

describe("getBalanceCopy", () => {
  it("returns 'Owes you' with success color for positive balances", () => {
    const result = getBalanceCopy(50, "USD")

    expect(result.label).toBe("Owes you")
    expect(result.color).toBe("#4CAF82")
    expect(result.bg).toBe("#F5FCF8")
    expect(result.amount).toBe("$50.00")
  })

  it("returns 'You owe' with danger color for negative balances", () => {
    const result = getBalanceCopy(-50, "USD")

    expect(result.label).toBe("You owe")
    expect(result.color).toBe("#E85D5D")
    expect(result.bg).toBe("#FFF7F5")
    expect(result.amount).toBe("$50.00")
  })

  it("returns 'Settled' with muted color for zero balances", () => {
    const result = getBalanceCopy(0, "USD")

    expect(result.label).toBe("Settled")
    expect(result.amount).toBe("No balance")
    expect(result.color).toBe("#6E6D68")
    expect(result.bg).toBe("#FFFFFF")
  })
})
