import { useCallback, useState, type JSX, type ReactNode } from "react";
import { ActivityIndicator, Text, View, Pressable } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useLocalSearchParams, useRouter } from "expo-router";
import { UserPlus, Plus, UsersRound } from "lucide-react-native";

import { formatAmount } from "@/components/ui/AmountDisplay";
import { minorToMajor } from "@/features/money/splits";
import { GroupIconBadge } from "@/components/ui/GroupIconBadge";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import {
  CoralButton,
  CoralScreen,
  CoralSearchField,
  CoralSegment,
  CoralTopBar,
  CoralSheet,
  LargeTitle,
  MoneyRow,
  useCoralColors,
} from "@/components/coral";
import { useAuth } from "@/context/AppContext";
import {
  useCirclesSnapshot,
  type GroupSection,
  type PersonSection,
  type RequestItem,
} from "@/features/circles/hooks/useCirclesSnapshot";
import { parseCircleSegment, GLOBAL_ACTIONS, type CircleSegment } from "@/features/navigation/shell";
import { useTransitionFriendship } from "@/features/friends/queries/useFriends";
import { formatActivityDate } from "@/utils/date";

const SEGMENTS = [
  { label: "Groups", value: "groups" },
  { label: "People", value: "people" },
] as const;

const ZERO_DECIMAL_CURRENCIES = new Set(["JPY", "KRW", "VND", "IDR"]);

function CenteredState({ children }: { children: ReactNode }) {
  return (
    <View style={{ minHeight: 280, alignItems: "center", justifyContent: "center", gap: 14 }}>
      {children}
    </View>
  );
}

function signedAmount(amountMajor: number, currency: string): string {
  const abs = Math.abs(amountMajor);
  const isZeroDecimal = ZERO_DECIMAL_CURRENCIES.has(currency);
  const formatted = abs.toLocaleString("en-US", {
    minimumFractionDigits: isZeroDecimal ? 0 : 2,
    maximumFractionDigits: isZeroDecimal ? 0 : 2,
  });
  if (amountMajor > 0) return `+${currency} ${formatted}`;
  if (amountMajor < 0) return `-${currency} ${formatted}`;
  return `${currency} ${isZeroDecimal ? "0" : "0.00"}`;
}

function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

function groupSubtitle(section: GroupSection): string {
  const { group, balance } = section;
  if (balance === null || balance.signedAmountMinor === 0) {
    return `${pluralize(group.members.length, "person", "people")} - no open balances`;
  }
  return `${pluralize(group.members.length, "person", "people")} - active ${formatActivityDate(balance.lastActivityAt).toLowerCase()}`;
}

function groupAmount(section: GroupSection): {
  text: string;
  tone: "neutral" | "positive" | "negative";
} {
  const { balance } = section;
  if (balance === null || balance.signedAmountMinor === 0) {
    return { text: "Settled", tone: "neutral" };
  }
  const major = minorToMajor(balance.signedAmountMinor, balance.currency);
  return {
    text: signedAmount(major, balance.currency),
    tone: major > 0 ? "positive" : "negative",
  };
}

function personSubtitle(section: PersonSection): string {
  const { user, classification, topBalance, sharedGroupCount, topBalanceContextLabel, lastActivityAt } = section;
  if (classification === "mixed") return "Mixed balance";
  const activityLabel = lastActivityAt ? ` - active ${formatActivityDate(lastActivityAt).toLowerCase()}` : "";
  if ((classification === "owes-you" || classification === "you-owe") && topBalance) {
    const absMajor = minorToMajor(Math.abs(topBalance.signedAmountMinor), topBalance.currency);
    const formatted = formatAmount(absMajor, topBalance.currency);
    const firstName = user.name.split(" ")[0];
    if (classification === "owes-you") {
      if (sharedGroupCount > 1) {
        return `${firstName} owes you across ${pluralize(sharedGroupCount, "group", "groups")}${activityLabel}`;
      }
      return topBalanceContextLabel
        ? `${firstName} owes you from ${topBalanceContextLabel}${activityLabel}`
        : `${firstName} owes you ${formatted}${activityLabel}`;
    }
    if (sharedGroupCount > 1) {
      return `You owe across ${pluralize(sharedGroupCount, "group", "groups")}${activityLabel}`;
    }
    return topBalanceContextLabel
      ? `You owe from ${topBalanceContextLabel}${activityLabel}`
      : `You owe ${firstName} ${formatted}${activityLabel}`;
  }
  if (sharedGroupCount > 1) return `${pluralize(sharedGroupCount, "shared group", "shared groups")} - settled`;
  return `Settled${activityLabel}`;
}

