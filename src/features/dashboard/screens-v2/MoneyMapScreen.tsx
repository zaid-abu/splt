import { useCallback, Fragment, useState } from "react";
import type { JSX } from "react";
import { View, Text, ActivityIndicator, Pressable, RefreshControl, ScrollView } from "react-native";
import { Bell, CircleUserRound } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";

import { useAuth } from "@/context/AppContext";
import { useHomeSnapshot } from "@/features/dashboard/hooks/useHomeSnapshot";
import { formatAmount } from "@/components/ui/AmountDisplay";
import { minorToMajor } from "@/features/money/splits";
import { useUIStore } from "@/store/useUIStore";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { getGreeting } from "@/utils/date";
import {
  CoralScreen,
  CoralTopBar,
  BalanceHero,
  MoneyRow,
  CoralButton,
  useCoralColors,
} from "@/components/coral";
import type { CircleRow } from "@/features/dashboard/hooks/useHomeSnapshot";

function formatSignedAmount(amountMinor: number, currencyCode: string): string {
  const major = minorToMajor(amountMinor, currencyCode);
  if (major > 0) return `+${formatAmount(major, currencyCode)}`;
  return formatAmount(major, currencyCode);
}

function getFormattedDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function SectionHeading({ title, meta }: { title: string; meta?: string }) {
  const coral = useCoralColors();
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
  );
}

function SectionCard({ children }: { children: React.ReactNode }) {
  const coral = useCoralColors();
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
  );
}

function Separator() {
  const coral = useCoralColors();
  return (
    <View
      style={{
        height: 1,
        backgroundColor: coral.border,
        marginLeft: 58,
      }}
    />
  );
}

