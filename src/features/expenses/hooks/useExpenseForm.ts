import { useState, useMemo, useEffect, useCallback } from "react"
import * as Haptics from "expo-haptics"
import type { ExpenseCategory, SplitMethod, Expense, Group, User, Currency } from "@/types"
import { uploadReceipt } from "@/services/storage"
import { useSplitCalculator } from "./useSplitCalculator"
import { useParticipantManager } from "./useParticipantManager"
import { useCategorySuggestion } from "./useCategorySuggestion"
import { useReceiptUpload } from "./useReceiptUpload"

interface UseExpenseFormProps {
  currentUser: User
  groups: Group[]
  friends: User[]
  expenses: Expense[]
  initialGroupId?: string
  initialFriendId?: string
  expenseId?: string
  expenseDetail?: Expense
  preferredCurrency: Currency
  setCurrency: (c: Currency) => void
  addExpense: (data: any) => Promise<any>
  updateExpense: (data: any) => Promise<any>
  router: any
  toast: any
}

export function useExpenseForm({
  currentUser,
  groups,
  friends,
  expenses,
  initialGroupId,
  initialFriendId,
  expenseId,
  expenseDetail,
  preferredCurrency,
  setCurrency,
  addExpense,
  updateExpense,
  router,
  toast,
}: UseExpenseFormProps) {
  const getGroup = (id: string) => groups.find((g: any) => g.id === id)

  const getIndividualExpenseFriendIds = useCallback(
    (expense: Expense | undefined): string[] => {
      if (!expense || expense.groupId) return []

      const friendIds = new Set<string>()

      expense.splits.forEach((split) => {
        if (split.userId !== currentUser.id) {
          friendIds.add(split.userId)
        }
      })

      if (expense.paidBy && expense.paidBy !== currentUser.id) {
        friendIds.add(expense.paidBy)
      }

      return Array.from(friendIds)
    },
    [currentUser.id]
  )

  const existingExpense = useMemo(
    () =>
      expenseDetail ||
      (expenseId ? expenses.find((expense) => expense.id === expenseId) : undefined),
    [expenseDetail, expenseId, expenses]
  )

  const initialGroup = existingExpense?.groupId || initialGroupId || ""
  const initialFriends = (() => {
    if (existingExpense && !existingExpense.groupId) {
      return getIndividualExpenseFriendIds(existingExpense)
    }
    return initialFriendId ? [initialFriendId] : []
  })()

  const [selectedGroupId, setSelectedGroupId] = useState(initialGroup)
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>(initialFriends)
  const [selectionConfirmed, setSelectionConfirmed] = useState(
    !!initialGroup || initialFriends.length > 0 || !!existingExpense
  )
  const [selectionTab, setSelectionTab] = useState<"friends" | "groups">("friends")
  const [searchQuery, setSearchQuery] = useState("")

  const uniqueFriends = useMemo(() => {
    return friends.filter((user) => user.id !== currentUser.id)
  }, [friends, currentUser.id])

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groups
    const lowerQuery = searchQuery.toLowerCase()
    return groups.filter((g) => g.name.toLowerCase().includes(lowerQuery))
  }, [groups, searchQuery])

  const filteredFriends = useMemo(() => {
    if (!searchQuery.trim()) return uniqueFriends
    const lowerQuery = searchQuery.toLowerCase()
    return uniqueFriends.filter((f) => f.name.toLowerCase().includes(lowerQuery))
  }, [uniqueFriends, searchQuery])

  const selectedGroup = selectedGroupId ? getGroup(selectedGroupId) : undefined

  const expenseSplitFriends = useMemo(() => {
    if (!existingExpense || existingExpense.groupId) return []

    const relatedUsers = existingExpense.splits
      .map((split) => split.user)
      .filter((user): user is User => !!user && user.id !== currentUser.id)

    if (existingExpense.paidByUser && existingExpense.paidByUser.id !== currentUser.id) {
      relatedUsers.push(existingExpense.paidByUser)
    }

    const seen = new Set<string>()
    return relatedUsers.filter((user) => {
      if (seen.has(user.id)) return false
      seen.add(user.id)
      return true
    })
  }, [existingExpense, currentUser.id])

  const selectedFriends = useMemo(() => {
    const friendMap = new Map<string, User>()

    uniqueFriends.forEach((friend) => {
      friendMap.set(friend.id, friend)
    })
    expenseSplitFriends.forEach((friend) => {
      if (!friendMap.has(friend.id)) {
        friendMap.set(friend.id, friend)
      }
    })

    return selectedFriendIds
      .map((friendId) => friendMap.get(friendId))
      .filter((friend): friend is User => !!friend)
  }, [uniqueFriends, expenseSplitFriends, selectedFriendIds])

  const participants = useMemo(() => {
    if (selectedGroup) {
      return selectedGroup.members.map((m) => m.user)
    }
    if (selectedFriends.length > 0) {
      return [currentUser, ...selectedFriends]
    }
    return []
  }, [selectedGroup, selectedFriends, currentUser])

  const { included, setIncluded, includedMembers } = useParticipantManager(participants, existingExpense)

  const [expenseCurrency, setExpenseCurrency] = useState(preferredCurrency.code)

  useEffect(() => {
    if (selectedGroup) {
      setTimeout(() => setExpenseCurrency(selectedGroup.currency), 0)
    } else if (existingExpense && !existingExpense.groupId) {
      setTimeout(() => setExpenseCurrency(existingExpense.currency), 0)
    } else {
      setTimeout(() => setExpenseCurrency(preferredCurrency.code), 0)
    }
  }, [selectedGroup, existingExpense, preferredCurrency.code])

  const [title, setTitle] = useState(existingExpense?.title || "")
  const [amount, setAmount] = useState(existingExpense?.amount.toString() || "")
  const [category, setCategory] = useState<ExpenseCategory>(existingExpense?.category || "food")
  const [splitMethod, setSplitMethod] = useState<SplitMethod>(
    existingExpense?.splitMethod || "equal"
  )
  const [paidBy, setPaidBy] = useState(existingExpense?.paidBy || currentUser.id)
  const [loading, setLoading] = useState(false)
  const [expenseDate, setExpenseDate] = useState<Date>(existingExpense?.date || new Date())
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (selectedGroup?.defaultSplitMethod && !existingExpense) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSplitMethod(selectedGroup.defaultSplitMethod)
    }
  }, [selectedGroup?.defaultSplitMethod, existingExpense])

  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>(() => {
    if (existingExpense?.splitMethod !== "custom") return {}
    const map: Record<string, string> = {}
    existingExpense.splits.forEach((s: any) => {
      map[s.userId] = s.amount.toString()
    })
    return map
  })

  const [customPercentages, setCustomPercentages] = useState<Record<string, string>>(() => {
    if (existingExpense?.splitMethod !== "percentage") return {}
    const map: Record<string, string> = {}
    existingExpense.splits.forEach((s: any) => {
      map[s.userId] = ((s.amount / existingExpense.amount) * 100).toString()
    })
    return map
  })

  const {
    parsedAmount,
    equalShare,
    currentCustomSum,
    remainingCustom,
    currentPercentSum,
    remainingPercent,
    validateSplits,
    generateFinalSplits,
  } = useSplitCalculator(
    amount,
    splitMethod,
    includedMembers,
    customAmounts,
    customPercentages,
    expenseCurrency
  )

  useCategorySuggestion(parsedAmount, title)

  const { receiptUrl, setReceiptUrl } = useReceiptUpload(existingExpense?.receiptUrl)

  useEffect(() => {
    if (!existingExpense) return

    const timer = setTimeout(() => {
      const nextFriendIds = getIndividualExpenseFriendIds(existingExpense)

      setSelectedGroupId(existingExpense.groupId || "")
      setSelectedFriendIds(nextFriendIds)
      setSelectionConfirmed(true)
      setTitle(existingExpense.title || "")
      setAmount(existingExpense.amount.toString() || "")
      setCategory(existingExpense.category || "food")
      setSplitMethod(existingExpense.splitMethod || "equal")
      setPaidBy(existingExpense.paidBy || currentUser.id)
      setExpenseDate(existingExpense.date || new Date())
      setExpenseCurrency(existingExpense.currency || preferredCurrency.code)

      if (existingExpense.splitMethod === "custom") {
        const customMap: Record<string, string> = {}
        existingExpense.splits.forEach((s: any) => {
          customMap[s.userId] = s.amount.toString()
        })
        setCustomAmounts(customMap)
        setCustomPercentages({})
      } else if (existingExpense.splitMethod === "percentage") {
        const percentageMap: Record<string, string> = {}
        existingExpense.splits.forEach((s: any) => {
          percentageMap[s.userId] = ((s.amount / existingExpense.amount) * 100).toString()
        })
        setCustomPercentages(percentageMap)
        setCustomAmounts({})
      } else {
        setCustomAmounts({})
        setCustomPercentages({})
      }
    }, 0)

    return () => clearTimeout(timer)
  }, [existingExpense, currentUser.id, getIndividualExpenseFriendIds, preferredCurrency.code])

  async function handleSubmit(receiptUri?: string): Promise<void> {
    const newErrors: Record<string, string> = {}

    if (!selectedGroup && selectedFriends.length === 0) {
      newErrors.context = "Please select a group or friend"
    }
    if (!title.trim()) {
      newErrors.title = "Please enter a title"
    }
    if (!parsedAmount || parsedAmount <= 0) {
      newErrors.amount = "Please enter a valid amount"
    }
    if (includedMembers.length === 0) {
      newErrors.members = "Include at least one member"
    }

    const splitError = validateSplits()
    if (splitError) {
      newErrors.split = splitError
    }

    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    setLoading(true)
    try {
      const splits = generateFinalSplits()

      if (existingExpense) {
        await updateExpense({
          id: existingExpense.id,
          updates: {
            title: title.trim(),
            amount: parsedAmount,
            currency: expenseCurrency,
            category,
            paidBy,
            splits: splits.map((s) => ({ ...s, paid: s.userId === paidBy })),
            splitMethod,
            date: expenseDate,
            receiptUrl: receiptUrl || undefined,
          },
        })
      } else {
        const newExpense = await addExpense({
          groupId: selectedGroup?.id,
          title: title.trim(),
          amount: parsedAmount,
          currency: expenseCurrency,
          category,
          paidBy,
          splits: splits.map((s) => ({ ...s, paid: s.userId === paidBy })),
          splitMethod,
          date: expenseDate,
          receiptUrl: receiptUrl || undefined,
        })
        if (receiptUri && newExpense?.id) {
          try {
            const url = await uploadReceipt(newExpense.id, receiptUri)
            await updateExpense({ id: newExpense.id, updates: { receiptUrl: url } })
          } catch {
            // Non-critical: receipt upload failed, expense still created
          }
        }
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      if (router.canGoBack()) {
        router.back()
      } else {
        router.replace("/(tabs)")
      }
    } catch (e: any) {
      toast.show({
        label: "Error",
        description: e.message || "Something went wrong. Please try again.",
        variant: "danger",
        placement: "top",
      })
      setLoading(false)
    }
  }

  return {
    state: {
      existingExpense,
      selectedGroupId,
      selectedFriendIds,
      selectionConfirmed,
      selectionTab,
      searchQuery,
      uniqueFriends,
      filteredGroups,
      filteredFriends,
      selectedGroup,
      selectedFriends,
      participants,
      expenseCurrency,
      title,
      amount,
      category,
      splitMethod,
      paidBy,
      loading,
      expenseDate,
      showDatePicker,
      included,
      customAmounts,
      customPercentages,
      includedMembers,
      parsedAmount,
      equalShare,
      currentCustomSum,
      remainingCustom,
      currentPercentSum,
      remainingPercent,
      errors,
      receiptUrl,
    },
    actions: {
      setSelectedGroupId,
      setSelectedFriendIds,
      setSelectionConfirmed,
      setSelectionTab,
      setSearchQuery,
      setExpenseCurrency,
      setTitle,
      setAmount,
      setCategory,
      setSplitMethod,
      setPaidBy,
      setLoading,
      setExpenseDate,
      setShowDatePicker,
      setIncluded,
      setCustomAmounts,
      setCustomPercentages,
      setReceiptUrl,
      handleSubmit,
      setCurrency,
      setErrors,
    },
  }
}
