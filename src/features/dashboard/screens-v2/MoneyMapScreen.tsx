import { useCallback } from "react"
import type { JSX } from "react"
import { View, Text, ActivityIndicator, Pressable, RefreshControl, ScrollView } from "react-native"
import { Bell, CircleUserRound } from "lucide-react-native"
import * as Haptics from "expo-haptics"
import { useRouter } from "expo-router"

import { useAuth } from "@/context/AppContext"
import { useHomeSnapshot } from "@/features/dashboard/hooks/useHomeSnapshot"
import { formatAmount } from "@/components/ui/AmountDisplay"
import { AppUserAvatar } from "@/components/ui/MemberAvatar"
import { getGreeting } from "@/utils/date"
import {
  CoralScreen,
  CoralTopBar,
  LargeTitle,
  BalanceHero,
  Eyebrow,
  MoneyRow,
  CoralButton,
  useCoralColors,
} from "@/components/coral"
import { useUI } from "@/components/ui"
import type { AttentionRow, GroupLedgerRow, MovementRow } from "@/features/dashboard/hooks/useHomeSnapshot"

function formatSignedAmount(amount: number, currencyCode: string): string {
  if (amount > 0) return `+${formatAmount(amount, currencyCode)}`
  return formatAmount(amount, currencyCode)
}

