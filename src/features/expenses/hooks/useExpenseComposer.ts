import { useReducer, useCallback, useEffect, useRef } from "react"
import type { MoneyContext, MoneySplitMethod, SplitSourceValue } from "@/features/money/types"
import { calculateSplits, parseMinorInput, validateSplitSources } from "@/features/money/splits"
import type { ExpenseCategory } from "@/types"

export interface ComposerParticipant {
  userId: string
  name: string
  avatar?: string
}

export interface ReceiptDraft {
  key: string
  mimeType: string
  sizeBytes: number
}

export interface ComposerError {
  message: string
  code?: string
}

export interface ExpenseComposerState {
  context?: MoneyContext
  amountInput: string
  currency: string
  description: string
  paidBy: string
  participants: ComposerParticipant[]
  splitMethod: MoneySplitMethod
  splitSources: Record<string, SplitSourceValue>
  date: Date
  category: ExpenseCategory
  notes: string
  receipt?: ReceiptDraft
  status: "editing" | "submitting" | "success"
  error?: ComposerError
}

export type ExpenseComposerAction =
  | { type: "SET_CONTEXT"; context: MoneyContext; participants: ComposerParticipant[]; currency: string }
  | { type: "SET_AMOUNT"; amountInput: string }
  | { type: "SET_DESCRIPTION"; description: string }
  | { type: "SET_PAID_BY"; paidBy: string }
  | { type: "SET_SPLIT_METHOD"; splitMethod: MoneySplitMethod }
  | { type: "SET_SOURCE"; userId: string; source: SplitSourceValue }
  | { type: "SET_DATE"; date: Date }
  | { type: "SET_CATEGORY"; category: ExpenseCategory }
  | { type: "SET_NOTES"; notes: string }
  | { type: "SET_RECEIPT"; receipt?: ReceiptDraft }
  | { type: "RESET_SPLIT" }
  | { type: "CONFIRM_CURRENCY"; currency: string }
  | { type: "SUBMIT_START" }
  | { type: "SUBMIT_SUCCESS" }
  | { type: "SUBMIT_ERROR"; error: ComposerError }
  | {
      type: "INIT_EDIT"
      state: Partial<ExpenseComposerState> & { context: MoneyContext; participants: ComposerParticipant[] }
    }

function defaultSplitSources(
  participants: ComposerParticipant[],
  method: MoneySplitMethod,
  amountInput: string,
  currency: string
): Record<string, SplitSourceValue> {
  const sources: Record<string, SplitSourceValue> = {}

  for (const p of participants) {
    if (method === "percentage") {
      sources[p.userId] = { percentageUnits: 0 }
    } else if (method === "shares") {
      sources[p.userId] = { shareUnits: 1000000 }
    } else if (method === "custom") {
      sources[p.userId] = { amountMinor: 0 }
    } else {
      sources[p.userId] = {}
    }
  }

  if (method === "equal" && participants.length > 0 && amountInput) {
    try {
      const totalMinor = parseMinorInput(amountInput, currency)
      const splits = calculateSplits(
        totalMinor,
        "equal",
        participants.map((p, i) => ({ userId: p.userId, position: i }))
      )
      for (const s of splits) {
        sources[s.userId] = { amountMinor: s.amountMinor }
      }
    } catch {
      // invalid input
    }
  }

  return sources
}

function createInitialState(): ExpenseComposerState {
  return {
    amountInput: "",
    currency: "USD",
    description: "",
    paidBy: "",
    participants: [],
    splitMethod: "equal",
    splitSources: {},
    date: new Date(),
    category: "other",
    notes: "",
    status: "editing",
  }
}

