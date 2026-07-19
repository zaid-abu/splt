import { useCallback, Fragment } from "react"
import type { JSX } from "react"
import { View, Text, ActivityIndicator, Pressable, RefreshControl, ScrollView } from "react-native"
import { Bell, CircleUserRound } from "lucide-react-native"
import * as Haptics from "expo-haptics"
import { useRouter } from "expo-router"

import { useAuth } from "@/context/AppContext"
import { useHomeSnapshot } from "@/features/dashboard/hooks/useHomeSnapshot"
import { formatAmount } from "@/components/ui/AmountDisplay"
import { minorToMajor } from "@/features/money/splits"
import { useUIStore } from "@/store/useUIStore"
import { AppUserAvatar } from "@/components/ui/MemberAvatar"
import { getGreeting } from "@/utils/date"
import {
  CoralScreen,
  CoralTopBar,
  LargeTitle,
  BalanceHero,
  MoneyRow,
  CoralButton,
  useCoralColors,
} from "@/components/coral"
import type { AttentionRow, GroupLedgerRow, MovementRow } from "@/features/dashboard/hooks/useHomeSnapshot"

function formatSignedAmount(amountMinor: number, currencyCode: string): string {
  const major = minorToMajor(amountMinor, currencyCode)
  if (major > 0) return `+${formatAmount(major, currencyCode)}`
  return formatAmount(major, currencyCode)
}

function getFormattedDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })
}

function SectionHeading({ title, meta }: { title: string; meta?: string }) {
  const coral = useCoralColors()
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "baseline",
        justifyContent: "space-between",
        gap: 12,
        marginTop: 24,
        marginBottom: 10,
        paddingHorizontal: 2,
      }}
    >
      <Text
        style={{
          fontFamily: "InstrumentSans_600SemiBold",
          fontSize: 15,
          color: coral.foreground,
        }}
      >
        {title}
      </Text>
      {meta ? (
        <Text
          style={{
            fontFamily: "InstrumentSans_400Regular",
            fontSize: 12,
            color: coral.muted,
          }}
        >
          {meta}
        </Text>
      ) : null}
    </View>
  )
}

function SectionCard({ children }: { children: React.ReactNode }) {
  const coral = useCoralColors()
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: coral.border,
        borderRadius: 16,
        backgroundColor: coral.surface,
        overflow: "hidden",
      }}
    >
      {children}
    </View>
  )
}

function Separator() {
  const coral = useCoralColors()
  return (
    <View
      style={{
        height: 1,
        backgroundColor: coral.border,
        marginLeft: 58,
      }}
    />
  )
}

