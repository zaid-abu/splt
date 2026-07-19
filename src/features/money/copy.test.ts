import { describeBalance, describeExpenseConsequence, describeSettlementResult } from "./copy";

describe("describeBalance", () => {
  it("describes a negative balance as 'you owe'", () => {
    expect(
      describeBalance({
        signedAmountMinor: -1250,
        currency: "USD",
        name: "Mina",
      })
    ).toBe("You owe Mina $12.50");
  });

  it("describes a positive balance as 'owes you'", () => {
    expect(
      describeBalance({
        signedAmountMinor: 2000,
        currency: "USD",
        name: "Mina",
      })
    ).toBe("Mina owes you $20.00");
  });

  it("describes zero as settled", () => {
    expect(
      describeBalance({
        signedAmountMinor: 0,
        currency: "USD",
        name: "Mina",
      })
    ).toBe("You and Mina are settled");
  });

  it("handles JPY (zero decimal currency)", () => {
    expect(
      describeBalance({
        signedAmountMinor: -500,
        currency: "JPY",
        name: "Taro",
      })
    ).toBe("You owe Taro ¥500");
  });

  it("handles positive JPY", () => {
    expect(
      describeBalance({
        signedAmountMinor: 1000,
        currency: "JPY",
        name: "Taro",
      })
    ).toBe("Taro owes you ¥1,000");
  });

  it("handles -0 normalized to settled", () => {
    expect(
      describeBalance({
        signedAmountMinor: -0,
        currency: "USD",
        name: "Nobody",
      })
    ).toBe("You and Nobody are settled");
  });
});

describe("describeExpenseConsequence", () => {
  it("describes when user paid the full expense", () => {
    expect(
      describeExpenseConsequence({
        amountMinor: 2000,
        currency: "USD",
        title: "Pizza",
        yourShareMinor: 2000,
        payerName: "You",
        isPayer: true,
      })
    ).toBe("You paid $20.00 for Pizza");
  });

  it("describes the user's share when not the payer", () => {
    expect(
      describeExpenseConsequence({
        amountMinor: 3000,
        currency: "USD",
        title: "Uber",
        yourShareMinor: 1000,
        payerName: "Mina",
        isPayer: false,
      })
    ).toBe("Your share of Uber is $10.00");
  });

  it("handles zero decimal currency", () => {
    expect(
      describeExpenseConsequence({
        amountMinor: 1500,
        currency: "JPY",
        title: "Ramen",
        yourShareMinor: 500,
        payerName: "Taro",
        isPayer: false,
      })
    ).toBe("Your share of Ramen is ¥500");
  });
});

describe("describeSettlementResult", () => {
  it("describes when user paid the counterparty", () => {
    expect(
      describeSettlementResult({
        amountMinor: 1250,
        currency: "USD",
        counterpartyName: "Mina",
        direction: "paid",
      })
    ).toBe("You paid $12.50 to Mina");
  });

  it("describes when user received from counterparty", () => {
    expect(
      describeSettlementResult({
        amountMinor: 3000,
        currency: "USD",
        counterpartyName: "Mina",
        direction: "received",
      })
    ).toBe("Mina paid you $30.00");
  });

  it("handles JPY settlement", () => {
    expect(
      describeSettlementResult({
        amountMinor: 1000,
        currency: "JPY",
        counterpartyName: "Taro",
        direction: "paid",
      })
    ).toBe("You paid ¥1,000 to Taro");
  });
});
