import { useCallback, useState, type ReactNode } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { UserPlus } from "lucide-react-native";

import { formatAmount } from "@/components/ui/AmountDisplay";
import { GroupIconBadge } from "@/components/ui/GroupIconBadge";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import {
  CoralButton,
  CoralScreen,
  CoralSearchField,
  CoralSegment,
  CoralTopBar,
  Eyebrow,
  LargeTitle,
  MoneyRow,
} from "@/components/coral";
import { useUI } from "@/components/ui";
import { useAuth } from "@/context/AppContext";
import {
  useCirclesSnapshot,
  type GroupSection,
  type PersonSection,
  type RequestItem,
} from "@/features/circles/hooks/useCirclesSnapshot";
import { parseCircleSegment, type CircleSegment } from "@/features/navigation/shell";
import { useTransitionFriendship } from "@/features/friends/queries/useFriends";

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

function groupSubtitle(section: GroupSection): string {
  const { group, balance } = section;
  if (balance === null || balance.signedAmountMinor === 0) {
    return `${group.members.length} people · Settled`;
  }
  const absMajor = Math.abs(balance.signedAmountMinor) / 100;
  const formatted = formatAmount(absMajor, balance.currency);
  if (balance.signedAmountMinor > 0) {
    return `${group.members.length} people · You are owed ${formatted}`;
  }
  return `${group.members.length} people · You owe ${formatted}`;
}

function groupAmount(section: GroupSection): {
  text: string;
  tone: "neutral" | "positive" | "negative";
} {
  const { balance } = section;
  if (balance === null || balance.signedAmountMinor === 0) {
    return { text: "Settled", tone: "neutral" };
  }
  const major = balance.signedAmountMinor / 100;
  return {
    text: signedAmount(major, balance.currency),
    tone: major > 0 ? "positive" : "negative",
  };
}

function personSubtitle(section: PersonSection): string {
  const { user, classification, topBalance } = section;
  if (classification === "mixed") return "Mixed balance";
  if ((classification === "owes-you" || classification === "you-owe") && topBalance) {
    const absMajor = Math.abs(topBalance.signedAmountMinor) / 100;
    const formatted = formatAmount(absMajor, topBalance.currency);
    const firstName = user.name.split(" ")[0];
    if (classification === "owes-you") return `${firstName} owes you ${formatted}`;
    return `You owe ${firstName} ${formatted}`;
  }
  return "Settled";
}

function personAmount(section: PersonSection): {
  text: string;
  tone: "neutral" | "positive" | "negative";
} {
  const { classification, topBalance } = section;
  if (classification === "settled" || !topBalance || topBalance.signedAmountMinor === 0) {
    return { text: "Settled", tone: "neutral" };
  }
  const major = topBalance.signedAmountMinor / 100;
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
  const { color } = useUI();
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

  return (
    <CoralScreen>
      <CoralTopBar title="Circles" />
      <LargeTitle>Your circles.</LargeTitle>
      <Text
        style={{
          fontFamily: "InstrumentSans_400Regular",
          fontSize: 15,
          lineHeight: 22,
          color: color.muted,
          marginBottom: 16,
        }}
      >
        Groups and people with shared money.
      </Text>

      <CoralSegment
        options={[...SEGMENTS]}
        selected={segment}
        onSelect={(value) => selectSegment(value as CircleSegment)}
      />

      <CoralSearchField
        value={search}
        onChangeText={setSearch}
        onClear={() => setSearch("")}
        placeholder={placeholder}
        style={{ marginTop: 14, marginBottom: 8 }}
      />

      {snapshot.isInitialLoading ? (
        <CenteredState>
          <ActivityIndicator color={color.text} accessibilityLabel={`Loading ${segment}`} />
        </CenteredState>
      ) : snapshot.isError && !snapshot.data ? (
        <CenteredState>
          <Text
            style={{
              fontFamily: "InstrumentSans_600SemiBold",
              fontSize: 18,
              color: color.text,
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
              color: color.muted,
            }}
          >
            {segment === "groups" ? "No groups yet." : "No people yet."}
          </Text>
        </CenteredState>
      ) : segment === "groups" ? (
        <>
          {pendingRequests.length > 0 && (
            <RequestsSection
              requests={pendingRequests}
              onAccept={handleAccept}
              onDecline={handleDecline}
            />
          )}

          {needsAttentionGroupSections && needsAttentionGroupSections.length > 0 && (
            <>
              <Eyebrow>Needs attention</Eyebrow>
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
            </>
          )}

          {allGroupSections && allGroupSections.length > 0 && (
            <>
              <Eyebrow>All groups</Eyebrow>
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
            </>
          )}

          {hasSearch && !needsAttentionGroupSections?.length && !allGroupSections?.length && (
            <CenteredState>
              <Text
                style={{
                  fontFamily: "InstrumentSans_400Regular",
                  fontSize: 15,
                  color: color.muted,
                }}
              >
                No groups match your search.
              </Text>
            </CenteredState>
          )}
        </>
      ) : (
        <>
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
                <Eyebrow>{CLASSIFICATION_LABELS[classification]}</Eyebrow>
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
                    color: color.muted,
                  }}
                >
                  No people match your search.
                </Text>
              </CenteredState>
            )}
        </>
      )}

      <View style={{ marginTop: 20 }}>
        <CoralButton
          label={segment === "groups" ? "Create group" : "Add person"}
          variant="secondary"
          onPress={() => router.push(segment === "groups" ? "/group/new" : "/friend/new")}
        />
      </View>
    </CoralScreen>
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
  const { color } = useUI();

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
        <UserPlus size={16} color={color.muted} />
        <Text
          style={{
            fontFamily: "InstrumentSans_600SemiBold",
            fontSize: 14,
            letterSpacing: 0.14,
            color: color.muted,
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
            minHeight: 68,
            paddingVertical: 10,
            paddingHorizontal: 2,
            gap: 12,
          }}
        >
          <AppUserAvatar user={req.user} size="sm" />
          <View style={{ minWidth: 0, flex: 1 }}>
            <Text
              numberOfLines={1}
              style={{
                fontFamily: "InstrumentSans_600SemiBold",
                fontSize: 16,
                letterSpacing: -0.08,
                color: color.text,
              }}
            >
              {req.user.name}
            </Text>
            <Text
              numberOfLines={1}
              style={{
                fontFamily: "InstrumentSans_400Regular",
                fontSize: 13,
                lineHeight: 18.85,
                color: color.muted,
                marginTop: 3,
              }}
            >
              Wants to be friends
            </Text>
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <View style={{ width: 90 }}>
              <CoralButton
                label="Accept"
                variant="primary"
                onPress={() => onAccept(req.friendship.id)}
              />
            </View>
            <View style={{ width: 90 }}>
              <CoralButton
                label="Decline"
                variant="secondary"
                onPress={() => onDecline(req.friendship.id)}
              />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}
