import { useMemo, useState, useCallback, type JSX } from "react"
import { ActivityIndicator, Text, View } from "react-native"
import { useRouter, useLocalSearchParams } from "expo-router"
import { CircleCheckBig, CircleAlert } from "lucide-react-native"

import {
  CoralButton,
  CoralScreen,
  CoralTopBar,
  CoralSheet,
  EmptyState,
  LargeTitle,
  MoneyRow,
} from "@/components/coral"
import { AppUserAvatar } from "@/components/ui/MemberAvatar"
import { useUI } from "@/components/ui"
import { SHELL_HREFS } from "@/features/navigation/shell"
import { useOpenBalances } from "@/features/balances/queries/useBalances"
import { useFriendsList } from "@/features/friends/hooks/useFriendsList"
import { useAuth } from "@/context/AppContext"
import type { OpenBalance, MoneyContext, SettlementMutationInput } from "@/features/money/types"
import { formatAmount } from "@/components/ui/AmountDisplay"
import { minorToMajor } from "@/features/money/splits"
import { useCreateSettlement } from "@/features/settlements/queries/useSettlements"
import { useGroups } from "@/features/groups/queries/useGroups"
import { randomUUID } from "@/utils/randomUUID"

type CounterpartyGroup = {
  counterpartyId: string
  counterpartyName: string
  counterpartyAvatar?: string
  entries: OpenBalance[]
}