export function expenseComposerReducer(
  state: ExpenseComposerState,
  action: ExpenseComposerAction
): ExpenseComposerState {
  switch (action.type) {
    case "SET_CONTEXT": {
      const sources = defaultSplitSources(
        action.participants,
        state.splitMethod,
        state.amountInput,
        action.currency
      )
      return {
        ...state,
        context: action.context,
        participants: action.participants,
        currency: action.currency,
        paidBy:
          state.paidBy ||
          (action.participants.length > 0 ? action.participants[0].userId : ""),
        splitSources: sources,
        status: "editing",
        error: undefined,
      }
    }

    case "SET_AMOUNT":
      return { ...state, amountInput: action.amountInput, error: undefined }

    case "SET_DESCRIPTION":
      return { ...state, description: action.description }

    case "SET_PAID_BY":
      return { ...state, paidBy: action.paidBy }

    case "SET_SPLIT_METHOD": {
      const sources = defaultSplitSources(
        state.participants,
        action.splitMethod,
        state.amountInput,
        state.currency
      )
      return {
        ...state,
        splitMethod: action.splitMethod,
        splitSources: sources,
        error: undefined,
      }
    }

    case "SET_SOURCE":
      return {
        ...state,
        splitSources: {
          ...state.splitSources,
          [action.userId]: action.source,
        },
        error: undefined,
      }

    case "SET_DATE":
      return { ...state, date: action.date }

    case "SET_CATEGORY":
      return { ...state, category: action.category }

    case "SET_NOTES":
      return { ...state, notes: action.notes }

    case "SET_RECEIPT":
      return { ...state, receipt: action.receipt }

    case "RESET_SPLIT": {
      const sources = defaultSplitSources(
        state.participants,
        state.splitMethod,
        state.amountInput,
        state.currency
      )
      return { ...state, splitSources: sources, error: undefined }
    }

    case "CONFIRM_CURRENCY": {
      const sources = defaultSplitSources(
        state.participants,
        state.splitMethod,
        state.amountInput,
        action.currency
      )
      return {
        ...state,
        currency: action.currency,
        splitSources: sources,
        error: undefined,
      }
    }

    case "SUBMIT_START":
      return { ...state, status: "submitting", error: undefined }

    case "SUBMIT_SUCCESS":
      return { ...state, status: "success" }

    case "SUBMIT_ERROR":
      return { ...state, status: "editing", error: action.error }

    case "INIT_EDIT": {
      return {
        ...createInitialState(),
        ...action.state,
        splitSources:
          action.state.splitSources ??
          defaultSplitSources(
            action.state.participants,
            action.state.splitMethod ?? state.splitMethod,
            action.state.amountInput ?? state.amountInput,
            action.state.currency ?? state.currency
          ),
        status: "editing",
      }
    }

    default:
      return state
  }
}

