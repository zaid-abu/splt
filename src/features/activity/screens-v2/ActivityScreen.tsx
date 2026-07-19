import type { JSX } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { Receipt, ArrowLeftRight, UserPlus, Users, Calendar, House, Bell, Bolt, Search } from "lucide-react-native";

import { useActivity } from "@/features/activity/hooks/useActivity";
import type { ActivitySection, UpcomingRow } from "@/features/activity/hooks/useActivity";
import { formatAmount } from "@/components/ui/AmountDisplay";
import {
  CoralScreen,
  CoralTopBar,
  CoralSegment,
  CoralSearchField,
  MoneyRow,
  EmptyState,
} from "@/components/coral";
import { useCoralColors } from "@/components/coral/useCoral";
import type { Activity as ActivityType } from "@/types";

function LoadingState() {
  const coral = useCoralColors();
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontFamily: "InstrumentSans_400Regular", fontSize: 15, color: coral.muted }}>
        Loading activity…
      </Text>
    </View>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  const coral = useCoralColors();
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 16 }}>
      <Text style={{ fontFamily: "InstrumentSans_600SemiBold", fontSize: 18, color: coral.foreground }}>
        Something went wrong
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Tap to retry"
        onPress={onRetry}
        style={({ pressed }) => ({ opacity: pressed ? 0.65 : 1 })}
      >
        <Text style={{ fontFamily: "InstrumentSans_600SemiBold", fontSize: 15, color: coral.accent }}>
          Tap to retry
        </Text>
      </Pressable>
    </View>
  );
}

function TimelineEmptyState() {
  return (
    <EmptyState
      title="No activity found"
      subtitle="Expenses and settlements will appear here as you use Splt."
    />
  );
}

