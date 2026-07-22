import { settlementFlowReducer, type SettlementFlowState } from "./useSettlementFlow"
import type { MoneyContext } from "@/features/money/types"

jest.mock("@/services/supabase/client", () => ({
  supabase: { rpc: jest.fn(), from: jest.fn() },
}))

jest.mock("@tanstack/react-query", () => ({
  useMutation: () => ({ mutateAsync: jest.fn(), isPending: false }),
  useQueryClient: () => ({ invalidateQueries: jest.fn() }),
}))

const baseSelection = {
  counterpartyId: "u2",
  counterpartyName: "Keran",
  context: { type: "group", groupId: "g-1" } as MoneyContext,
  currency: "USD",
  signedAmountMinor: 1500,
  isOwedToYou: false,
}

const loadingState: SettlementFlowState = { step: "loading" }

function composeState(overrides: Partial<SettlementFlowState & { step: "compose" }> = {}): SettlementFlowState & { step: "compose" } {
  return {
    step: "compose",
    selection: baseSelection,
    amountInput: "15",
    method: "cash",
    note: "",
    ...overrides,
  }
}

describe("settlementFlowReducer", () => {
  describe("START_COMPOSE", () => {
    it("transitions from loading to compose", () => {
      const next = settlementFlowReducer(loadingState, {
        type: "START_COMPOSE",
        selection: baseSelection,
      })
      expect(next.step).toBe("compose")
      if (next.step !== "compose") return
      expect(next.selection.counterpartyName).toBe("Keran")
      expect(next.amountInput).toBe("15")
      expect(next.method).toBe("cash")
      expect(next.note).toBe("")
    })
  })

  describe("SET_AMOUNT", () => {
    it("sets amount input in compose step", () => {
      const next = settlementFlowReducer(composeState(), {
        type: "SET_AMOUNT",
        amountInput: "500",
      })
      if (next.step !== "compose") return
      expect(next.amountInput).toBe("500")
    })

    it("does nothing in loading step", () => {
      const next = settlementFlowReducer(loadingState, {
        type: "SET_AMOUNT",
        amountInput: "500",
      })
      expect(next).toBe(loadingState)
    })
  })

  describe("SET_METHOD", () => {
    it("sets payment method in compose", () => {
      const next = settlementFlowReducer(composeState(), {
        type: "SET_METHOD",
        method: "bank_transfer",
      })
      if (next.step !== "compose") return
      expect(next.method).toBe("bank_transfer")
    })

    it("supports all three methods", () => {
      const methods = ["cash", "bank_transfer", "other"] as const
      for (const m of methods) {
        const next = settlementFlowReducer(composeState(), {
          type: "SET_METHOD",
          method: m,
        })
        if (next.step !== "compose") return
        expect(next.method).toBe(m)
      }
    })

    it("sets method in review step", () => {
      const reviewState: SettlementFlowState = {
        step: "review",
        selection: baseSelection,
        amountMinor: 1000,
        method: "cash",
        note: "",
        resultingMinor: -500,
      }
      const next = settlementFlowReducer(reviewState, {
        type: "SET_METHOD",
        method: "other",
      })
      if (next.step !== "review") return
      expect(next.method).toBe("other")
    })
  })

  describe("SET_NOTE", () => {
    it("sets note in compose", () => {
      const next = settlementFlowReducer(composeState(), {
        type: "SET_NOTE",
        note: "Thanks for lunch",
      })
      if (next.step !== "compose") return
      expect(next.note).toBe("Thanks for lunch")
    })
  })

  describe("GO_TO_REVIEW", () => {
    it("transitions from compose to review", () => {
      const next = settlementFlowReducer(composeState({ amountInput: "10" }), {
        type: "GO_TO_REVIEW",
      })
      expect(next.step).toBe("review")
      if (next.step !== "review") return
      expect(next.amountMinor).toBe(1000)
      expect(next.method).toBe("cash")
      expect(next.note).toBe("")
    })

    it("computes resultingMinor for you-owe scenario", () => {
      const next = settlementFlowReducer(
        composeState({
          selection: { ...baseSelection, signedAmountMinor: -1500, isOwedToYou: false },
          amountInput: "10",
        }),
        { type: "GO_TO_REVIEW" }
      )
      if (next.step !== "review") return
      expect(next.resultingMinor).toBe(-500)
    })

    it("computes resultingMinor for owed-to-you scenario", () => {
      const next = settlementFlowReducer(
        composeState({
          selection: { ...baseSelection, signedAmountMinor: 1500, isOwedToYou: true },
          amountInput: "6",
        }),
        { type: "GO_TO_REVIEW" }
      )
      if (next.step !== "review") return
      expect(next.resultingMinor).toBe(900)
    })

    it("clamps amount to maximum", () => {
      const next = settlementFlowReducer(
        composeState({ amountInput: "99" }),
        { type: "GO_TO_REVIEW" }
      )
      if (next.step !== "review") return
      expect(next.amountMinor).toBe(1500)
    })

    it("does not transition when amount is zero", () => {
      const next = settlementFlowReducer(
        composeState({ amountInput: "0" }),
        { type: "GO_TO_REVIEW" }
      )
      expect(next.step).toBe("compose")
    })

    it("does not transition with empty amount", () => {
      const next = settlementFlowReducer(
        composeState({ amountInput: "" }),
        { type: "GO_TO_REVIEW" }
      )
      expect(next.step).toBe("compose")
    })
  })

  describe("GO_BACK_TO_COMPOSE", () => {
    it("goes back from review to compose", () => {
      const reviewState: SettlementFlowState = {
        step: "review",
        selection: baseSelection,
        amountMinor: 1000,
        method: "cash",
        note: "Thanks",
        resultingMinor: -500,
      }
      const next = settlementFlowReducer(reviewState, { type: "GO_BACK_TO_COMPOSE" })
      expect(next.step).toBe("compose")
      if (next.step !== "compose") return
      expect(next.amountInput).toBe("15")
      expect(next.method).toBe("cash")
      expect(next.note).toBe("Thanks")
    })

    it("goes back from success to compose", () => {
      const successState: SettlementFlowState = {
        step: "success",
        settlement: {
          id: "s-1",
          fromUserId: "u1",
          toUserId: "u2",
          amount: 10,
          amountMinor: 1000,
          currency: "USD",
          method: "cash",
          date: new Date(),
          fromUser: { id: "u1", name: "You", email: "you@t.com", initials: "Y", defaultCurrency: "USD", setupState: "complete" },
          toUser: { id: "u2", name: "Keran", email: "k@t.com", initials: "K", defaultCurrency: "USD", setupState: "complete" },
        },
        resultingMinor: -500,
        selection: baseSelection,
      }
      const next = settlementFlowReducer(successState, { type: "GO_BACK_TO_COMPOSE" })
      expect(next.step).toBe("compose")
    })
  })

  describe("SUBMIT_SUCCESS", () => {
    it("transitions to success", () => {
      const reviewState: SettlementFlowState = {
        step: "review",
        selection: baseSelection,
        amountMinor: 1000,
        method: "cash",
        note: "",
        resultingMinor: -500,
      }
      const settlement = {
        id: "s-1",
        fromUserId: "u1",
        toUserId: "u2",
        amount: 10,
        amountMinor: 1000,
        currency: "USD",
        method: "cash",
        date: new Date(),
        fromUser: { id: "u1", name: "You", email: "you@t.com", initials: "Y", defaultCurrency: "USD", setupState: "complete" },
        toUser: { id: "u2", name: "Keran", email: "k@t.com", initials: "K", defaultCurrency: "USD", setupState: "complete" },
      }
      const next = settlementFlowReducer(reviewState, {
        type: "SUBMIT_SUCCESS",
        settlement,
        resultingMinor: -500,
      })
      expect(next.step).toBe("success")
      if (next.step !== "success") return
      expect(next.settlement.id).toBe("s-1")
      expect(next.resultingMinor).toBe(-500)
    })
  })

  describe("direction immutability", () => {
    it("isOwedToYou does not change after compose", () => {
      const compose = composeState({
        selection: { ...baseSelection, isOwedToYou: true },
      })
      const reviewed = settlementFlowReducer(compose, {
        type: "GO_TO_REVIEW",
      })
      if (compose.step !== "compose" || reviewed.step !== "review") return
      expect(compose.selection.isOwedToYou).toBe(true)
      expect(reviewed.selection.isOwedToYou).toBe(true)
    })
  })
})
