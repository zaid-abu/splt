import { useMemo, useCallback, useState } from "react"
import type { JSX } from "react"
import { View, Text, TextInput, Pressable } from "react-native"
import * as Haptics from "expo-haptics"
import { useCoralColors } from "@/components/coral/useCoral"
import { CoralSegment } from "@/components/coral/CoralSegment"
import { CoralButton } from "@/components/coral/CoralButton"
import { AppUserAvatar } from "@/components/ui/MemberAvatar"
import { calculateSplits, parseMinorInput, validateSplitSources, minorToMajor } from "@/features/money/splits"
import type { MoneySplitMethod } from "@/features/money/types"
import { getCurrencySymbol } from "@/components/ui/AmountDisplay"
import type { ExpenseComposerState, ComposerParticipant } from "../hooks/useExpenseComposer"

const SPLIT_METHODS = [
  { label: "Equal", value: "equal" },
  { label: "Amounts", value: "custom" },
  { label: "Percent", value: "percentage" },
  { label: "Shares", value: "shares" },
]

interface ExpenseSplitEditorProps {
  state: ExpenseComposerState
  currentUserId: string
  onSplitMethodChange: (method: MoneySplitMethod) => void
  onSourceChange: (userId: string, value: string) => void
  onApply: () => void
}

export function ExpenseSplitEditor({
  state,
  currentUserId,
  onSplitMethodChange,
  onSourceChange,
  onApply,
}: ExpenseSplitEditorProps): JSX.Element {
  const coral = useCoralColors()

  const activeParticipants = state.participants

  const splitResult = useMemo(() => {
    if (!state.amountInput || activeParticipants.length === 0) return null
    try {
      const totalMinor = parseMinorInput(state.amountInput, state.currency)
      const sources = activeParticipants.map((p, i) => {
        const s = state.splitSources[p.userId] || {}
        return {
          userId: p.userId,
          position: i,
          amountMinor: s.amountMinor,
          percentageUnits: s.percentageUnits,
          shareUnits: s.shareUnits,
        }
      })
      validateSplitSources(totalMinor, state.splitMethod, sources)
      const splits = calculateSplits(totalMinor, state.splitMethod, sources)
      return { totalMinor, splits }
    } catch {
      return null
    }
  }, [state.amountInput, state.currency, state.splitMethod, state.splitSources, activeParticipants])

  const validationError = useMemo(() => {
    if (!state.amountInput) return null
    if (activeParticipants.length === 0) return "Add at least one participant"

    try {
      const totalMinor = parseMinorInput(state.amountInput, state.currency)
      const sources = activeParticipants.map((p, i) => {
        const s = state.splitSources[p.userId] || {}
        return {
          userId: p.userId,
          position: i,
          amountMinor: s.amountMinor,
          percentageUnits: s.percentageUnits,
          shareUnits: s.shareUnits,
        }
      })
      validateSplitSources(totalMinor, state.splitMethod, sources)
      return null
    } catch (err) {
      return err instanceof Error ? err.message : "Invalid split"
    }
  }, [state.amountInput, state.currency, state.splitMethod, state.splitSources, activeParticipants])

  const assignedTotalDisplay = useMemo(() => {
    if (!splitResult) return null
    const symbol = getCurrencySymbol(state.currency)
    const major = minorToMajor(splitResult.totalMinor, state.currency)
    return `${symbol}${major.toFixed(2)}`
  }, [splitResult, state.currency])

  const handleValueChange = useCallback(
    (userId: string, text: string) => {
      onSourceChange(userId, text)
    },
    [onSourceChange]
  )

  const handleSplitMethodChange = useCallback(
    (value: string) => {
      Haptics.selectionAsync()
      onSplitMethodChange(value as MoneySplitMethod)
    },
    [onSplitMethodChange]
  )

  const handleApply = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onApply()
  }, [onApply])

  const getSourceValue = (participant: ComposerParticipant): string => {
    const source = state.splitSources[participant.userId]
    if (!source) return ""

    if (state.splitMethod === "custom") {
      const major = minorToMajor(source.amountMinor ?? 0, state.currency)
      return major > 0 ? major.toFixed(2) : ""
    }
    if (state.splitMethod === "percentage") {
      const pct = (source.percentageUnits ?? 0) / 10000
      return pct > 0 ? pct.toString() : ""
    }
    if (state.splitMethod === "shares") {
      const shares = (source.shareUnits ?? 0) / 1000000
      return shares > 0 ? shares.toString() : ""
    }
    return ""
  }

  const getAssignedValue = (participant: ComposerParticipant): string => {
    if (!splitResult) return "0"
    const split = splitResult.splits.find((s) => s.userId === participant.userId)
    if (!split) return "0"
    const symbol = getCurrencySymbol(state.currency)
    const major = minorToMajor(split.amountMinor, state.currency)
    return `${symbol}${major.toFixed(2)}`
  }

  const symbol = getCurrencySymbol(state.currency)

  const placeholderForMethod = state.splitMethod === "percentage" ? "0" : "0"

  const suffixForMethod = state.splitMethod === "percentage" ? "%" : ""

  return (
    <View style={{ gap: 16 }}>
      <CoralSegment
        options={SPLIT_METHODS}
        selected={state.splitMethod}
        onSelect={handleSplitMethodChange}
      />

      {state.splitMethod === "custom" && (
        <View style={{ gap: 6 }}>
          {activeParticipants.map((participant) => {
            const isMe = participant.userId === currentUserId
            return (
              <View
                key={participant.userId}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  minHeight: 52,
                }}
              >
                <AppUserAvatar
                  user={{ id: participant.userId, name: participant.name, initials: participant.name.charAt(0).toUpperCase() }}
                  size="md"
                />
                <Text
                  style={{
                    flex: 1,
                    fontFamily: "InstrumentSans_600SemiBold",
                    fontSize: 15,
                    color: coral.foreground,
                  }}
                  numberOfLines={1}
                >
                  {isMe ? "You" : participant.name}
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Text
                    style={{
                      fontFamily: "IBMPlexMono_600SemiBold",
                      fontSize: 14,
                      color: coral.muted,
                    }}
                  >
                    {symbol}
                  </Text>
                  <TextInput
                    value={getSourceValue(participant)}
                    onChangeText={(v) => handleValueChange(participant.userId, v.replace(/[^0-9.]/g, ""))}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor={coral.muted}
                    style={{
                      width: 88,
                      height: 40,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: coral.border,
                      backgroundColor: coral.surface,
                      fontFamily: "IBMPlexMono_600SemiBold",
                      fontSize: 14,
                      color: coral.foreground,
                      textAlign: "right",
                      paddingHorizontal: 10,
                    }}
                  />
                </View>
                <Text
                  style={{
                    fontFamily: "IBMPlexMono_500Medium",
                    fontSize: 12,
                    color: coral.muted,
                    minWidth: 60,
                    textAlign: "right",
                  }}
                  numberOfLines={1}
                >
                  {getAssignedValue(participant)}
                </Text>
              </View>
            )
          })}
        </View>
      )}

      {(state.splitMethod === "percentage" || state.splitMethod === "shares") && (
        <View style={{ gap: 6 }}>
          {activeParticipants.map((participant) => {
            const isMe = participant.userId === currentUserId
            return (
              <View
                key={participant.userId}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  minHeight: 52,
                }}
              >
                <AppUserAvatar
                  user={{ id: participant.userId, name: participant.name, initials: participant.name.charAt(0).toUpperCase() }}
                  size="md"
                />
                <Text
                  style={{
                    flex: 1,
                    fontFamily: "InstrumentSans_600SemiBold",
                    fontSize: 15,
                    color: coral.foreground,
                  }}
                  numberOfLines={1}
                >
                  {isMe ? "You" : participant.name}
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <TextInput
                    value={getSourceValue(participant)}
                    onChangeText={(v) => handleValueChange(participant.userId, v.replace(/[^0-9.]/g, ""))}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor={coral.muted}
                    style={{
                      width: 88,
                      height: 40,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: coral.border,
                      backgroundColor: coral.surface,
                      fontFamily: "IBMPlexMono_600SemiBold",
                      fontSize: 14,
                      color: coral.foreground,
                      textAlign: "right",
                      paddingHorizontal: 10,
                    }}
                  />
                  <Text
                    style={{
                      fontFamily: "IBMPlexMono_600SemiBold",
                      fontSize: 14,
                      color: coral.muted,
                    }}
                  >
                    {state.splitMethod === "percentage" ? "%" : ""}
                  </Text>
                </View>
                <Text
                  style={{
                    fontFamily: "IBMPlexMono_500Medium",
                    fontSize: 12,
                    color: coral.muted,
                    minWidth: 60,
                    textAlign: "right",
                  }}
                  numberOfLines={1}
                >
                  {getAssignedValue(participant)}
                </Text>
              </View>
            )
          })}
        </View>
      )}

      {state.splitMethod === "equal" && splitResult && (
        <View style={{ gap: 6 }}>
          {activeParticipants.map((participant) => {
            const isMe = participant.userId === currentUserId
            return (
              <View
                key={participant.userId}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  minHeight: 52,
                }}
              >
                <AppUserAvatar
                  user={{ id: participant.userId, name: participant.name, initials: participant.name.charAt(0).toUpperCase() }}
                  size="md"
                />
                <Text
                  style={{
                    flex: 1,
                    fontFamily: "InstrumentSans_600SemiBold",
                    fontSize: 15,
                    color: coral.foreground,
                  }}
                  numberOfLines={1}
                >
                  {isMe ? "You" : participant.name}
                </Text>
                <Text
                  style={{
                    fontFamily: "IBMPlexMono_600SemiBold",
                    fontSize: 14,
                    color: coral.muted,
                  }}
                >
                  {getAssignedValue(participant)}
                </Text>
              </View>
            )
          })}
        </View>
      )}

      {validationError && (
        <View
          style={{
            backgroundColor: coral.negativeSoft,
            borderWidth: 1,
            borderColor: coral.negative,
            borderRadius: 12,
            padding: 12,
          }}
        >
          <Text
            style={{
              fontFamily: "InstrumentSans_500Medium",
              fontSize: 13,
              color: coral.negative,
            }}
          >
            {validationError}
          </Text>
        </View>
      )}

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 2,
        }}
      >
        <Text
          style={{
            fontFamily: "InstrumentSans_500Medium",
            fontSize: 13,
            color: coral.muted,
          }}
        >
          Total: {assignedTotalDisplay || `${symbol}0.00`}
        </Text>
        {!validationError && splitResult && (
          <Text
            style={{
              fontFamily: "InstrumentSans_500Medium",
              fontSize: 13,
              color: coral.positive,
            }}
          >
            Split valid
          </Text>
        )}
      </View>

      <CoralButton
        label="Apply Split"
        onPress={handleApply}
        variant="primary"
        disabled={!!validationError || !splitResult}
      />
    </View>
  )
}
