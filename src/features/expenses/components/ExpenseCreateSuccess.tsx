import { useEffect, useRef, useState, useCallback } from "react"
import type { JSX } from "react"
import { Pressable, View, Text } from "react-native"
import { useCoralColors } from "@/components/coral/useCoral"
import { CoralButton } from "@/components/coral/CoralButton"
import { formatAmount } from "@/components/ui/AmountDisplay"
import { minorToMajor } from "@/features/money/splits"
import { expensesApi } from "@/features/expenses/services/api"

interface SplitInfo {
  userId: string
  amountMinor: number
}

interface ExpenseCreateSuccessProps {
  totalMinor: number
  currency: string
  paidByUserId: string
  paidByUserName: string
  currentUserId: string
  splits: SplitInfo[]
  expenseId: string
  groupId?: string
  groupName?: string
  onReturn: () => void
  onViewExpense: () => void
  onBackToGroup: () => void
  onUndoSuccess: () => void
}

export function ExpenseCreateSuccess({
  totalMinor,
  currency,
  paidByUserId,
  paidByUserName,
  currentUserId,
  splits,
  expenseId,
  onReturn,
  onViewExpense,
  onBackToGroup,
  onUndoSuccess,
}: ExpenseCreateSuccessProps): JSX.Element {
  const coral = useCoralColors()
  const [undoFailed, setUndoFailed] = useState(false)
  const [isUndoing, setIsUndoing] = useState(false)
  const [countdown, setCountdown] = useState(8)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const isPayer = paidByUserId === currentUserId
  const userSplit = splits.find((s) => s.userId === currentUserId)
  const yourShareMinor = userSplit?.amountMinor ?? 0

  const youLentMinor = isPayer ? totalMinor - yourShareMinor : 0
  const youBorrowedMinor = !isPayer ? yourShareMinor : 0

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const handleUndo = useCallback(async () => {
    setIsUndoing(true)
    setUndoFailed(false)
    try {
      await expensesApi.deleteExpense(expenseId)
      if (timerRef.current) clearInterval(timerRef.current)
      onUndoSuccess()
    } catch {
      setUndoFailed(true)
      setIsUndoing(false)
    }
  }, [expenseId, onUndoSuccess])

  const handleReturn = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    onReturn()
  }, [onReturn])

  const totalFormatted = formatAmount(minorToMajor(totalMinor, currency), currency)
  const yourShareFormatted = formatAmount(minorToMajor(yourShareMinor, currency), currency)
  const lentFormatted = formatAmount(minorToMajor(youLentMinor, currency), currency)
  const borrowedFormatted = formatAmount(minorToMajor(youBorrowedMinor, currency), currency)

  return (
    <View style={{ flex: 1, paddingTop: 24 }}>
      <View
        style={{
          alignItems: "center",
          paddingVertical: 40,
          gap: 8,
        }}
      >
        <View
          style={{
            width: 58,
            height: 58,
            borderRadius: 29,
            backgroundColor: coral.positiveSoft,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 26, color: coral.positive }}>✓</Text>
        </View>
        <Text
          style={{
            fontFamily: "InstrumentSans_600SemiBold",
            fontSize: 28,
            color: coral.foreground,
            marginTop: 8,
          }}
        >
          Expense added
        </Text>
      </View>

      <View
        style={{
          borderRadius: 16,
          borderWidth: 1,
          borderStyle: "dashed",
          borderColor: coral.border,
          backgroundColor: coral.surface,
          padding: 20,
          gap: 0,
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: coral.border }}>
          <Text
            style={{
              fontFamily: "InstrumentSans_500Medium",
              fontSize: 14,
              color: coral.muted,
            }}
          >
            Total
          </Text>
          <Text
            style={{
              fontFamily: "IBMPlexMono_600SemiBold",
              fontSize: 20,
              color: coral.foreground,
            }}
          >
            {totalFormatted}
          </Text>
        </View>

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: coral.border }}>
          <Text
            style={{
              fontFamily: "InstrumentSans_500Medium",
              fontSize: 14,
              color: coral.muted,
            }}
          >
            Paid by
          </Text>
          <Text
            style={{
              fontFamily: "InstrumentSans_600SemiBold",
              fontSize: 15,
              color: coral.foreground,
            }}
          >
            {paidByUserId === currentUserId ? "You" : paidByUserName}
          </Text>
        </View>

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: coral.border }}>
          <Text
            style={{
              fontFamily: "InstrumentSans_500Medium",
              fontSize: 14,
              color: coral.muted,
            }}
          >
            Your share
          </Text>
          <Text
            style={{
              fontFamily: "IBMPlexMono_600SemiBold",
              fontSize: 16,
              color: coral.foreground,
            }}
          >
            {yourShareFormatted}
          </Text>
        </View>

        {youLentMinor > 0 && (
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", paddingVertical: 12 }}>
            <Text
              style={{
                fontFamily: "InstrumentSans_500Medium",
                fontSize: 14,
                color: coral.muted,
              }}
            >
              You lent
            </Text>
            <Text
              style={{
                fontFamily: "IBMPlexMono_600SemiBold",
                fontSize: 16,
                color: coral.positive,
              }}
            >
              {lentFormatted}
            </Text>
          </View>
        )}

        {youBorrowedMinor > 0 && (
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", paddingVertical: 12 }}>
            <Text
              style={{
                fontFamily: "InstrumentSans_500Medium",
                fontSize: 14,
                color: coral.muted,
              }}
            >
              You borrowed
            </Text>
            <Text
              style={{
                fontFamily: "IBMPlexMono_600SemiBold",
                fontSize: 16,
                color: coral.negative,
              }}
            >
              {borrowedFormatted}
            </Text>
          </View>
        )}
      </View>

      <View style={{ flex: 1 }} />

      <View style={{ gap: 12, paddingBottom: 16 }}>
        {undoFailed && (
          <View
            style={{
              padding: 12,
              borderRadius: 12,
              backgroundColor: coral.negativeSoft,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontFamily: "InstrumentSans_500Medium",
                fontSize: 13,
                color: coral.negative,
              }}
            >
              Undo failed. You can try again.
            </Text>
          </View>
        )}

        <CoralButton
          label="View expense"
          onPress={onViewExpense}
          variant="secondary"
        />

        <CoralButton
          label="Back to group"
          onPress={onBackToGroup}
          variant="primary"
        />

        {countdown > 0 && (
          <View style={{ flexDirection: "row", justifyContent: "center" }}>
            <Pressable
              accessibilityRole="button"
              onPress={handleUndo}
              disabled={isUndoing}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                paddingHorizontal: 20,
                paddingVertical: 12,
                borderRadius: 14,
                backgroundColor: coral.negativeSoft,
                opacity: isUndoing ? 0.45 : pressed ? 0.78 : 1,
              })}
            >
              <Text
                style={{
                  fontFamily: "InstrumentSans_600SemiBold",
                  fontSize: 14,
                  color: coral.negative,
                }}
              >
                {isUndoing ? "Undoing..." : "Undo"}
              </Text>
              <View
                style={{
                  backgroundColor: coral.negative,
                  borderRadius: 10,
                  minWidth: 22,
                  height: 22,
                  alignItems: "center",
                  justifyContent: "center",
                  paddingHorizontal: 6,
                }}
              >
                <Text
                  style={{
                    fontFamily: "InstrumentSans_600SemiBold",
                    fontSize: 12,
                    color: coral.inkOnAccent,
                  }}
                >
                  {countdown}
                </Text>
              </View>
            </Pressable>
          </View>
        )}

        {countdown > 0 && (
          <Text
            style={{
              fontFamily: "InstrumentSans_400Regular",
              fontSize: 12,
              color: coral.muted,
              textAlign: "center",
            }}
          >
            Undo removes this newly created expense while permissions allow.
          </Text>
        )}
      </View>
    </View>
  )
}