function personAmount(section: PersonSection): {
  text: string;
  tone: "neutral" | "positive" | "negative";
} {
  const { classification, topBalance } = section;
  if (classification === "settled" || !topBalance || topBalance.signedAmountMinor === 0) {
    return { text: "Settled", tone: "neutral" };
  }
  const major = minorToMajor(topBalance.signedAmountMinor, topBalance.currency);
  return {
    text: signedAmount(major, topBalance.currency),
    tone: major > 0 ? "positive" : "negative",
  };
}

const CLASSIFICATION_LABELS: Record<string, string> = {
  "owes-you": "Owes you",
  mixed: "Mixed",
  "you-owe": "You owe",
  settled: "Settled",
};

const CLASSIFICATION_ORDER = ["owes-you", "mixed", "you-owe", "settled"] as const;

export default function CirclesScreen(): JSX.Element {
  const params = useLocalSearchParams<{ segment?: string | string[] }>();
  const router = useRouter();
  const coral = useCoralColors();
  const { currentUser } = useAuth();
  const segment = parseCircleSegment(params.segment);

  const [groupSearch, setGroupSearch] = useState("");
  const [peopleSearch, setPeopleSearch] = useState("");

  const search = segment === "groups" ? groupSearch : peopleSearch;
  const setSearch = segment === "groups" ? setGroupSearch : setPeopleSearch;
  const placeholder = segment === "groups" ? "Search groups" : "Search people";

  const snapshot = useCirclesSnapshot(currentUser.id, search);
  const { mutateAsync: transitionFriendship } = useTransitionFriendship();

  const selectSegment = (next: CircleSegment) => {
    router.setParams({ segment: next });
  };

  const retry = () => {
    snapshot.refresh();
  };

  const handleAccept = useCallback(
    async (friendshipId: string) => {
      try {
        await transitionFriendship({ counterpartyId: friendshipId, action: "accept" });
      } catch {
        /* silently ignored */
      }
    },
    [transitionFriendship]
  );

  const handleDecline = useCallback(
    async (friendshipId: string) => {
      try {
        await transitionFriendship({ counterpartyId: friendshipId, action: "decline" });
      } catch {
        /* silently ignored */
      }
    },
    [transitionFriendship]
  );

  const needsAttentionGroupSections = snapshot.data?.groupSections.filter(
    (s) => s.balance !== null && s.balance.signedAmountMinor !== 0
  );
  const allGroupSections = snapshot.data?.groupSections.filter(
    (s) => s.balance === null || s.balance.signedAmountMinor === 0
  );

  const hasData =
    (needsAttentionGroupSections && needsAttentionGroupSections.length > 0) ||
    (allGroupSections && allGroupSections.length > 0) ||
    (snapshot.data?.personSections && snapshot.data.personSections.length > 0) ||
    (snapshot.data?.pendingRequests && snapshot.data.pendingRequests.length > 0);

  const hasSearch = search.trim().length > 0;

  const pendingRequests = snapshot.data?.pendingRequests ?? [];

  const [addSheetVisible, setAddSheetVisible] = useState(false);

  return (
    <CoralScreen contentContainerStyle={{ paddingBottom: 110 }}>
      <CoralTopBar
        title="Circles"
        rightElement={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add group or person"
            onPress={() => setAddSheetVisible(true)}
            style={{ width: 48, height: 48, alignItems: "center", justifyContent: "center" }}
          >
            <Plus size={24} color={coral.foreground} strokeWidth={1.8} />
          </Pressable>
        }
      />
      <Text
        style={{
          fontFamily: "InstrumentSans_600SemiBold",
          fontSize: 12,
          letterSpacing: 0.08 * 12,
          color: coral.muted,
          marginTop: 4,
          marginBottom: 8,
        }}
      >
        Your network
      </Text>
      <LargeTitle style={{ marginTop: 0, marginBottom: 8 }}>Circles</LargeTitle>

      <CoralSegment
        options={[...SEGMENTS]}
        selected={segment}
        onSelect={(value) => selectSegment(value as CircleSegment)}
        style={{ marginBottom: 12 }}
      />

      <CoralSearchField
        value={search}
        onChangeText={setSearch}
        onClear={() => setSearch("")}
        placeholder={placeholder}
        style={{ marginTop: 0, marginBottom: 16 }}
      />

      {snapshot.isInitialLoading ? (
        <CenteredState>
          <ActivityIndicator color={coral.foreground} accessibilityLabel={`Loading ${segment}`} />
        </CenteredState>
      ) : snapshot.isError && !snapshot.data ? (
        <CenteredState>
          <Text
            style={{
              fontFamily: "InstrumentSans_600SemiBold",
              fontSize: 18,
              color: coral.foreground,
            }}
          >
            Could not load {segment}.
          </Text>
          <CoralButton label="Try again" variant="secondary" onPress={retry} />
        </CenteredState>
      ) : !hasData && !hasSearch ? (
        <CenteredState>
          <Text
              style={{
                fontFamily: "InstrumentSans_400Regular",
                fontSize: 15,
                color: coral.muted,
              }}
            >
              {segment === "groups" ? "No groups yet." : "No people yet."}
          </Text>
        </CenteredState>
      ) : segment === "groups" ? (
        <Animated.View key="groups" entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)}>
          {pendingRequests.length > 0 && (
            <RequestsSection
              requests={pendingRequests}
              onAccept={handleAccept}
              onDecline={handleDecline}
            />
          )}

          {needsAttentionGroupSections && needsAttentionGroupSections.length > 0 && (
            <>
              <SectionHeading
                title="Needs attention"
                meta={String(needsAttentionGroupSections.length)}
              />
              <ContentList>
                {needsAttentionGroupSections.map((section) => {
                  const { text: amountText, tone } = groupAmount(section);
                  return (
                    <MoneyRow
                      key={section.group.id}
                      avatar={<GroupIconBadge group={section.group} size="sm" />}
                      title={section.group.name}
                      subtitle={groupSubtitle(section)}
                      amount={amountText}
                      amountTone={tone}
                      onPress={() =>
                        router.push({ pathname: "/group/[id]", params: { id: section.group.id } })
                      }
                    />
                  );
                })}
              </ContentList>
            </>
          )}

          {allGroupSections && allGroupSections.length > 0 && (
            <>
              <SectionHeading
                title="All groups"
                meta={`${allGroupSections.length} groups`}
              />
              <ContentList>
                {allGroupSections.map((section) => {
                  const { text: amountText, tone } = groupAmount(section);
                  return (
                    <MoneyRow
                      key={section.group.id}
                      avatar={<GroupIconBadge group={section.group} size="sm" />}
                      title={section.group.name}
                      subtitle={groupSubtitle(section)}
                      amount={amountText}
                      amountTone={tone}
                      onPress={() =>
                        router.push({ pathname: "/group/[id]", params: { id: section.group.id } })
                      }
                    />
                  );
                })}
              </ContentList>
            </>
          )}

          {hasSearch && !needsAttentionGroupSections?.length && !allGroupSections?.length && (
            <CenteredState>
              <Text
              style={{
                fontFamily: "InstrumentSans_400Regular",
                fontSize: 15,
                color: coral.muted,
              }}
            >
              No groups match your search.
              </Text>
            </CenteredState>
          )}
        </Animated.View>
      ) : (
        <Animated.View key="people" entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)}>
          {pendingRequests.length > 0 && (
            <RequestsSection
              requests={pendingRequests}
              onAccept={handleAccept}
              onDecline={handleDecline}
            />
          )}

          {CLASSIFICATION_ORDER.map((classification) => {
            const rows =
              snapshot.data?.personSections?.filter((s) => s.classification === classification) ??
              [];
            if (rows.length === 0) return null;
            return (
              <View key={classification}>
                <SectionHeading
                  title={CLASSIFICATION_LABELS[classification]}
                  meta={String(rows.length)}
                />
                <ContentList>
                  {rows.map((section) => {
                    const { text: amountText, tone } = personAmount(section);
                    return (
                      <MoneyRow
                        key={section.user.id}
                        avatar={<AppUserAvatar user={section.user} size="sm" />}
                        title={section.user.name}
                        subtitle={personSubtitle(section)}
                        amount={amountText}
                        amountTone={tone}
                        onPress={() =>
                          router.push({ pathname: "/friend/[id]", params: { id: section.user.id } })
                        }
                      />
                    );
                  })}
                </ContentList>
              </View>
            );
          })}

          {hasSearch &&
            (!snapshot.data?.personSections || snapshot.data.personSections.length === 0) && (
              <CenteredState>
                <Text
              style={{
                fontFamily: "InstrumentSans_400Regular",
                fontSize: 15,
                color: coral.muted,
              }}
            >
              No people match your search.
                </Text>
              </CenteredState>
            )}
        </Animated.View>
      )}

      <CoralSheet visible={addSheetVisible} onClose={() => setAddSheetVisible(false)}>
        <View style={{ paddingHorizontal: 18, paddingBottom: 8 }}>
          <Text
            style={{
              fontFamily: "InstrumentSans_600SemiBold",
              fontSize: 22,
              letterSpacing: -0.025 * 22,
              color: coral.foreground,
            }}
          >
            Add to your circles
          </Text>
          <Text
            style={{
              fontFamily: "InstrumentSans_400Regular",
              fontSize: 14,
              lineHeight: 20,
              color: coral.muted,
              marginTop: 6,
              marginBottom: 14,
            }}
          >
            Create a new group or add a person.
          </Text>
          {GLOBAL_ACTIONS.filter((a) => a.id === "create-group" || a.id === "add-person").map((action) => {
            const Icon = action.id === "create-group" ? UsersRound : UserPlus;
            return (
              <Pressable
                key={action.id}
                accessibilityRole="button"
                accessibilityLabel={action.label}
                onPress={() => {
                  setAddSheetVisible(false);
                  router.push(action.href as any);
                }}
                style={({ pressed }) => ({
                  minHeight: 56,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 13,
                  paddingHorizontal: 14,
                  marginBottom: 8,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: coral.border,
                  backgroundColor: coral.surface,
                  opacity: pressed ? 0.68 : 1,
                })}
              >
                <Icon size={22} color={coral.foreground} strokeWidth={1.9} />
                <Text
                  style={{
                    flex: 1,
                    fontFamily: "InstrumentSans_600SemiBold",
                    fontSize: 16,
                    color: coral.foreground,
                  }}
                >
                  {action.label}
                </Text>
              </Pressable>
            );
          })}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={() => setAddSheetVisible(false)}
            style={({ pressed }) => ({
              minHeight: 48,
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.65 : 1,
            })}
          >
            <Text
              style={{
                fontFamily: "InstrumentSans_600SemiBold",
                fontSize: 15,
                color: coral.muted,
              }}
            >
              Close
            </Text>
          </Pressable>
        </View>
      </CoralSheet>
    </CoralScreen>
  );
}