function UpcomingEmptyState() {
  return (
    <EmptyState
      title="Nothing upcoming"
      subtitle="Scheduled bills and reminders will appear here when you create them."
    />
  );
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
        marginTop: 20,
        marginBottom: 8,
        marginHorizontal: 2,
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

function ContentCard({ children }: { children: React.ReactNode }) {
  const coral = useCoralColors();
  return (
    <View
      style={{
        overflow: "hidden",
        borderWidth: 1,
        borderColor: coral.border,
        borderRadius: 16,
        backgroundColor: coral.surface,
      }}
    >
      {children}
    </View>
  );
}

function ActivityBadge({ type }: { type: ActivityType["type"] }) {
  const coral = useCoralColors();
  const config = {
    expense: { icon: Receipt, bg: coral.accentSoft, color: coral.accentInk },
    settlement: { icon: ArrowLeftRight, bg: coral.positiveSoft, color: "#075d35" },
    member_joined: { icon: UserPlus, bg: coral.avatarSoft, color: coral.avatarInk },
    group_created: { icon: Users, bg: coral.avatarSoft, color: coral.avatarInk },
  }[type];

  const Icon = config.icon;
  return (
    <View
      style={{
        width: 42,
        height: 42,
        borderRadius: 14,
        backgroundColor: config.bg,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon size={20} color={config.color} strokeWidth={1.8} />
    </View>
  );
}

function UpcomingBadge({ icon }: { icon: UpcomingRow["icon"] }) {
  const coral = useCoralColors();
  const config = {
    calendar: { icon: Calendar, bg: coral.warningSoft, color: coral.warning },
    home: { icon: House, bg: coral.avatarSoft, color: coral.avatarInk },
    bell: { icon: Bell, bg: coral.accentSoft, color: coral.accentInk },
    receipt: { icon: Receipt, bg: coral.positiveSoft, color: "#075d35" },
    bolt: { icon: Bolt, bg: coral.warningSoft, color: coral.warning },
  }[icon];

  const Icon = config.icon;
  return (
    <View
      style={{
        width: 42,
        height: 42,
        borderRadius: 14,
        backgroundColor: config.bg,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon size={20} color={config.color} strokeWidth={1.8} />
    </View>
  );
}

function AmountPill({ value, tone }: { value: string; tone?: "neutral" | "positive" | "negative" | "warning" }) {
  const coral = useCoralColors();
  const colorMap = {
    neutral: { text: coral.muted, bg: coral.border },
    positive: { text: "#075d35", bg: coral.positiveSoft },
    negative: { text: coral.negative, bg: coral.negativeSoft },
    warning: { text: coral.warning, bg: coral.warningSoft },
  };
  const colors = colorMap[tone ?? "neutral"];

  return (
    <View
      style={{
        minHeight: 30,
        paddingHorizontal: 9,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: colors.bg,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          fontFamily: "IBMPlexMono_600SemiBold",
          fontSize: 11,
          lineHeight: 14,
          color: colors.text,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

function TimelineRowDivider() {
  const coral = useCoralColors();
  return (
    <View
      style={{
        height: 1,
        backgroundColor: coral.border,
        opacity: 0.55,
        marginLeft: 65,
      }}
    />
  );
}

function TimelineRow({ activity }: { activity: ActivityType }) {
  const coral = useCoralColors();

  if (activity.type === "expense" && activity.expense) {
    const expense = activity.expense;
    const time = new Date(activity.date).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    const groupName = activity.group?.name ?? "";
    const detail = `${time} - You paid $${expense.amount}${groupName ? ` - ${groupName}` : ""}`;
    const lent = expense.amount - (expense.splits?.find((s) => s.userId === activity.userId)?.amount ?? 0);
    return (
      <View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 11,
            minHeight: 64,
            paddingHorizontal: 12,
            paddingVertical: 10,
          }}
        >
          <ActivityBadge type="expense" />
          <View style={{ minWidth: 0, flex: 1 }}>
            <Text
              numberOfLines={1}
              style={{
                fontFamily: "InstrumentSans_600SemiBold",
                fontSize: 14,
                color: coral.foreground,
              }}
            >
              {expense.title}
            </Text>
            <Text
              numberOfLines={1}
              style={{
                fontFamily: "InstrumentSans_400Regular",
                fontSize: 12,
                lineHeight: 16,
                color: coral.muted,
                marginTop: 3,
              }}
            >
              {detail}
            </Text>
          </View>
          <AmountPill value={`+$${lent} lent`} tone="positive" />
        </View>
        <TimelineRowDivider />
      </View>
    );
  }

  if (activity.type === "settlement" && activity.settlement) {
    const settlement = activity.settlement;
    const time = new Date(activity.date).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    const groupName = activity.group?.name ?? "";
    const detail = `${time} - ${groupName}${settlement.method ? ` - ${settlement.method}` : ""}`;
    return (
      <View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 11,
            minHeight: 64,
            paddingHorizontal: 12,
            paddingVertical: 10,
          }}
        >
          <ActivityBadge type="settlement" />
          <View style={{ minWidth: 0, flex: 1 }}>
            <Text
              numberOfLines={1}
              style={{
                fontFamily: "InstrumentSans_600SemiBold",
                fontSize: 14,
                color: coral.foreground,
              }}
            >
              {activity.description}
            </Text>
            <Text
              numberOfLines={1}
              style={{
                fontFamily: "InstrumentSans_400Regular",
                fontSize: 12,
                lineHeight: 16,
                color: coral.muted,
                marginTop: 3,
              }}
            >
              {detail}
            </Text>
          </View>
          <AmountPill value="Recorded" tone="neutral" />
        </View>
        <TimelineRowDivider />
      </View>
    );
  }

  const time = new Date(activity.date).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const badgeType = activity.type === "member_joined" ? "member_joined" : "group_created";
  const userContext = activity.user?.name ?? "";
  const detail = `${time} - ${userContext ? `${userContext} ` : ""}${activity.description}`;
  return (
    <View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 11,
          minHeight: 64,
          paddingHorizontal: 12,
          paddingVertical: 10,
        }}
      >
        <ActivityBadge type={badgeType} />
        <View style={{ minWidth: 0, flex: 1 }}>
          <Text
            numberOfLines={1}
            style={{
              fontFamily: "InstrumentSans_600SemiBold",
              fontSize: 14,
              color: coral.foreground,
            }}
          >
            {activity.description}
          </Text>
          <Text
            numberOfLines={1}
            style={{
              fontFamily: "InstrumentSans_400Regular",
              fontSize: 12,
              lineHeight: 16,
              color: coral.muted,
              marginTop: 3,
            }}
          >
            {detail}
          </Text>
        </View>
        <AmountPill value="Group event" tone="neutral" />
      </View>
      <TimelineRowDivider />
    </View>
  );
}

function TimelineSection({ section }: { section: ActivitySection<ActivityType> }) {
  return (
    <View>
      <SectionHeading title={section.title} meta={section.meta} />
      <ContentCard>
        {section.data.map((activity) => (
          <TimelineRow key={activity.id} activity={activity} />
        ))}
      </ContentCard>
    </View>
  );
}

function UpcomingRowItem({ row }: { row: UpcomingRow }) {
  const coral = useCoralColors();
  return (
    <View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 11,
          minHeight: 64,
          paddingHorizontal: 12,
          paddingVertical: 10,
        }}
      >
        <UpcomingBadge icon={row.icon} />
        <View style={{ minWidth: 0, flex: 1 }}>
          <Text
            numberOfLines={1}
            style={{
              fontFamily: "InstrumentSans_600SemiBold",
              fontSize: 14,
              color: coral.foreground,
            }}
          >
            {row.title}
          </Text>
          <Text
            numberOfLines={1}
            style={{
              fontFamily: "InstrumentSans_400Regular",
              fontSize: 12,
              lineHeight: 16,
              color: coral.muted,
              marginTop: 3,
            }}
          >
            {row.detail}
          </Text>
        </View>
        {row.value ? <AmountPill value={row.value} tone={row.tone} /> : null}
      </View>
      <TimelineRowDivider />
    </View>
  );
}

function UpcomingSection({ section }: { section: ActivitySection<UpcomingRow> }) {
  return (
    <View>
      <SectionHeading title={section.title} meta={section.meta} />
      <ContentCard>
        {section.data.map((row) => (
          <UpcomingRowItem key={row.id} row={row} />
        ))}
      </ContentCard>
    </View>
  );
}

export default function ActivityScreen(): JSX.Element {
  const {
    isError,
    refetch,
    isAppLoading,
    searchQuery,
    setSearchQuery,
    selectedTab,
    setSelectedTab,
    groupedActivities,
    upcomingSections,
  } = useActivity();

  if (isError) {
    return (
      <CoralScreen scroll={false}>
        <ErrorState onRetry={() => refetch()} />
      </CoralScreen>
    );
  }

  if (isAppLoading && groupedActivities.length === 0 && upcomingSections.length === 0) {
    return (
      <CoralScreen scroll={false}>
        <LoadingState />
      </CoralScreen>
    );
  }

  const totalTimeline = groupedActivities.reduce((sum, s) => sum + s.data.length, 0);
  const totalUpcoming = upcomingSections.reduce((sum, s) => sum + s.data.length, 0);

  return (
    <CoralScreen>
      <CoralTopBar title="Activity" />

      <View style={{ marginTop: 24, marginBottom: 6 }}>
        <Text
          style={{
            fontFamily: "InstrumentSans_400Regular",
            fontSize: 12,
            fontWeight: "700",
            color: "#536272",
            marginBottom: 4,
          }}
        >
          What changed
        </Text>
        <Text
          style={{
            fontFamily: "InstrumentSans_600SemiBold",
            fontSize: 30,
            letterSpacing: -0.035 * 30,
            lineHeight: 30 * 1.08,
            color: "#101b29",
          }}
        >
          Everything that moved.
        </Text>
      </View>

      <CoralSegment
        options={[
          { label: "Timeline", value: "timeline" },
          { label: "Upcoming", value: "upcoming" },
        ]}
        selected={selectedTab}
        onSelect={(value) => setSelectedTab(value as "timeline" | "upcoming")}
      />

      <CoralSearchField
        value={searchQuery}
        onChangeText={setSearchQuery}
        onClear={() => setSearchQuery("")}
        placeholder="Search activity"
        style={{ marginTop: 14, marginBottom: 4 }}
      />

      {selectedTab === "timeline" ? (
        totalTimeline === 0 ? (
          <TimelineEmptyState />
        ) : (
          groupedActivities.map((section) => (
            <TimelineSection key={section.title} section={section} />
          ))
        )
      ) : totalUpcoming === 0 ? (
        <UpcomingEmptyState />
      ) : (
        upcomingSections.map((section) => (
          <UpcomingSection key={section.title} section={section} />
        ))
      )}
    </CoralScreen>
  );
}