export default function MoneyMapScreen(): JSX.Element | null {
  const router = useRouter();
  const { currentUser } = useAuth();
  const snapshot = useHomeSnapshot(currentUser?.id ?? "");
  const coral = useCoralColors();
  const storeCurrency = useUIStore((s) => s.preferredCurrency);
  const [showSettled, setShowSettled] = useState(false);

  const onRefresh = useCallback(() => {
    void snapshot.refresh();
  }, [snapshot.refresh]);

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
              marginTop: 8,
            }}
          >
            Tap to retry
          </Text>
        </View>
      </CoralScreen>
    );
  }

  if (snapshot.isInitialLoading) {
    return (
      <CoralScreen scroll={false}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={coral.muted} />
        </View>
      </CoralScreen>
    );
  }

  if (!snapshot.data) {
    return null;
  }

  const data = snapshot.data;
  const notificationCount = data.notifications.length;
  const greeting = getGreeting();
  const userName = currentUser?.name?.split(" ")[0] ?? "there";
  const preferredCurrency = storeCurrency.code;

  const unsettledCircles = data.circleBalances.filter((c) => c.netSignedMinor !== 0);
  const settledCircles = data.circleBalances.filter((c) => c.netSignedMinor === 0);
  const visibleCircles = showSettled ? data.circleBalances : unsettledCircles;

  const netSigned = data.circleBalances.reduce((sum, c) => sum + c.netSignedMinor, 0);
  const netSignedMajor = minorToMajor(netSigned, preferredCurrency);

  function handleCirclePress(row: CircleRow) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (row.type === "group") {
      router.push(`/group/${row.id}`);
    } else {
      router.push(`/friend/${row.id}`);
    }
  }

  function handleSchedulePress(id: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/recurring/${id}`);
  }

  const heroValue =
    netSignedMajor >= 0
      ? `+${formatAmount(netSignedMajor, preferredCurrency)}`
      : formatAmount(netSignedMajor, preferredCurrency);

  let heroNote = "All settled up across your circles";
  if (netSignedMajor > 0) {
    heroNote = "Overall, you are owed money";
  } else if (netSignedMajor < 0) {
    heroNote = "Overall, you owe money";
  }

  const attentionCount = data.attentionRows.length;
  const scheduleCount = data.nextSchedule ? 1 : 0;

  let introText = "Everything is up to date across your circles.";
  if (attentionCount > 0 && scheduleCount > 0) {
    introText = `${attentionCount} balance${attentionCount > 1 ? "s" : ""} and ${scheduleCount} bill need attention.`;
  } else if (attentionCount > 0) {
    introText = `${attentionCount} balance${attentionCount > 1 ? "s" : ""} need attention.`;
  } else if (scheduleCount > 0) {
    introText = `1 bill needs attention.`;
  }

  return (
    <CoralScreen contentContainerStyle={{ paddingBottom: 110 }}>
      <CoralTopBar
        leftElement={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open settings"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/more");
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
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/notifications");
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
        {/* Kicker */}
        <Text
          style={{
            fontFamily: "InstrumentSans_700Bold",
            fontSize: 12,
            color: coral.muted,
            marginBottom: 4,
          }}
        >
          {getFormattedDate()}
        </Text>

        {/* Title */}
        <Text
          style={{
            fontFamily: "InstrumentSans_600SemiBold",
            fontSize: 30,
            lineHeight: 34,
            letterSpacing: -0.035 * 30,
            color: coral.foreground,
            marginBottom: 6,
          }}
        >
          {greeting}, {userName}.
        </Text>

        {/* Intro */}
        <Text
          style={{
            fontFamily: "InstrumentSans_400Regular",
            fontSize: 15,
            lineHeight: 20,
            color: coral.muted,
            marginBottom: 18,
          }}
        >
          {introText}
        </Text>

        {snapshot.isStaleOffline ? (
          <View
            style={{
              marginTop: 2,
              marginBottom: 14,
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: coral.border,
              backgroundColor: coral.surface,
            }}
          >
            <Text
              style={{
                fontFamily: "InstrumentSans_600SemiBold",
                fontSize: 13,
                color: coral.foreground,
              }}
            >
              Offline - showing cached data.
            </Text>
          </View>
        ) : null}

        {data.isFirstUse || (data.groupLedger.length === 0 && !data.nextSchedule) ? (
          <View style={{ gap: 12, marginTop: 12 }}>
            <CoralButton
              label="Create Group"
              variant="primary"
              onPress={() => router.push("/group/new")}
            />
            <CoralButton
              label="Add Person"
              variant="secondary"
              onPress={() => router.push("/friend/new")}
            />
            <CoralButton
              label="Add Expense"
              variant="secondary"
              onPress={() => router.push("/expense/new")}
            />
          </View>
        ) : (
          <>
            {/* Hero */}
            <BalanceHero
              label="Across your circles"
              value={heroValue}
              note={heroNote}
            />

            {/* Where you stand section */}
            {visibleCircles.length > 0 && (
              <>
                <SectionHeading
                  title="Where you stand"
                  meta={`${unsettledCircles.length} active`}
                />
                <SectionCard>
                  {visibleCircles.map((row, idx) => {
                    const major = minorToMajor(Math.abs(row.netSignedMinor), preferredCurrency);
                    const absVal = formatAmount(major, preferredCurrency);
                    const isOwed = row.netSignedMinor >= 0;
                    const subtitle = isOwed
                      ? `Owed ${absVal}`
                      : `You owe ${absVal}`;

                    return (
                      <Fragment key={`${row.type}-${row.id}`}>
                        {idx > 0 ? <Separator /> : null}
                        <MoneyRow
                          title={row.name}
                          subtitle={subtitle}
                          amount={formatSignedAmount(row.netSignedMinor, preferredCurrency)}
                          amountTone={isOwed ? "positive" : "negative"}
                          onPress={() => handleCirclePress(row)}
                        />
                      </Fragment>
                    );
                  })}
                </SectionCard>
                {settledCircles.length > 0 && !showSettled && (
                  <Pressable
                    onPress={() => {
                      Haptics.selectionAsync();
                      setShowSettled(true);
                    }}
                    style={({ pressed }) => ({
                      marginTop: 8,
                      paddingVertical: 12,
                      alignItems: "center",
                      opacity: pressed ? 0.65 : 1,
                    })}
                  >
                    <Text
                      style={{
                        fontFamily: "InstrumentSans_600SemiBold",
                        fontSize: 14,
                        color: coral.accent,
                      }}
                    >
                      Show settled circles ({settledCircles.length})
                    </Text>
                  </Pressable>
                )}
                {showSettled && settledCircles.length > 0 && (
                  <Pressable
                    onPress={() => {
                      Haptics.selectionAsync();
                      setShowSettled(false);
                    }}
                    style={({ pressed }) => ({
                      marginTop: 8,
                      paddingVertical: 12,
                      alignItems: "center",
                      opacity: pressed ? 0.65 : 1,
                    })}
                  >
                    <Text
                      style={{
                        fontFamily: "InstrumentSans_600SemiBold",
                        fontSize: 14,
                        color: coral.muted,
                      }}
                    >
                      Hide settled circles
                    </Text>
                  </Pressable>
                )}
              </>
            )}

            {/* Next up section */}
            {data.nextSchedule && (
              <>
                <SectionHeading title="Next up" meta="Upcoming" />
                <SectionCard>
                  <MoneyRow
                    title={data.nextSchedule.title}
                    subtitle={data.nextSchedule.nextDueLabel ?? "Review soon"}
                    amount="Review"
                    amountTone="neutral"
                    onPress={() => handleSchedulePress(data.nextSchedule!.id)}
                  />
                </SectionCard>
              </>
            )}
          </>
        )}
      </ScrollView>
    </CoralScreen>
  );
}