function SectionHeading({ title, meta }: { title: string; meta?: string }) {
  const coral = useCoralColors();

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-end",
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

function ContentList({ children }: { children: ReactNode }) {
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

function RequestsSection({
  requests,
  onAccept,
  onDecline,
}: {
  requests: RequestItem[];
  onAccept: (friendshipId: string) => void;
  onDecline: (friendshipId: string) => void;
}) {
  const coral = useCoralColors();

  return (
    <View style={{ marginBottom: 8 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          marginTop: 28,
          marginBottom: 10,
        }}
      >
        <UserPlus size={16} color={coral.muted} />
        <Text
          style={{
            fontFamily: "InstrumentSans_600SemiBold",
            fontSize: 14,
            letterSpacing: 0.14,
            color: coral.muted,
          }}
        >
          Friend requests
        </Text>
      </View>
      {requests.map((req) => (
        <View
          key={req.friendship.id}
          style={{
            flexDirection: "row",
            alignItems: "center",
            minHeight: 64,
            paddingVertical: 10,
            paddingHorizontal: 12,
            gap: 11,
          }}
        >
          <AppUserAvatar user={req.user} size="sm" />
          <View style={{ minWidth: 0, flex: 1 }}>
            <Text
              numberOfLines={1}
              style={{
                fontFamily: "InstrumentSans_600SemiBold",
                fontSize: 14,
                letterSpacing: -0.01 * 14,
                color: coral.foreground,
              }}
            >
              {req.user.name}
            </Text>
            <Text
              numberOfLines={1}
              style={{
                fontFamily: "InstrumentSans_400Regular",
                fontSize: 12,
                lineHeight: 12 * 1.4,
                color: coral.muted,
                marginTop: 3,
              }}
            >
              Wants to be friends
            </Text>
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Pressable
              accessibilityRole="button"
              onPress={() => onAccept(req.friendship.id)}
              style={({ pressed }) => ({
                backgroundColor: coral.accent,
                borderRadius: 8,
                paddingVertical: 6,
                paddingHorizontal: 12,
                opacity: pressed ? 0.78 : 1,
              })}
            >
              <Text style={{ fontFamily: "InstrumentSans_600SemiBold", fontSize: 13, color: coral.inkOnAccent }}>
                Accept
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => onDecline(req.friendship.id)}
              style={({ pressed }) => ({
                backgroundColor: coral.surface,
                borderWidth: 1,
                borderColor: coral.border,
                borderRadius: 8,
                paddingVertical: 6,
                paddingHorizontal: 12,
                opacity: pressed ? 0.78 : 1,
              })}
            >
              <Text style={{ fontFamily: "InstrumentSans_600SemiBold", fontSize: 13, color: coral.foreground }}>
                Decline
              </Text>
            </Pressable>
          </View>
        </View>
      ))}
    </View>
  );
}
