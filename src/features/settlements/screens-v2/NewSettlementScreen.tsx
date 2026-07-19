import { useMemo, type JSX } from "react"
import { ActivityIndicator, Text, View } from "react-native"
import { useRouter } from "expo-router"
import { CircleCheckBig } from "lucide-react-native"

import {
  CoralButton,
  CoralScreen,
  CoralTopBar,
  EmptyState,
  LargeTitle,
  MoneyRow,
} from "@/components/coral"
import { AppUserAvatar } from "@/components/ui/MemberAvatar"
import { useUI } from "@/components/ui"
import { SHELL_HREFS } from "@/features/navigation/shell"
import { useOpenBalances } from "@/features/balances/queries/useBalances"
import { useAuth } from "@/context/AppContext"
import type { OpenBalance } from "@/features/money/types"
import { formatAmount } from "@/components/ui/AmountDisplay"

type CounterpartyGroup = {
  counterpartyId: string
  counterpartyName: string
  counterpartyAvatar?: string
  entries: OpenBalance[]
}

export default function NewSettlementScreen(): JSX.Element {
  const router = useRouter()
  const { color } = useUI()
  const { currentUser } = useAuth()
  const { data: balances, isLoading, isError, refetch } = useOpenBalances(currentUser?.id)

  const candidates = useMemo(() => {
    if (!balances) return []
    const grouped = new Map<string, OpenBalance[]>()
    for (const b of balances) {
      if (b.signedAmountMinor === 0) continue
      const existing = grouped.get(b.counterpartyId) || []
      existing.push(b)
      grouped.set(b.counterpartyId, existing)
    }
    const groups: CounterpartyGroup[] = []
    for (const [counterpartyId, entries] of grouped) {
      groups.push({
        counterpartyId,
        counterpartyName: entries[0].counterpartyId,
        entries,
      })
    }
    return groups
  }, [balances])

  const goBack = () => {
    if (router.canGoBack()) {
      router.back()
    } else {
      router.replace(SHELL_HREFS.home)
    }
  }

  const handleSelectCounterparty = (group: CounterpartyGroup) => {
    if (group.entries.length === 1) {
      const entry = group.entries[0]
      router.replace({
        pathname: "/settle/[id]",
        params: {
          id: group.counterpartyId,
          contextType: entry.context.type,
          ...(entry.context.type === "group"
            ? { groupId: entry.context.groupId }
            : { friendshipId: entry.context.friendshipId }),
          currency: entry.currency,
          amountMinor: String(Math.abs(entry.signedAmountMinor)),
          isOwedToYou: entry.signedAmountMinor > 0 ? "true" : "false",
        },
      })
    }
  }

  return (
    <CoralScreen>
      <CoralTopBar title="Settle up" onBack={goBack} />
      <LargeTitle>Choose a balance.</LargeTitle>
      <Text
        style={{
          fontFamily: "InstrumentSans_400Regular",
          fontSize: 15,
          lineHeight: 22,
          color: color.muted,
          marginBottom: 12,
        }}
      >
        Select who you are recording an external payment with.
      </Text>

      {isError ? (
        <View style={{ minHeight: 280, alignItems: "center", justifyContent: "center", gap: 14 }}>
          <Text
            style={{
              fontFamily: "InstrumentSans_600SemiBold",
              fontSize: 18,
              color: color.text,
            }}
          >
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
        candidates.map((group) => {
          const total = group.entries.reduce((sum, e) => sum + e.signedAmountMinor, 0)
          const isOwed = total > 0
          const currency = group.entries[0].currency
          return (
            <MoneyRow
              key={group.counterpartyId}
              avatar={<AppUserAvatar user={{ id: group.counterpartyId, name: group.counterpartyName, initials: group.counterpartyName.charAt(0).toUpperCase() }} size="sm" />}
              title={group.counterpartyName}
              subtitle={
                isOwed
                  ? `${group.counterpartyName.split(" ")[0]} pays you`
                  : `You pay ${group.counterpartyName.split(" ")[0]}`
              }
              amount={formatAmount(Math.abs(total) / 100, currency)}
              amountTone={isOwed ? "positive" : "negative"}
              onPress={() => handleSelectCounterparty(group)}
            />
          )
        })
      )}
    </CoralScreen>
  )
}