export default function MoneyMapScreen(): JSX.Element {
  const router = useRouter()
  const { currentUser } = useAuth()
  const snapshot = useHomeSnapshot(currentUser?.id ?? "")
  const coral = useCoralColors()
  const { color } = useUI()

  const onRefresh = useCallback(() => {
    void snapshot.refresh()
  }, [snapshot.refresh])

  if (snapshot.isError && !snapshot.data) {
    return (
      <CoralScreen scroll={false}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text
            style={{
              fontFamily: "InstrumentSans_600SemiBold",
              fontSize: 18,
              color: color.text,
            }}
          >
            Something went wrong
          </Text>
          <Text
            onPress={onRefresh}
            style={{
              fontFamily: "InstrumentSans_600SemiBold",
              fontSize: 15,
              color: color.brand,
            }}
          >
            Tap to retry
          </Text>
        </View>
      </CoralScreen>
    )
  }

  if (snapshot.isInitialLoading || !snapshot.data) {
    return (
      <CoralScreen scroll={false}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={color.muted} />
        </View>
      </CoralScreen>
    )
  }

  const data = snapshot.data
  const notificationCount = data.notifications.length
  const greeting = getGreeting()
  const userName = currentUser?.name?.split(" ")[0] ?? "there"

  const netSigned = data.groupLedger.reduce((sum, row) => sum + row.netSignedMinor, 0)
  const preferredCurrency =
    data.heroBalances.length > 0
      ? data.heroBalances[0].currency
      : data.groupLedger.length > 0
        ? data.groupLedger[0].group.currency
        : "USD"

  const totalOwed = data.groupLedger.reduce(
    (sum, row) => sum + Math.max(0, row.netSignedMinor),
    0
  )
  const totalOwe = data.groupLedger.reduce(
    (sum, row) => sum + Math.abs(Math.min(0, row.netSignedMinor)),
    0
  )

  function handleAttentionPress(row: AttentionRow) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push(`/friend/${row.counterpartyId}`)
  }

  function handleGroupPress(row: GroupLedgerRow) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push(`/group/${row.group.id}`)
  }

  function handleSchedulePress(id: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push(`/recurring/${id}`)
  }

  function handleMovementPress(row: MovementRow) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    if (row.type === "expense") {
      router.push(`/expense/${row.id.replace("exp-", "")}`)
    } else {
      const friendId = row.id.replace("set-", "")
      router.push(`/friend/${friendId}`)
    }
  }

  const heroValue =
    netSigned >= 0
      ? `+${formatAmount(netSigned, preferredCurrency)}`
      : formatAmount(netSigned, preferredCurrency)

  return (
    <CoralScreen>
      <CoralTopBar
        leftElement={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open settings"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              router.push("/profile")
            }}
            style={{
              width: 48,
              height: 48,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {currentUser ? (
              <AppUserAvatar user={currentUser} size="sm" />
            ) : (
              <CircleUserRound size={24} color={color.text} strokeWidth={1.7} />
            )}
          </Pressable>
        }
        rightElement={
          <View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open notifications"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                router.push("/notifications")
              }}
              style={{
                width: 48,
                height: 48,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Bell size={22} color={color.text} strokeWidth={1.7} />
            </Pressable>
            {notificationCount > 0 && (
              <View
                style={{
                  position: "absolute",
                  top: 9,
                  right: 9,
                  width: 9,
                  height: 9,
                  borderRadius: 5,
                  backgroundColor: coral.negative,
                  borderWidth: 1.5,
                  borderColor: coral.surface,
                }}
              />
            )}
          </View>
        }
      />

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={snapshot.isRefreshing}
            onRefresh={onRefresh}
            tintColor={color.text}
          />
        }
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <LargeTitle>
          {greeting}, {userName}.
        </LargeTitle>

        {data.isFirstUse ? (
          <View style={{ gap: 12, marginTop: 12 }}>
            <CoralButton
              label="Create a Group"
              variant="primary"
              onPress={() => router.push("/group/new")}
            />
            <CoralButton
              label="Add a Person"
              variant="secondary"
              onPress={() => router.push("/friend/new")}
            />
            <CoralButton
              label="Add an Expense"
              variant="secondary"
              onPress={() => router.push("/expense/new")}
            />
          </View>
        ) : (
          <>
            <BalanceHero
              label="Across all your circles"
              value={heroValue}
              note={`You're owed ${formatAmount(totalOwed, preferredCurrency)} \u00B7 You owe ${formatAmount(totalOwe, preferredCurrency)}`}
            />

            {data.attentionRows.length > 0 && (
              <>
                <Eyebrow>Needs attention</Eyebrow>
                {data.attentionRows.map((row) => {
                  const isOwe = row.type === "owe"
                  return (
                    <MoneyRow
                      key={`attention-${row.counterpartyId}`}
                      title={row.user.name}
                      subtitle={
                        isOwe
                          ? `You owe ${formatAmount(Math.abs(row.signedAmountMinor), row.currency)}`
                          : `Owes you ${formatAmount(row.signedAmountMinor, row.currency)}`
                      }
                      amount={formatSignedAmount(
                        isOwe ? -Math.abs(row.signedAmountMinor) : row.signedAmountMinor,
                        row.currency
                      )}
                      amountTone={isOwe ? "negative" : "positive"}
                      onPress={() => handleAttentionPress(row)}
                    />
                  )
                })}
              </>
            )}

            {data.nextSchedule && (
              <>
                <Eyebrow>Upcoming</Eyebrow>
                <MoneyRow
                  title={data.nextSchedule.title}
                  subtitle={data.nextSchedule.nextDueLabel ?? "Upcoming"}
                  amount=""
                  amountTone="neutral"
                  onPress={() => handleSchedulePress(data.nextSchedule!.id)}
                />
              </>
            )}

            {data.groupLedger.length > 0 && (
              <>
                <Eyebrow>Your circles</Eyebrow>
                {data.groupLedger.map((row) => (
                  <MoneyRow
                    key={`group-${row.group.id}`}
                    title={row.group.name}
                    subtitle={row.netSignedMinor >= 0 ? "You're owed" : "You owe"}
                    amount={formatSignedAmount(row.netSignedMinor, row.group.currency)}
                    amountTone={row.netSignedMinor >= 0 ? "positive" : "negative"}
                    onPress={() => handleGroupPress(row)}
                  />
                ))}
              </>
            )}

            {data.recentMovement.length > 0 && (
              <>
                <Eyebrow>Recent movement</Eyebrow>
                {data.recentMovement.map((row) => (
                  <MoneyRow
                    key={`movement-${row.id}`}
                    title={row.description}
                    subtitle={row.counterpartyName}
                    amount={formatAmount(row.amount, row.currency)}
                    amountTone={row.type === "expense" ? "negative" : "positive"}
                    onPress={() => handleMovementPress(row)}
                  />
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>
    </CoralScreen>
  )
}