export function useExpenseComposer(options?: {
  initialContext?: MoneyContext
  initialParticipants?: ComposerParticipant[]
  initialCurrency?: string
  initialDescription?: string
  initialAmount?: string
  initialPaidBy?: string
  initialSplitMethod?: MoneySplitMethod
  initialDate?: Date
  initialCategory?: ExpenseCategory
  initialNotes?: string
}) {
  const [state, dispatch] = useReducer(expenseComposerReducer, null, createInitialState)
  const initRef = useRef(false)

  useEffect(() => {
    if (initRef.current) return
    if (!options?.initialContext || !options?.initialParticipants?.length) return

    initRef.current = true
    dispatch({
      type: "SET_CONTEXT",
      context: options.initialContext,
      participants: options.initialParticipants,
      currency: options.initialCurrency || "USD",
    })

    if (options.initialDescription) {
      dispatch({ type: "SET_DESCRIPTION", description: options.initialDescription })
    }
    if (options.initialAmount) {
      dispatch({ type: "SET_AMOUNT", amountInput: options.initialAmount })
    }
    if (options.initialPaidBy) {
      dispatch({ type: "SET_PAID_BY", paidBy: options.initialPaidBy })
    }
    if (options.initialSplitMethod) {
      dispatch({ type: "SET_SPLIT_METHOD", splitMethod: options.initialSplitMethod })
    }
    if (options.initialDate) {
      dispatch({ type: "SET_DATE", date: options.initialDate })
    }
    if (options.initialCategory) {
      dispatch({ type: "SET_CATEGORY", category: options.initialCategory })
    }
    if (options.initialNotes !== undefined) {
      dispatch({ type: "SET_NOTES", notes: options.initialNotes })
    }
  }, [options])

  const setContext = useCallback(
    (context: MoneyContext, participants: ComposerParticipant[], currency: string) => {
      dispatch({ type: "SET_CONTEXT", context, participants, currency })
    },
    []
  )

  const setAmount = useCallback((amountInput: string) => {
    dispatch({ type: "SET_AMOUNT", amountInput })
  }, [])

  const setDescription = useCallback((description: string) => {
    dispatch({ type: "SET_DESCRIPTION", description })
  }, [])

  const setPaidBy = useCallback((paidBy: string) => {
    dispatch({ type: "SET_PAID_BY", paidBy })
  }, [])

  const setSplitMethod = useCallback((splitMethod: MoneySplitMethod) => {
    dispatch({ type: "SET_SPLIT_METHOD", splitMethod })
  }, [])

  const setSource = useCallback((userId: string, source: SplitSourceValue) => {
    dispatch({ type: "SET_SOURCE", userId, source })
  }, [])

  const setDate = useCallback((date: Date) => {
    dispatch({ type: "SET_DATE", date })
  }, [])

  const setCategory = useCallback((category: ExpenseCategory) => {
    dispatch({ type: "SET_CATEGORY", category })
  }, [])

  const setNotes = useCallback((notes: string) => {
    dispatch({ type: "SET_NOTES", notes })
  }, [])

  const setReceipt = useCallback((receipt?: ReceiptDraft) => {
    dispatch({ type: "SET_RECEIPT", receipt })
  }, [])

  const resetSplit = useCallback(() => {
    dispatch({ type: "RESET_SPLIT" })
  }, [])

  const confirmCurrency = useCallback((currency: string) => {
    dispatch({ type: "CONFIRM_CURRENCY", currency })
  }, [])

  const submitStart = useCallback(() => {
    dispatch({ type: "SUBMIT_START" })
  }, [])

  const submitSuccess = useCallback(() => {
    dispatch({ type: "SUBMIT_SUCCESS" })
  }, [])

  const submitError = useCallback((error: ComposerError) => {
    dispatch({ type: "SUBMIT_ERROR", error })
  }, [])

  const initEdit = useCallback(
    (
      editState: Partial<ExpenseComposerState> & {
        context: MoneyContext
        participants: ComposerParticipant[]
      }
    ) => {
      dispatch({ type: "INIT_EDIT", state: editState })
    },
    []
  )

  const calculateResult = useCallback(() => {
    if (!state.amountInput || state.participants.length === 0) return null

    try {
      const totalMinor = parseMinorInput(state.amountInput, state.currency)

      const sources = state.participants.map((p, i) => {
        const source: SplitSourceValue = state.splitSources[p.userId] || {}
        return {
          userId: p.userId,
          position: i,
          amountMinor: source.amountMinor,
          percentageUnits: source.percentageUnits,
          shareUnits: source.shareUnits,
        }
      })

      validateSplitSources(totalMinor, state.splitMethod, sources)
      const splits = calculateSplits(totalMinor, state.splitMethod, sources)

      return { totalMinor, splits }
    } catch {
      return null
    }
  }, [state.amountInput, state.currency, state.participants, state.splitMethod, state.splitSources])

  return {
    state,
    dispatch,
    setContext,
    setAmount,
    setDescription,
    setPaidBy,
    setSplitMethod,
    setSource,
    setDate,
    setCategory,
    setNotes,
    setReceipt,
    resetSplit,
    confirmCurrency,
    submitStart,
    submitSuccess,
    submitError,
    initEdit,
    calculateResult,
  }
}