export default function MoneyMapScreen(): JSX.Element | null {
  const router = useRouter()
  const { currentUser } = useAuth()
  const snapshot = useHomeSnapshot(currentUser?.id ?? "")
  const coral = useCoralColors()
  const storeCurrency = useUIStore((s) => s.preferredCurrency)
  const convertCurrency = useUIStore((s) => s.convertCurrency)
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
              color: coral.foreground,
            }}
          >
            Something went wrong
          </Text>
          <Text
            onPress={onRefresh}
            style={{
              fontFamily: "InstrumentSans_600SemiBold",
              fontSize: 15,
              color: coral.accent,
            }}
          >
            Tap to retry
          </Text>
        </View>
      </CoralScreen>
    )
  }

  if (snapshot.isInitialLoading) {
    return (
      <CoralScreen scroll={false}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={coral.muted} />
        </View>
      </CoralScreen>
    )
  }

  if (!snapshot.data) {
    return null
  }

  const data = snapshot.data
  const notificationCount = data.notifications.length
  const greeting = getGreeting()
  const userName = currentUser?.name?.split(" ")[0] ?? "there"
  const preferredCurrency = storeCurrency.code

  const groupLedgerConverted = data.groupLedger.map((row) => {
    const major = minorToMajor(row.netSignedMinor, row.group.currency)
    const converted = convertCurrency(major, row.group.currency, preferredCurrency)
    return { ...row, convertedMinor: Math.round(converted * 100) }
  })

  const netSigned = groupLedgerConverted.reduce(
    (sum, row) => sum + row.convertedMinor,
    0
  )
  const totalOwed = groupLedgerConverted.reduce(
    (sum, row) => sum + Math.max(0, row.convertedMinor),
    0
  )
  const totalOwe = groupLedgerConverted.reduce(
    (sum, row) => sum + Math.abs(Math.min(0, row.convertedMinor)),
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

  const netSignedMajor = minorToMajor(netSigned, preferredCurrency)
  const totalOwedMajor = minorToMajor(totalOwed, preferredCurrency)
  const totalOweMajor = minorToMajor(totalOwe, preferredCurrency)
  const heroValue =
    netSignedMajor >= 0
      ? `+${formatAmount(netSignedMajor, preferredCurrency)}`
      : formatAmount(netSignedMajor, preferredCurrency)

  return (
    <CoralScreen>
      <CoralTopBar
        leftElement={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open settings"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              router.push("/more")
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
              <CircleUserRound size={24} color={coral.foreground} strokeWidth={1.7} />
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
              <Bell size={22} color={coral.foreground} strokeWidth={1.7} />
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
            tintColor={coral.foreground}
          />
        }
        contentContainerStyle={{ paddingBottom: 110 }}
      >
        <Text
          style={{
            fontFamily: "InstrumentSans_600SemiBold",
            fontSize: 12,
            color: coral.muted,
            marginBottom: 4,
          }}
        >
          {getFormattedDate()}
        </Text>

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
              label="Across your circles"
              value={heroValue}
              note={`You're owed ${formatAmount(totalOwedMajor, preferredCurrency)} \u00B7 You owe ${formatAmount(totalOweMajor, preferredCurrency)}`}
            />

            {data.attentionRows.length > 0 && (
              <>
                <SectionHeading
                  title="Needs attention"
                  meta={`${data.attentionRows.length}`}
                />
                <SectionCard>
                  {data.attentionRows.map((row, idx) => {
                    const isOwe = row.type === "owe"
                    return (
                      <Fragment key={`attention-${row.counterpartyId}`}>
                        {idx > 0 ? <Separator /> : null}
                        <MoneyRow
                          title={row.user.name}
                          subtitle={
                            isOwe
                              ? `You owe ${formatAmount(minorToMajor(Math.abs(row.signedAmountMinor), row.currency), row.currency)}`
                              : `Owes you ${formatAmount(minorToMajor(row.signedAmountMinor, row.currency), row.currency)}`
                          }
                          amount={formatSignedAmount(
                            isOwe ? -Math.abs(row.signedAmountMinor) : row.signedAmountMinor,
                            row.currency
                          )}
                          amountTone={isOwe ? "negative" : "positive"}
                          onPress={() => handleAttentionPress(row)}
                        />
                      </Fragment>
                    )
                  })}
                </SectionCard>
              </>
            )}

            {data.groupLedger.length > 0 && (
              <>
                <SectionHeading
                  title="Where you stand"
                  meta={`${data.groupLedger.length} circle${data.groupLedger.length !== 1 ? "s" : ""}`}
                />
                <SectionCard>
                  {data.groupLedger.map((row, idx) => (
                    <Fragment key={`group-${row.group.id}`}>
                      {idx > 0 ? <Separator /> : null}
                      <MoneyRow
                        title={row.group.name}
                        subtitle={row.netSignedMinor >= 0 ? "You're owed" : "You owe"}
                        amount={formatSignedAmount(row.netSignedMinor, row.group.currency)}
                        amountTone={row.netSignedMinor >= 0 ? "positive" : "negative"}
                        onPress={() => handleGroupPress(row)}
                      />
                    </Fragment>
                  ))}
                </SectionCard>
              </>
            )}

            {data.nextSchedule && (
              <>
                <SectionHeading title="Next up" meta="Upcoming" />
                <SectionCard>
                  <MoneyRow
                    title={data.nextSchedule.title}
                    subtitle={data.nextSchedule.nextDueLabel ?? "Upcoming"}
                    amount=""
                    amountTone="neutral"
                    onPress={() => handleSchedulePress(data.nextSchedule!.id)}
                  />
                </SectionCard>
              </>
            )}

            {data.recentMovement.length > 0 && (
              <>
                <SectionHeading title="Recent movement" />
                <SectionCard>
                  {data.recentMovement.map((row, idx) => (
                    <Fragment key={`movement-${row.id}`}>
                      {idx > 0 ? <Separator /> : null}
                      <MoneyRow
                        title={row.description}
                        subtitle={row.counterpartyName}
                        amount={formatAmount(row.amount, row.currency)}
                        amountTone={row.type === "expense" ? "negative" : "positive"}
                        onPress={() => handleMovementPress(row)}
                      />
                    </Fragment>
                  ))}
                </SectionCard>
              </>
            )}
          </>
        )}
      </ScrollView>
    </CoralScreen>
  )
}
