import { useEffect, useMemo, type JSX } from "react"
import {
  View,
  ScrollView,
  Pressable,
  TextInput,
  Text,
  ActivityIndicator,
} from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import * as Haptics from "expo-haptics"
import * as icons from "lucide-react-native"

import { useUI } from "@/components/ui"
import { useAuth } from "@/context/AppContext"
import { useOpenBalances } from "@/features/balances/queries/useBalances"
import { useFriendsList } from "@/features/friends/hooks/useFriendsList"
import { useGroupDetails, useGroups } from "@/features/groups/queries/useGroups"
import {
  useSettlementFlow,
  type DeterminedSettlement,
  type SettlementMethod,
} from "@/features/settlements/hooks/useSettlementFlow"
import {
  CoralButton,
  CoralScreen,
  CoralTopBar,
  BalanceHero,
} from "@/components/coral"
import type { SettleRouteParams } from "@/types/navigation"
import type { MoneyContext } from "@/features/money/types"
import { getCurrencySymbol, formatAmount } from "@/components/ui/AmountDisplay"
import { minorToMajor } from "@/features/money/splits"

const METHOD_LABELS: { key: SettlementMethod; label: string }[] = [
  { key: "cash", label: "Cash" },
  { key: "bank_transfer", label: "Bank transfer" },
  { key: "other", label: "Other external payment" },
]

const AMOUNT_PRESETS = [
  { label: "Full", getValue: (max: number) => max },
  { label: "Half", getValue: (max: number) => Math.floor(max / 2) },
  { label: "Custom", getValue: () => 0 },
]

function useHydratedSelection(userId?: string): {
  selection: DeterminedSettlement | null
  isLoading: boolean
} {
  const params = useLocalSearchParams<SettleRouteParams>()
  const { data: balances, isLoading: balancesLoading } = useOpenBalances(userId)
  const { friendRows, isLoading: friendsLoading } = useFriendsList()
  const { data: groups, isLoading: groupsLoading } = useGroups(userId)

  const userNameMap = useMemo(() => {
    const map = new Map<string, { name: string; avatar?: string }>()
    for (const row of friendRows) {
      map.set(row.friend.id, { name: row.friend.name, avatar: row.friend.avatar })
    }
    if (groups) {
      for (const group of groups) {
        for (const member of group.members) {
          if (!map.has(member.user.id)) {
            map.set(member.user.id, { name: member.user.name, avatar: member.user.avatar })
          }
        }
      }
    }
    return map
  }, [friendRows, groups])

  return useMemo(() => {
    if (balancesLoading || friendsLoading || groupsLoading || !params.id) {
      return { selection: null, isLoading: true }
    }

    const userDetails = userNameMap.get(params.id)

    if (params.contextType && params.currency && params.amountMinor) {
      const isOwedToYou = params.isOwedToYou === "true"
      const signedAmountMinor = parseInt(params.amountMinor, 10) || 0

      const friendshipRow = params.friendshipId ? undefined : friendRows.find((r) => r.friend.id === params.id)
      const resolvedFriendshipId = params.friendshipId || friendshipRow?.friendship?.id || ""
      const context: MoneyContext | null =
        params.contextType === "group" && params.groupId
          ? { type: "group", groupId: params.groupId }
          : resolvedFriendshipId
            ? { type: "direct", friendshipId: resolvedFriendshipId }
            : null

      if (!context) return { selection: null, isLoading: false }

      return {
        selection: {
          counterpartyId: params.id,
          counterpartyName: userDetails?.name || params.id,
          counterpartyAvatar: userDetails?.avatar,
          context,
          currency: params.currency,
          signedAmountMinor: isOwedToYou ? signedAmountMinor : -signedAmountMinor,
          isOwedToYou,
        },
        isLoading: false,
      }
    }

    const balance = balances?.find((b) => b.counterpartyId === params.id)
    if (!balance) return { selection: null, isLoading: false }

    return {
      selection: {
        counterpartyId: params.id,
        counterpartyName: userDetails?.name || params.id,
        counterpartyAvatar: userDetails?.avatar,
        context: balance.context,
        currency: balance.currency,
        signedAmountMinor: balance.signedAmountMinor,
        isOwedToYou: balance.signedAmountMinor > 0,
      },
      isLoading: false,
    }
  }, [balances, balancesLoading, friendRows, friendsLoading, groupsLoading, params, userNameMap])
}

