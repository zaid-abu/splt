import { expenseComposerReducer, type ExpenseComposerAction, type ExpenseComposerState } from "./useExpenseComposer"
import type { MoneyContext } from "@/features/money/types"

const defaultState: ExpenseComposerState = {
  amountInput: "",
  currency: "USD",
  description: "",
  paidBy: "",
  participants: [],
  splitMethod: "equal",
  splitSources: {},
  date: new Date("2026-07-19"),
  category: "other",
  notes: "",
  status: "editing",
}

function reduce(actions: ExpenseComposerAction[]): ExpenseComposerState {
  return actions.reduce(expenseComposerReducer, defaultState)
}

const groupCtx: MoneyContext = { type: "group", groupId: "g1" }
const directCtx: MoneyContext = { type: "direct", friendshipId: "f1" }

const me = { userId: "me", name: "You" }
const alice = { userId: "a", name: "Alice" }
const bob = { userId: "b", name: "Bob" }

describe("expenseComposerReducer", () => {
  describe("SET_CONTEXT", () => {
    it("sets context and participants with default sources", () => {
      const state = reduce([
        {
          type: "SET_CONTEXT",
          context: groupCtx,
          participants: [me, alice, bob],
          currency: "EUR",
        },
      ])

      expect(state.context).toEqual(groupCtx)
      expect(state.participants).toEqual([me, alice, bob])
      expect(state.currency).toBe("EUR")
      expect(state.paidBy).toBe("me")
      expect(Object.keys(state.splitSources)).toHaveLength(3)
      expect(state.status).toBe("editing")
      expect(state.error).toBeUndefined()
    })

    it("resets split sources on context change", () => {
      const s1 = reduce([
        { type: "SET_CONTEXT", context: groupCtx, participants: [me, alice], currency: "USD" },
        { type: "SET_AMOUNT", amountInput: "30" },
      ])

      const s2 = expenseComposerReducer(s1, {
        type: "SET_CONTEXT",
        context: directCtx,
        participants: [me, bob],
        currency: "EUR",
      })

      expect(s2.context).toEqual(directCtx)
      expect(s2.participants).toEqual([me, bob])
      expect(s2.currency).toBe("EUR")
    })
  })

  describe("SET_SPLIT_METHOD", () => {
    it("switches to percentage and initializes zero percentages", () => {
      const state = reduce([
        { type: "SET_CONTEXT", context: groupCtx, participants: [me, alice], currency: "USD" },
        { type: "SET_SPLIT_METHOD", splitMethod: "percentage" },
      ])

      expect(state.splitMethod).toBe("percentage")
      expect(state.splitSources.me).toEqual({ percentageUnits: 0 })
      expect(state.splitSources.a).toEqual({ percentageUnits: 0 })
      expect(state.error).toBeUndefined()
    })

    it("switches to shares and initializes default shares", () => {
      const state = reduce([
        { type: "SET_CONTEXT", context: groupCtx, participants: [me, alice], currency: "USD" },
        { type: "SET_SPLIT_METHOD", splitMethod: "shares" },
      ])

      expect(state.splitMethod).toBe("shares")
      expect(state.splitSources.me).toEqual({ shareUnits: 1000000 })
      expect(state.splitSources.a).toEqual({ shareUnits: 1000000 })
    })

    it("switches to custom and zeroes amounts", () => {
      const state = reduce([
        { type: "SET_CONTEXT", context: groupCtx, participants: [me, alice], currency: "USD" },
        { type: "SET_SPLIT_METHOD", splitMethod: "custom" },
      ])

      expect(state.splitSources.me).toEqual({ amountMinor: 0 })
      expect(state.splitSources.a).toEqual({ amountMinor: 0 })
    })
  })

  describe("SET_SOURCE", () => {
    it("updates a single participant source", () => {
      const state = reduce([
        { type: "SET_CONTEXT", context: groupCtx, participants: [me, alice], currency: "USD" },
        { type: "SET_SPLIT_METHOD", splitMethod: "percentage" },
        { type: "SET_SOURCE", userId: "me", source: { percentageUnits: 600000 } },
      ])

      expect(state.splitSources.me).toEqual({ percentageUnits: 600000 })
      expect(state.splitSources.a).toEqual({ percentageUnits: 0 })
    })
  })

  describe("RESET_SPLIT", () => {
    it("resets split sources to defaults", () => {
      const state = reduce([
        { type: "SET_CONTEXT", context: groupCtx, participants: [me, alice], currency: "USD" },
        { type: "SET_SPLIT_METHOD", splitMethod: "percentage" },
        { type: "SET_SOURCE", userId: "me", source: { percentageUnits: 700000 } },
        { type: "RESET_SPLIT" },
      ])

      expect(state.splitSources.me).toEqual({ percentageUnits: 0 })
      expect(state.splitSources.a).toEqual({ percentageUnits: 0 })
    })
  })

  describe("CONFIRM_CURRENCY", () => {
    it("changes currency and resets split sources", () => {
      const state = reduce([
        { type: "SET_CONTEXT", context: groupCtx, participants: [me, alice], currency: "USD" },
        { type: "SET_AMOUNT", amountInput: "50" },
        { type: "CONFIRM_CURRENCY", currency: "EUR" },
      ])

      expect(state.currency).toBe("EUR")
      expect(state.amountInput).toBe("50")
    })
  })

  describe("SUBMIT flow", () => {
    it("transitions through submitting states", () => {
      const s1 = expenseComposerReducer(defaultState, { type: "SUBMIT_START" })
      expect(s1.status).toBe("submitting")

      const s2 = expenseComposerReducer(s1, { type: "SUBMIT_SUCCESS" })
      expect(s2.status).toBe("success")

      const s3 = expenseComposerReducer(defaultState, { type: "SUBMIT_START" })
      const s4 = expenseComposerReducer(s3, {
        type: "SUBMIT_ERROR",
        error: { message: "Network error", code: "NETWORK" },
      })
      expect(s4.status).toBe("editing")
      expect(s4.error?.message).toBe("Network error")
    })
  })

  describe("SET_AMOUNT", () => {
    it("stores raw input string", () => {
      const state = expenseComposerReducer(defaultState, { type: "SET_AMOUNT", amountInput: "42.50" })
      expect(state.amountInput).toBe("42.50")
      expect(state.error).toBeUndefined()
    })
  })

  describe("SET_PAID_BY", () => {
    it("updates paidBy", () => {
      const state = expenseComposerReducer(defaultState, { type: "SET_PAID_BY", paidBy: "a" })
      expect(state.paidBy).toBe("a")
    })
  })

  describe("INIT_EDIT", () => {
    it("initializes edit state preserving split sources", () => {
      const state = reduce([
        {
          type: "INIT_EDIT",
          state: {
            context: groupCtx,
            participants: [me, alice],
            description: "Dinner",
            amountInput: "60",
            currency: "USD",
            paidBy: "a",
            splitMethod: "equal",
          },
        },
      ])

      expect(state.description).toBe("Dinner")
      expect(state.amountInput).toBe("60")
      expect(state.paidBy).toBe("a")
      expect(state.status).toBe("editing")
    })
  })
})
