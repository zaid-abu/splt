import { useReducer, useCallback, useRef } from "react"
import { useCreateSettlement } from "@/features/settlements/queries/useSettlements"
import { parseMinorInput, minorToMajor } from "@/features/money/splits"
import { randomUUID } from "@/utils/randomUUID"
import type { Settlement } from "@/types"
import type { MoneyContext, SettlementMutationInput } from "@/features/money/types"

export type SettlementMethod = "cash" | "bank_transfer" | "other"

export interface DeterminedSettlement {
  counterpartyId: string
  counterpartyName: string
  counterpartyAvatar?: string
  context: MoneyContext
  currency: string
  signedAmountMinor: number
  isOwedToYou: boolean
}

export type SettlementFlowState =
  | { step: "loading" }
  | {
      step: "compose"
      selection: DeterminedSettlement
      amountInput: string
      method: SettlementMethod
      note: string
      composeError?: string
    }
  | {
      step: "review"
      selection: DeterminedSettlement
      amountMinor: number
      method: SettlementMethod
      note: string
      resultingMinor: number
    }
  | { step: "success"; settlement: Settlement; resultingMinor: number; selection: DeterminedSettlement }

export type SettlementFlowAction =
  | { type: "START_COMPOSE"; selection: DeterminedSettlement }
  | { type: "SET_AMOUNT"; amountInput: string }
  | { type: "SET_METHOD"; method: SettlementMethod }
  | { type: "SET_NOTE"; note: string }
  | { type: "GO_TO_REVIEW" }
  | { type: "GO_BACK_TO_COMPOSE"; reason?: string }
  | { type: "SUBMIT_SUCCESS"; settlement: Settlement; resultingMinor: number }
  | { type: "UPDATE_BALANCE"; signedAmountMinor: number }

export function settlementFlowReducer(state: SettlementFlowState, action: SettlementFlowAction): SettlementFlowState {
  switch (action.type) {
    case "START_COMPOSE":
      return {
        step: "compose",
        selection: action.selection,
        amountInput: minorToMajor(Math.abs(action.selection.signedAmountMinor), action.selection.currency).toString(),
        method: "cash",
        note: "",
        composeError: undefined,
      }
    case "SET_AMOUNT":
      if (state.step !== "compose") return state
      return { ...state, amountInput: action.amountInput, composeError: undefined }
    case "SET_METHOD":
      if (state.step !== "compose" && state.step !== "review") return state
      return { ...state, method: action.method }
    case "SET_NOTE":
      if (state.step !== "compose" && state.step !== "review") return state
      return { ...state, note: action.note }
    case "GO_TO_REVIEW": {
      if (state.step !== "compose") return state
      if (!state.amountInput || state.amountInput === "0") return state
      let parsedMinor: number
      try {
        parsedMinor = parseMinorInput(state.amountInput, state.selection.currency)
      } catch {
        return state
      }
      if (parsedMinor <= 0) return state
      const maxMinor = Math.abs(state.selection.signedAmountMinor)
      const clamped = Math.min(parsedMinor, maxMinor)
      const resulting = state.selection.isOwedToYou
        ? state.selection.signedAmountMinor - clamped
        : state.selection.signedAmountMinor + clamped
      return {
        step: "review",
        selection: state.selection,
        amountMinor: clamped,
        method: state.method,
        note: state.note,
        resultingMinor: resulting,
      }
    }
    case "GO_BACK_TO_COMPOSE": {
      if (state.step !== "review" && state.step !== "success") return state
      const sel = state.step === "success" ? state.selection : state.selection
      const m = state.step === "success" ? state.settlement.method : state.method
      const n = state.step === "success" ? (state.settlement.note ?? "") : state.note
      return {
        step: "compose",
        selection: sel,
        amountInput: minorToMajor(Math.abs(sel.signedAmountMinor), sel.currency).toString(),
        method: m,
        note: n,
        composeError: "reason" in action ? action.reason : undefined,
      }
    }
    case "SUBMIT_SUCCESS":
      if (state.step !== "review") return state
      return {
        step: "success",
        settlement: action.settlement,
        resultingMinor: action.resultingMinor,
        selection: state.selection,
      }
    case "UPDATE_BALANCE":
      if (state.step !== "compose") return state
      return {
        ...state,
        selection: { ...state.selection, signedAmountMinor: action.signedAmountMinor },
        amountInput: minorToMajor(Math.abs(action.signedAmountMinor), state.selection.currency).toString(),
        composeError: "Balance changed. Please review and resubmit.",
      }
    default:
      return state
  }
}

export function useSettlementFlow(currentUserId?: string) {
  const [state, dispatch] = useReducer(settlementFlowReducer, { step: "loading" })
  const { mutateAsync: createSettlement } = useCreateSettlement()
  const clientOpCounter = useRef(0)

  const startCompose = useCallback((selection: DeterminedSettlement) => {
    dispatch({ type: "START_COMPOSE", selection })
  }, [])

  const setAmountInput = useCallback((amountInput: string) => {
    const cleaned = amountInput.replace(/[^0-9.]/g, "")
    if (cleaned.length > 15) return
    dispatch({ type: "SET_AMOUNT", amountInput: cleaned })
  }, [])

  const setMethod = useCallback((method: SettlementMethod) => {
    dispatch({ type: "SET_METHOD", method })
  }, [])

  const setNote = useCallback((note: string) => {
    dispatch({ type: "SET_NOTE", note })
  }, [])

  const goToReview = useCallback(() => {
    dispatch({ type: "GO_TO_REVIEW" })
  }, [])

  const goBackToCompose = useCallback((_reason?: string) => {
    dispatch({ type: "GO_BACK_TO_COMPOSE", reason: _reason })
  }, [])

  const submit = useCallback(async () => {
    if (state.step !== "review") return
    clientOpCounter.current += 1
    const { selection, amountMinor, method, note } = state
    const input: SettlementMutationInput = {
      clientOperationId: randomUUID(),
      counterpartyId: selection.counterpartyId,
      context: selection.context,
      amountMinor,
      currency: selection.currency,
      method,
      note: note || undefined,
    }
    try {
      const settlement = await createSettlement(input)
      const resulting = selection.isOwedToYou
        ? selection.signedAmountMinor - amountMinor
        : selection.signedAmountMinor + amountMinor
      dispatch({ type: "SUBMIT_SUCCESS", settlement, resultingMinor: resulting })
    } catch (e: any) {
      const errMsg = e?.message || e?.code || "Settlement failed"
      console.warn("[settlement] submit error:", errMsg, JSON.stringify(input))
      const match = errMsg.match(/^BALANCE_CHANGED:(-?\d+)$/)
      if (match) {
        const currentMinor = parseInt(match[1], 10)
        dispatch({ type: "UPDATE_BALANCE", signedAmountMinor: currentMinor })
      } else {
        dispatch({ type: "GO_BACK_TO_COMPOSE", reason: errMsg })
      }
    }
  }, [state, createSettlement])

  const reset = useCallback(() => {
    dispatch({ type: "GO_BACK_TO_COMPOSE" })
  }, [])

  return {
    state,
    startCompose,
    setAmountInput,
    setMethod,
    setNote,
    goToReview,
    goBackToCompose,
    submit,
    reset,
  }
}