export default function SettlementScreenV2(): JSX.Element {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { color } = useUI()
  const { currentUser } = useAuth()

  const { selection, isLoading: selectionLoading } = useHydratedSelection(currentUser?.id)
  const flow = useSettlementFlow(currentUser?.id)

  const groupId = selection?.context.type === "group" ? selection.context.groupId : undefined
  const { data: group } = useGroupDetails(groupId)
  const groupName = group?.name

  useEffect(() => {
    if (selection && flow.state.step === "loading") {
      flow.startCompose(selection)
    }
  }, [flow, selection])

  if (selectionLoading) {
    return (
      <CoralScreen scroll={false}>
        <CoralTopBar title="Settle up" onBack={() => router.back()} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={color.text} />
        </View>
      </CoralScreen>
    )
  }

  if (!selection) {
    return (
      <CoralScreen scroll={false}>
        <CoralTopBar title="Settle up" onBack={() => router.back()} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 16 }}>
          <icons.CheckCircle2 size={64} color="#4CAF82" strokeWidth={1.5} />
          <Text
            style={{
              fontSize: 22,
              fontFamily: "InstrumentSans_600SemiBold",
              color: color.text,
            }}
          >
            All settled up!
          </Text>
          <CoralButton label="Go back" variant="primary" onPress={() => router.back()} />
        </View>
      </CoralScreen>
    )
  }

  return (
    <CoralScreen scroll={false}>
      <CoralTopBar title="Settle up" onBack={() => router.back()} />
      {flow.state.step === "compose" && (
        <ComposeView flow={flow} color={color} insets={insets} groupName={groupName} />
      )}
      {flow.state.step === "review" && (
        <ReviewView flow={flow} color={color} insets={insets} groupName={groupName} />
      )}
      {flow.state.step === "success" && (
        <SuccessView flow={flow} color={color} insets={insets} router={router} groupName={groupName} />
      )}
    </CoralScreen>
  )
}