export default function NewSettlementScreen(): JSX.Element {
  const router = useRouter()
  const params = useLocalSearchParams<{ groupId?: string; counterpartyId?: string }>()
  const { color } = useUI()
  const { currentUser } = useAuth()
  const filterGroupId = params.groupId ?? undefined
  const filterCounterpartyId = params.counterpartyId ?? undefined
  const { data: balances, isLoading, isError, refetch } = useOpenBalances(currentUser?.id)
  const { friendRows } = useFriendsList()
  const { data: groups } = useGroups(currentUser?.id)
  const { mutateAsync: createSettlement } = useCreateSettlement()

  const [settlingAll, setSettlingAll] = useState(false)
  const [settleResult, setSettleResult] = useState<"idle" | "success" | "partial">("idle")
  const [settledCount, setSettledCount] = useState(0)
  const [showSettleConfirm, setShowSettleConfirm] = useState(false)

  const friendshipByCounterparty = useMemo(() => {
    const map = new Map<string, string>()
    for (const row of friendRows) {
      if (row.friendship?.id) map.set(row.friend.id, row.friendship.id)
    }
    return map
  }, [friendRows])

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

  const candidates = useMemo(() => {
    if (!balances) return []
    const filtered = filterGroupId
      ? balances.filter(
          (b) => b.context.type === "group" && b.context.groupId === filterGroupId
        )
      : filterCounterpartyId
        ? balances.filter((b) => b.counterpartyId === filterCounterpartyId)
        : balances
    const flat: CounterpartyGroup[] = []
    for (let b of filtered) {
      if (b.signedAmountMinor === 0) continue
      if (b.context.type === "direct" && !b.context.friendshipId) {
        const friendshipId = friendshipByCounterparty.get(b.counterpartyId)
        if (!friendshipId) continue
        b = { ...b, context: { type: "direct", friendshipId } }
      }
      const userDetails = userNameMap.get(b.counterpartyId)
      flat.push({
        counterpartyId: b.counterpartyId,
        counterpartyName: userDetails?.name || b.counterpartyId,
        counterpartyAvatar: userDetails?.avatar,
        entries: [b],
      })
    }
    return flat
  }, [balances, userNameMap, friendshipByCounterparty, filterGroupId, filterCounterpartyId])

  const goBack = () => {
    if (router.canGoBack()) {
      router.back()
    } else {
      router.replace(SHELL_HREFS.home)
    }
  }

  const handleSelectCounterparty = (group: CounterpartyGroup) => {
    const entry = group.entries[0]
    if (!entry) return
    const isOwed = entry.signedAmountMinor > 0
    router.replace({
      pathname: "/settle/[id]",
      params: {
        id: group.counterpartyId,
        contextType: entry.context.type,
        groupId: entry.context.type === "group" ? entry.context.groupId : undefined,
        friendshipId: entry.context.type === "direct" ? entry.context.friendshipId : undefined,
        currency: entry.currency,
        amountMinor: String(Math.abs(entry.signedAmountMinor)),
        isOwedToYou: isOwed ? "true" : "false",
      },
    })
  }

  const handleSettleAll = useCallback(async () => {
    if (!filterCounterpartyId || candidates.length === 0) return
    setSettlingAll(true)
    setSettleResult("idle")
    let successCount = 0
    for (const group of candidates) {
      const entry = group.entries[0]
      if (!entry) continue

      // Re-read before every settlement. The previous mutation invalidates the
      // balance query, but the cached candidate list is intentionally stable for
      // the confirmation screen and can otherwise contain an already-settled row.
      const latestBalances = (await refetch()).data ?? []
      const latest = latestBalances.find((balance) => {
        if (
          balance.counterpartyId !== group.counterpartyId ||
          balance.currency !== entry.currency ||
          balance.context.type !== entry.context.type
        ) {
          return false
        }
        if (balance.context.type === "group" && entry.context.type === "group") {
          return balance.context.groupId === entry.context.groupId
        }
        if (balance.context.type === "direct" && entry.context.type === "direct") {
          const latestFriendshipId =
            balance.context.friendshipId || friendshipByCounterparty.get(balance.counterpartyId)
          const entryFriendshipId =
            entry.context.friendshipId || friendshipByCounterparty.get(entry.counterpartyId)
          return Boolean(latestFriendshipId && entryFriendshipId && latestFriendshipId === entryFriendshipId)
        }
        return false
      })

      if (!latest || latest.signedAmountMinor === 0) {
        // Another request may have settled it between the initial read and now.
        // For “settle all”, an already-zero balance is a successful outcome.
        successCount++
        continue
      }

      const resolvedFriendshipId =
        latest.context.type === "direct"
          ? latest.context.friendshipId || friendshipByCounterparty.get(latest.counterpartyId)
          : undefined
      if (latest.context.type === "direct" && !resolvedFriendshipId) {
        console.warn("[settle-all] skipped direct balance without friendship", latest)
        continue
      }

      const ctx: MoneyContext =
        latest.context.type === "group"
          ? { type: "group", groupId: latest.context.groupId }
          : { type: "direct", friendshipId: resolvedFriendshipId! }
      const input: SettlementMutationInput = {
        clientOperationId: randomUUID(),
        counterpartyId: group.counterpartyId,
        context: ctx,
        amountMinor: Math.abs(latest.signedAmountMinor),
        currency: latest.currency,
        method: "cash",
      }
      try {
        await createSettlement(input)
        successCount++
      } catch (e: any) {
        if (String(e?.message || e).startsWith("BALANCE_CHANGED:0")) {
          successCount++
          continue
        }
        console.warn("[settle-all] failed:", e?.message || e, JSON.stringify(input))
      }
    }
    setSettledCount(successCount)
    setSettleResult(successCount === candidates.length ? "success" : "partial")
    setSettlingAll(false)
  }, [filterCounterpartyId, candidates, createSettlement, friendshipByCounterparty, refetch])

  const counterpartyName = candidates[0]?.counterpartyName ?? ""

  return (
    <CoralScreen>
      <CoralTopBar
        title={filterGroupId ? "Settle in group" : filterCounterpartyId ? `Settle with ${counterpartyName}` : "Settle up"}
        onBack={goBack}
      />

      {settleResult === "success" ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 16, paddingHorizontal: 24 }}>
          <CircleCheckBig size={56} color="#4CAF82" strokeWidth={1.5} />
          <Text style={{ fontFamily: "InstrumentSans_600SemiBold", fontSize: 22, color: color.text, textAlign: "center" }}>
            All settled!
          </Text>
          <Text style={{ fontFamily: "InstrumentSans_400Regular", fontSize: 15, color: color.muted, textAlign: "center" }}>
            All balances with {counterpartyName} have been recorded.
          </Text>
          <CoralButton label="Done" variant="primary" onPress={goBack} />
        </View>
      ) : settleResult === "partial" ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 16, paddingHorizontal: 24 }}>
          <CircleAlert size={56} color="#F5A623" strokeWidth={1.5} />
          <Text style={{ fontFamily: "InstrumentSans_600SemiBold", fontSize: 22, color: color.text, textAlign: "center" }}>
            {settledCount} of {candidates.length} settled
          </Text>
          <Text style={{ fontFamily: "InstrumentSans_400Regular", fontSize: 15, color: color.muted, textAlign: "center" }}>
            Some balances could not be processed. You can try again for the remaining ones.
          </Text>
          <CoralButton label="Done" variant="primary" onPress={goBack} />
        </View>
      ) : (
        <>
          <LargeTitle>
            {filterCounterpartyId ? `Balances with ${counterpartyName}` : "Choose a balance."}
          </LargeTitle>
          <Text
            style={{
              fontFamily: "InstrumentSans_400Regular",
              fontSize: 15,
              lineHeight: 22,
              color: color.muted,
              marginBottom: 12,
            }}
          >
            {filterCounterpartyId
              ? "Settle all balances at once or pick one to settle individually."
              : "Select a balance to settle."}
          </Text>

          {isError ? (
            <View style={{ minHeight: 280, alignItems: "center", justifyContent: "center", gap: 14 }}>
              <Text style={{ fontFamily: "InstrumentSans_600SemiBold", fontSize: 18, color: color.text }}>
                Could not load balances.
              </Text>
              <CoralButton label="Try again" variant="secondary" onPress={() => refetch()} />
            </View>
          ) : isLoading ? (
            <View style={{ minHeight: 280, alignItems: "center", justifyContent: "center" }}>
              <ActivityIndicator color={color.text} accessibilityLabel="Loading balances" />
            </View>
          ) : candidates.length === 0 ? (
            <EmptyState
              visual={<CircleCheckBig size={48} color={color.muted} strokeWidth={1.4} />}
              title="No open balances"
              subtitle="Everyone is settled. Open People to review your circles."
            >
              <View style={{ width: "100%", marginTop: 18 }}>
                <CoralButton
                  label="View people"
                  variant="secondary"
                  onPress={() => router.replace(SHELL_HREFS.circlesPeople)}
                />
              </View>
            </EmptyState>
          ) : (
            candidates.map((group, idx) => {
              const entry = group.entries[0]
              if (!entry) return null
              const isOwed = entry.signedAmountMinor > 0
              const contextName =
                entry.context.type === "group"
                  ? groups?.find((g) => g.id === entry.context.groupId)?.name
                  : "Direct"
              return (
                <MoneyRow
                  key={`${group.counterpartyId}-${idx}`}
                  avatar={<AppUserAvatar user={{ id: group.counterpartyId, name: group.counterpartyName, initials: group.counterpartyName.charAt(0).toUpperCase() }} size="sm" />}
                  title={group.counterpartyName}
                  subtitle={
                    contextName
                      ? `${isOwed ? "Owes you" : "You owe"} \u00B7 ${contextName}`
                      : isOwed
                        ? `${group.counterpartyName.split(" ")[0]} pays you`
                        : `You pay ${group.counterpartyName.split(" ")[0]}`
                  }
                  amount={formatAmount(minorToMajor(Math.abs(entry.signedAmountMinor), entry.currency), entry.currency)}
                  amountTone={isOwed ? "positive" : "negative"}
                  onPress={() => handleSelectCounterparty(group)}
                />
              )
            })
          )}

          {filterCounterpartyId && candidates.length > 1 && settleResult === "idle" && (
            <View style={{ marginTop: 16 }}>
              <CoralButton
                label={settlingAll ? "Settling..." : "Settle all"}
                onPress={() => setShowSettleConfirm(true)}
                disabled={settlingAll}
                loading={settlingAll}
              />
            </View>
          )}
        </>
      )}

      <CoralSheet visible={showSettleConfirm} onClose={() => setShowSettleConfirm(false)}>
        <View style={{ paddingHorizontal: 18, paddingBottom: 8 }}>
          <Text
            style={{
              fontFamily: "InstrumentSans_600SemiBold",
              fontSize: 22,
              letterSpacing: -0.025 * 22,
              color: color.text,
              marginBottom: 12,
            }}
          >
            Settle all with {counterpartyName}?
          </Text>
          <Text
            style={{
              fontFamily: "InstrumentSans_400Regular",
              fontSize: 14,
              color: color.muted,
              lineHeight: 20,
              marginBottom: 16,
            }}
          >
            This will record {candidates.length} separate settlements:
          </Text>

          {candidates.map((group, idx) => {
            const entry = group.entries[0]
            if (!entry) return null
            const contextName =
              entry.context.type === "group"
                ? groups?.find((g) => g.id === entry.context.groupId)?.name
                : "Direct"
            return (
              <View
                key={idx}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingVertical: 10,
                  borderTopWidth: idx > 0 ? 1 : 0,
                  borderTopColor: color.border,
                }}
              >
                <Text
                  style={{
                    fontFamily: "InstrumentSans_500Medium",
                    fontSize: 14,
                    color: color.text,
                    flex: 1,
                  }}
                >
                  {contextName ?? "Unknown"}
                </Text>
                <Text
                  style={{
                    fontFamily: "IBMPlexMono_600SemiBold",
                    fontSize: 14,
                    color: entry.signedAmountMinor > 0 ? color.success : color.danger,
                  }}
                >
                  {formatAmount(minorToMajor(Math.abs(entry.signedAmountMinor), entry.currency), entry.currency)}
                </Text>
              </View>
            )
          })}

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingVertical: 12,
              borderTopWidth: 1,
              borderTopColor: color.border,
              marginTop: 4,
            }}
          >
            <Text
              style={{
                fontFamily: "InstrumentSans_600SemiBold",
                fontSize: 15,
                color: color.text,
              }}
            >
              Total
            </Text>
            <Text
              style={{
                fontFamily: "IBMPlexMono_600SemiBold",
                fontSize: 15,
                color: color.text,
              }}
            >
              {formatAmount(
                minorToMajor(
                  candidates.reduce((s, g) => s + Math.abs(g.entries[0]?.signedAmountMinor ?? 0), 0),
                  candidates[0]?.entries[0]?.currency ?? "USD"
                ),
                candidates[0]?.entries[0]?.currency ?? "USD"
              )}
            </Text>
          </View>

          <View style={{ gap: 8, marginTop: 16 }}>
            <CoralButton
              label="Confirm settlements"
              onPress={() => {
                setShowSettleConfirm(false)
                handleSettleAll()
              }}
            />
            <CoralButton
              label="Cancel"
              variant="text"
              onPress={() => setShowSettleConfirm(false)}
            />
          </View>
        </View>
      </CoralSheet>
    </CoralScreen>
  )
}
