import { useState, useMemo, useEffect, useCallback } from "react"
import type { User, Expense } from "@/types"

function getExistingIncludedMap(expense: Expense | undefined): Record<string, boolean> {
  if (!expense) return {}
  return Object.fromEntries(expense.splits.map((split) => [split.userId, true]))
}

export function useParticipantManager(
  participants: User[],
  existingExpense?: Expense
) {
  const [included, setIncluded] = useState<Record<string, boolean>>(() =>
    getExistingIncludedMap(existingExpense)
  )

  useEffect(() => {
    if (participants.length === 0) return

    const timer = setTimeout(() => {
      setIncluded((prev) => {
        const existingIncludedMap = getExistingIncludedMap(existingExpense)
        const nextIncluded = Object.fromEntries(
          participants.map((u) => [
            u.id,
            existingExpense ? !!existingIncludedMap[u.id] : (prev[u.id] ?? true),
          ])
        )
        const hasChanged = participants.some((u) => prev[u.id] !== nextIncluded[u.id])
        const sizeChanged = Object.keys(prev).length !== Object.keys(nextIncluded).length
        return hasChanged || sizeChanged ? nextIncluded : prev
      })
    }, 0)

    return () => clearTimeout(timer)
  }, [participants, existingExpense])

  const includedMembers = useMemo(
    () => participants.filter((u) => included[u.id]),
    [participants, included]
  )

  const toggleParticipant = useCallback((userId: string) => {
    setIncluded((prev) => ({ ...prev, [userId]: !prev[userId] }))
  }, [])

  return { included, setIncluded, includedMembers, toggleParticipant }
}