function ComposeView({
  flow,
  color,
  insets,
  groupName,
}: {
  flow: ReturnType<typeof useSettlementFlow>
  color: any
  insets: any
  groupName?: string
}) {
  if (flow.state.step !== "compose") return null
  const { selection, amountInput, method, note, composeError } = flow.state
  const maxMinor = Math.abs(selection.signedAmountMinor)
  const directionWords = selection.isOwedToYou
    ? `${selection.counterpartyName.split(" ")[0]} pays you`
    : `You pay ${selection.counterpartyName.split(" ")[0]}`

  return (
    <ScrollView
      contentContainerStyle={{
        paddingBottom: Math.max(insets.bottom, 16) + 120,
      }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={{ alignItems: "center", paddingTop: 24, gap: 8 }}>
        {composeError ? (
          <Text
            style={{
              fontFamily: "InstrumentSans_500Medium",
              fontSize: 13,
              color: color.negative,
              textAlign: "center",
              marginBottom: 8,
              paddingHorizontal: 22,
            }}
          >
            {composeError}
          </Text>
        ) : null}
        <Text
          style={{
            fontFamily: "InstrumentSans_500Medium",
            fontSize: 16,
            color: color.muted,
            textAlign: "center",
          }}
        >
          {directionWords}
        </Text>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            marginTop: 12,
          }}
        >
          <Text
            style={{
              fontSize: 28,
              fontFamily: "IBMPlexMono_500Medium",
              color: color.text,
            }}
          >
            {getCurrencySymbol(selection.currency)}
          </Text>
          <TextInput
            value={amountInput}
            onChangeText={flow.setAmountInput}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={color.muted}
            style={{
              fontSize: 40,
          fontFamily: "InstrumentSans_600SemiBold",
              color: amountInput ? color.text : color.muted,
              letterSpacing: -1,
              textAlign: "center",
              minWidth: 100,
              padding: 0,
            }}
            autoFocus
          />
        </View>

        <Text
          style={{
            fontFamily: "InstrumentSans_400Regular",
            fontSize: 12,
            color: color.muted,
            textAlign: "center",
          }}
        >
          Full open balance{groupName ? ` across ${groupName}` : ""}
        </Text>

        <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
          {AMOUNT_PRESETS.map((preset) => (
            <Pressable
              key={preset.label}
              accessibilityRole="button"
              onPress={() => {
                Haptics.selectionAsync()
                if (preset.label === "Custom") return
                flow.setAmountInput(String(preset.getValue(maxMinor)))
              }}
              style={({ pressed }) => ({
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderWidth: 1,
                borderColor: color.border,
                borderRadius: 999,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text
                style={{
                  fontSize: 13,
                  color: color.text,
                  fontFamily: "InstrumentSans_600SemiBold",
                }}
              >
                {preset.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {groupName ? (
        <View style={{ paddingHorizontal: 22, marginTop: 32, gap: 8 }}>
          <Text
            style={{
              fontSize: 12,
              fontFamily: "InstrumentSans_600SemiBold",
              color: color.muted,
              textTransform: "uppercase",
              letterSpacing: 0.8,
            }}
          >
            Applies to
          </Text>
          <View
            style={{
              borderRadius: 12,
              borderWidth: 1,
              borderColor: color.border,
              overflow: "hidden",
            }}
          >
            <ReviewRow label="Group" value={groupName} color={color} />
          </View>
        </View>
      ) : null}

      <View style={{ paddingHorizontal: 22, marginTop: groupName ? 8 : 32, gap: 8 }}>
        <Text
          style={{
            fontSize: 12,
            fontFamily: "InstrumentSans_600SemiBold",
            color: color.muted,
            textTransform: "uppercase",
            letterSpacing: 0.8,
          }}
        >
          Payment method
        </Text>
        <View
          style={{
            borderRadius: 12,
            borderWidth: 1,
            borderColor: color.border,
            overflow: "hidden",
          }}
        >
          {METHOD_LABELS.map((m, idx) => {
            const isActive = method === m.key
            return (
              <Pressable
                key={m.key}
                accessibilityRole="button"
                onPress={() => {
                  Haptics.selectionAsync()
                  flow.setMethod(m.key)
                }}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 16,
                  paddingVertical: 16,
                  gap: 12,
                  minHeight: 56,
                  borderBottomWidth: idx < METHOD_LABELS.length - 1 ? 1 : 0,
                  borderBottomColor: color.border,
                  backgroundColor: isActive ? color.subtle : "transparent",
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    borderWidth: 2,
                    borderColor: isActive ? color.ink : color.border,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {isActive && (
                    <View
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: color.ink,
                      }}
                    />
                  )}
                </View>
                <Text
                  style={{
                    fontSize: 15,
                    fontFamily: "InstrumentSans_500Medium",
                    color: isActive ? color.text : color.muted,
                    flex: 1,
                  }}
                >
                  {m.label}
                </Text>
                {isActive && (
                  <icons.Check size={16} color={color.text} strokeWidth={2} />
                )}
              </Pressable>
            )
          })}
        </View>
      </View>

      <View style={{ paddingHorizontal: 22, marginTop: 24 }}>
        <TextInput
          placeholder="Add a note (optional)"
          placeholderTextColor={color.muted}
          value={note}
          onChangeText={flow.setNote}
          style={{
            borderWidth: 1,
            borderColor: color.border,
            padding: 16,
            borderRadius: 999,
            fontSize: 15,
            fontFamily: "InstrumentSans_500Medium",
            color: color.text,
          }}
        />
      </View>

      <View
        style={{
          position: "absolute",
          left: 22,
          right: 22,
          bottom: Math.max(insets.bottom, 16),
          gap: 8,
        }}
      >
        <CoralButton
          label="Review payment"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            flow.goToReview()
          }}
          disabled={!amountInput || parseInt(amountInput, 10) <= 0}
        />
        <Text
          style={{
            fontSize: 12,
            fontFamily: "InstrumentSans_500Medium",
            color: color.muted,
            textAlign: "center",
            lineHeight: 16,
          }}
        >
          Splt records this payment but does not move money.
        </Text>
      </View>
    </ScrollView>
  )
}

function ReviewView({
  flow,
  color,
  insets,
  groupName,
}: {
  flow: ReturnType<typeof useSettlementFlow>
  color: any
  insets: any
  groupName?: string
}) {
  if (flow.state.step !== "review") return null
  const { selection, amountMinor, method, note, resultingMinor } = flow.state
  const amountWhole = minorToMajor(amountMinor, selection.currency)
  const resultingWhole = minorToMajor(resultingMinor, selection.currency)
  const methodLabel = METHOD_LABELS.find((m) => m.key === method)?.label || method
  const isPositiveResult = resultingWhole >= 0

  return (
    <ScrollView
      contentContainerStyle={{
        paddingBottom: Math.max(insets.bottom, 16) + 120,
      }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={{ paddingHorizontal: 22, paddingTop: 16, gap: 16 }}>
        <Text
          style={{
            fontFamily: "InstrumentSans_400Regular",
            fontSize: 14,
            color: color.muted,
            textAlign: "center",
            lineHeight: 20,
          }}
        >
          Splt records this payment but does not move money. Both people will see
          the record.
        </Text>

        <BalanceHero
          label={
            selection.isOwedToYou
              ? `${selection.counterpartyName.split(" ")[0]} pays you`
              : `You pay ${selection.counterpartyName.split(" ")[0]}`
          }
          value={`${formatAmount(amountWhole, selection.currency)} ${selection.currency}`}
          note={[methodLabel, groupName].filter(Boolean).join(" - ")}
        />

        <View
          style={{
            borderRadius: 12,
            borderWidth: 1,
            borderColor: color.border,
            overflow: "hidden",
          }}
        >
          <ReviewRow label="From" value={selection.isOwedToYou ? selection.counterpartyName : "You"} color={color} />
          <ReviewRow label="To" value={selection.isOwedToYou ? "You" : selection.counterpartyName} color={color} />
          {groupName ? (
            <ReviewRow label="Group" value={groupName} color={color} />
          ) : null}
          <ReviewRow label="Method" value={methodLabel} color={color} />
          {note ? <ReviewRow label="Note" value={note} color={color} /> : null}
          <ReviewRow
            label="Balance after"
            value={`${isPositiveResult ? "+" : ""}${formatAmount(resultingWhole, selection.currency)} ${selection.currency}${resultingWhole === 0 ? " - settled" : ""}`}
            color={color}
            valueTone={resultingWhole === 0 ? "credit" : undefined}
          />
        </View>
      </View>

      <View
        style={{
          position: "absolute",
          left: 22,
          right: 22,
          bottom: Math.max(insets.bottom, 16),
          gap: 8,
        }}
      >
        <CoralButton
          label="Record settlement"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            flow.submit()
          }}
        />
        <CoralButton
          label="Change details"
          variant="text"
          onPress={() => flow.goBackToCompose()}
        />
      </View>
    </ScrollView>
  )
}

function SuccessView({
  flow,
  color,
  insets,
  router,
  groupName,
}: {
  flow: ReturnType<typeof useSettlementFlow>
  color: any
  insets: any
  router: any
  groupName?: string
}) {
  if (flow.state.step !== "success") return null
  const { settlement, resultingMinor, selection } = flow.state
  const amountWhole = minorToMajor(settlement.amountMinor, selection.currency)
  const resultingWhole = minorToMajor(resultingMinor, selection.currency)
  const methodLabel =
    METHOD_LABELS.find((m) => m.key === settlement.method)?.label || settlement.method
  const isPositiveResult = resultingWhole >= 0

  const directionText = selection.isOwedToYou
    ? `${selection.counterpartyName.split(" ")[0]} paid you`
    : `You paid ${selection.counterpartyName.split(" ")[0]}`

  const introText = `${directionText} ${formatAmount(amountWhole, selection.currency)} in ${methodLabel.toLowerCase()}.${groupName ? ` Your ${groupName} balance is now settled.` : ""}`

  return (
    <ScrollView
      contentContainerStyle={{
        paddingBottom: Math.max(insets.bottom, 16) + 120,
        alignItems: "center",
        paddingTop: 32,
        paddingHorizontal: 22,
        gap: 24,
      }}
    >
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: "#4CAF82",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <icons.Check size={40} color="#fff" strokeWidth={2.5} />
      </View>

      <View style={{ alignItems: "center", gap: 8 }}>
        <Text
          style={{
          fontFamily: "InstrumentSans_600SemiBold",
            fontSize: 24,
            color: color.text,
            textAlign: "center",
          }}
        >
          Settlement recorded
        </Text>
        <Text
          style={{
            fontFamily: "InstrumentSans_400Regular",
            fontSize: 14,
            color: color.muted,
            textAlign: "center",
            lineHeight: 20,
            maxWidth: 280,
          }}
        >
          {introText}
        </Text>
      </View>

      <View
        style={{
          borderRadius: 12,
          borderWidth: 1,
          borderColor: color.border,
          overflow: "hidden",
          width: "100%",
        }}
      >
        <ReviewRow
          label="Recorded amount"
          value={`${formatAmount(amountWhole, settlement.currency)} ${settlement.currency}`}
          color={color}
        />
        <ReviewRow
          label="Direction"
          value={directionText}
          color={color}
        />
        <ReviewRow
          label="Method"
          value={`${methodLabel}${settlement.method === "cash" ? " - external" : ""}`}
          color={color}
        />
        <ReviewRow
          label="Result"
          value={`${isPositiveResult ? "+" : ""}${formatAmount(resultingWhole, settlement.currency)} ${settlement.currency}${resultingWhole === 0 ? " open balance" : ""}`}
          color={color}
          valueTone={resultingWhole === 0 ? "credit" : undefined}
        />
      </View>

      <View style={{ width: "100%", gap: 8, marginTop: 16 }}>
        <CoralButton
          label="View relationship"
          variant="primary"
          onPress={() => router.replace({ pathname: "/friend/[id]", params: { id: selection.counterpartyId } })}
        />
        {groupName ? (
          <CoralButton
            label={`Back to ${groupName}`}
            variant="secondary"
            onPress={() => router.replace({ pathname: "/group/[id]", params: { id: selection.context.groupId } })}
          />
        ) : (
          <CoralButton
            label="Done"
            variant="secondary"
            onPress={() => router.back()}
          />
        )}
      </View>
    </ScrollView>
  )
}

function ReviewRow({
  label,
  value,
  color,
  valueTone,
}: {
  label: string
  value: string
  color: any
  valueTone?: "credit" | "debt" | undefined
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: color.border,
      }}
    >
      <Text
        style={{
          flex: 1,
          fontSize: 14,
          fontFamily: "InstrumentSans_500Medium",
          color: color.muted,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontSize: 14,
          fontFamily: "InstrumentSans_600SemiBold",
          color: valueTone === "credit" ? "#4CAF82" : valueTone === "debt" ? "#E85D5D" : color.text,
        }}
      >
        {value}
      </Text>
    </View>
  )
}
