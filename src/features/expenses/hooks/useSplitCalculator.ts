import { useMemo, useCallback } from "react"
import type { SplitMethod, User } from "@/types"
import {
  calculateEqualShare,
  calculateCustomSum,
  calculatePercentSum,
  generateSplits,
} from "@/features/expenses/utils/splits"
import { formatAmount } from "@/components/ui/AmountDisplay"

export function useSplitCalculator(
  amount: string,
  splitMethod: SplitMethod,
  includedMembers: User[],
  customAmounts: Record<string, string>,
  customPercentages: Record<string, string>,
  expenseCurrency: string
) {
  const parsedAmount = useMemo(() => parseFloat(amount.replace(",", ".")) || 0, [amount])

  const equalShare = useMemo(
    () => calculateEqualShare(includedMembers, parsedAmount),
    [includedMembers, parsedAmount]
  )

  const currentCustomSum = useMemo(
    () => calculateCustomSum(includedMembers, customAmounts),
    [includedMembers, customAmounts]
  )

  const remainingCustom = useMemo(
    () => Math.max(0, parsedAmount - currentCustomSum),
    [parsedAmount, currentCustomSum]
  )

  const currentPercentSum = useMemo(
    () => calculatePercentSum(includedMembers, customPercentages),
    [includedMembers, customPercentages]
  )

  const remainingPercent = useMemo(
    () => Math.max(0, 100 - currentPercentSum),
    [currentPercentSum]
  )

  const validateSplits = useCallback((): string | null => {
    if (splitMethod === "custom" && Math.abs(currentCustomSum - parsedAmount) > 0.01) {
      return `Custom amounts must equal exactly ${formatAmount(parsedAmount, expenseCurrency)}.`
    }
    if (splitMethod === "percentage" && Math.abs(currentPercentSum - 100) > 0.01) {
      return "Percentages must add up to exactly 100%."
    }
    return null
  }, [splitMethod, currentCustomSum, parsedAmount, currentPercentSum, expenseCurrency])

  const generateFinalSplits = useCallback(() => {
    return generateSplits(includedMembers, parsedAmount, splitMethod, customAmounts, customPercentages)
  }, [includedMembers, parsedAmount, splitMethod, customAmounts, customPercentages])

  return {
    parsedAmount,
    equalShare,
    currentCustomSum,
    remainingCustom,
    currentPercentSum,
    remainingPercent,
    validateSplits,
    generateFinalSplits,
  }
}
