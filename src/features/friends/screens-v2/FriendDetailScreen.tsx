import type { JSX } from "react";
import { useState, useMemo, useCallback } from "react";
import { View, Text, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { FriendRouteParams } from "@/types/navigation";
import * as Haptics from "expo-haptics";
import { useMutation } from "@tanstack/react-query";

import { usePersonSnapshot } from "@/features/friends/hooks/usePersonSnapshot";
import { useTransitionFriendship } from "@/features/friends/queries/useFriends";
import { notificationsApi } from "@/features/notifications/services/api";
import type { ReminderInput } from "@/features/notifications/services/api";
import { expenseHref, settlementHref, coldBackHref } from "@/features/navigation/phase2Routes";
import type { MoneyContext } from "@/features/money/types";

import { formatAmount } from "@/components/ui/AmountDisplay";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import {
  CoralScreen,
  CoralTopBar,
  MoneyAmount,
  Eyebrow,
  MoneyRow,
  CoralButton,
  CoralSheet,
  CoralField,
} from "@/components/coral";
import { useCoralColors } from "@/components/coral/useCoral";
import { useUI } from "@/components/ui";
import { useAppToast } from "@/hooks/useAppToast";

function formatSignedAmount(amountMinor: number, currencyCode: string): string {
  const whole = Math.abs(amountMinor) / 100;
  const formatted = formatAmount(whole, currencyCode);
  if (amountMinor > 0) return `+${formatted}`;
  if (amountMinor < 0) return `-${formatted}`;
  return formatted;
}

function LoadingState() {
  const { color } = useUI();
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator size="large" color={color.muted} />
    </View>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  const { color } = useUI();
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 16 }}>
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
        onPress={onRetry}
        style={{
          fontFamily: "InstrumentSans_600SemiBold",
          fontSize: 15,
          color: color.brand,
        }}
      >
        Tap to retry
      </Text>
    </View>
  );
}

function NotFoundState({ onGoBack }: { onGoBack: () => void }) {
  const { color } = useUI();
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 16 }}>
      <Text
        style={{
          fontFamily: "InstrumentSans_600SemiBold",
          fontSize: 18,
          color: color.text,
        }}
      >
        Friend not found
      </Text>
      <Text
        onPress={onGoBack}
        style={{
          fontFamily: "InstrumentSans_600SemiBold",
          fontSize: 15,
          color: color.brand,
        }}
      >
        Go back
      </Text>
    </View>
  );
}

interface RemindOption {
  context: MoneyContext;
  currency: string;
  label: string;
}

export default function FriendDetailScreen(): JSX.Element {
  const { id } = useLocalSearchParams<FriendRouteParams>();
  const router = useRouter();
  const { color } = useUI();
  const coral = useCoralColors();
  const { toast } = useAppToast();

  const snapshot = usePersonSnapshot(id);
  const transition = useTransitionFriendship();

  const [remindVisible, setRemindVisible] = useState(false);
  const [selectedRemind, setSelectedRemind] = useState<RemindOption | null>(null);
  const [remindMessage, setRemindMessage] = useState("");

  const { data, isInitialLoading, isError, isNotFound, refresh } = snapshot;

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(coldBackHref("circles-people"));
    }
  }, [router]);

  const balanceByCurrency = useMemo(() => {
    const map = new Map<string, number>();
    for (const b of data?.balances ?? []) {
      map.set(b.currency, (map.get(b.currency) ?? 0) + b.signedAmountMinor);
    }
    return Array.from(map.entries());
  }, [data?.balances]);

  const nonZeroCurrencies = balanceByCurrency.filter(([, v]) => v !== 0);
  const isSettled = nonZeroCurrencies.length === 0;
  const totalOwed = nonZeroCurrencies.length > 0 && nonZeroCurrencies.every(([, a]) => a > 0);
  const totalOwe = nonZeroCurrencies.length > 0 && nonZeroCurrencies.every(([, a]) => a < 0);

  const primaryContext: MoneyContext | undefined =
    data?.friendship?.id ? { type: "direct", friendshipId: data.friendship.id } : undefined;

  const remindOptions = useMemo(() => {
    const seen = new Set<string>();
    return (data?.balances ?? [])
      .filter((b) => b.signedAmountMinor !== 0)
      .filter((b) => {
        const key = `${b.context.type}-${
          b.context.type === "group" ? b.context.groupId : b.context.friendshipId
        }-${b.currency}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((b) => ({
        context: b.context,
        currency: b.currency,
        label: `${
          b.context.type === "group" ? "Group" : "Direct"
        } (${b.currency} ${formatSignedAmount(b.signedAmountMinor, b.currency)})`,
      }));
  }, [data?.balances]);

  const openRemind = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (remindOptions.length === 1) {
      setSelectedRemind(remindOptions[0]);
    } else {
      setSelectedRemind(null);
    }
    setRemindMessage("");
    setRemindVisible(true);
  }, [remindOptions]);

  const sendReminderMutation = useMutation({
    mutationFn: (input: ReminderInput) => notificationsApi.sendReminder(input),
    onSuccess: () => {
      toast.show("Reminder sent");
      setRemindVisible(false);
      setRemindMessage("");
      setSelectedRemind(null);
    },
    onError: () => {
      toast.show("Failed to send reminder");
    },
  });

  const handleSendReminder = useCallback(() => {
    if (!selectedRemind) return;
    sendReminderMutation.mutate({
      clientOperationId: `remind-${Date.now()}`,
      groupId:
        selectedRemind.context.type === "group" ? selectedRemind.context.groupId : undefined,
      friendshipId:
        selectedRemind.context.type === "direct" ? selectedRemind.context.friendshipId : undefined,
      currency: selectedRemind.currency,
      message: remindMessage.trim() || undefined,
    });
  }, [selectedRemind, remindMessage, sendReminderMutation]);

  const handleRemove = useCallback(() => {
    const p = data?.person;
    if (!p) return;
    if (nonZeroCurrencies.length > 0) {
      Alert.alert(
        "Cannot Remove",
        `You have outstanding balances with ${p.name}. Settle up before removing them.`
      );
      return;
    }
    Alert.alert(
      "Remove Friend?",
      `${p.name} will be removed from your friends list. They will remain in shared groups and past activity will be preserved.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            transition.mutate(
              { counterpartyId: id, action: "remove" },
              {
                onSuccess: () => {
                  toast.show("Friend removed");
                  router.back();
                },
                onError: () => {
                  toast.show("Failed to remove friend");
                },
              }
            );
          },
        },
      ]
    );
  }, [data?.person, nonZeroCurrencies, id, transition, router, toast]);

  const handleBlock = useCallback(() => {
    const p = data?.person;
    if (!p) return;
    Alert.alert(
      "Block Friend?",
      `${p.name} will be blocked. They will remain in shared groups and past activity will be preserved. They will not be able to contact you.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Block",
          style: "destructive",
          onPress: () => {
            transition.mutate(
              { counterpartyId: id, action: "block" },
              {
                onSuccess: () => {
                  toast.show("Friend blocked");
                  refresh();
                },
                onError: () => {
                  toast.show("Failed to block friend");
                },
              }
            );
          },
        },
      ]
    );
  }, [data?.person, id, transition, toast, refresh]);

  const handleUnblock = useCallback(() => {
    const p = data?.person;
    if (!p) return;
    Alert.alert(
      "Unblock Friend?",
      `${p.name} will be unblocked and able to contact you again.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unblock",
          onPress: () => {
            transition.mutate(
              { counterpartyId: id, action: "unblock" },
              {
                onSuccess: () => {
                  toast.show("Friend unblocked");
                  refresh();
                },
                onError: () => {
                  toast.show("Failed to unblock friend");
                },
              }
            );
          },
        },
      ]
    );
  }, [data?.person, id, transition, toast, refresh]);

  if (isInitialLoading) {
    return (
      <CoralScreen scroll={false}>
        <LoadingState />
      </CoralScreen>
    );
  }

  if (isError) {
    return (
      <CoralScreen scroll={false}>
        <ErrorState onRetry={refresh} />
      </CoralScreen>
    );
  }

  if (isNotFound || !data) {
    return (
      <CoralScreen scroll={false}>
        <NotFoundState onGoBack={handleBack} />
      </CoralScreen>
    );
  }

  const { person, balances, sharedGroups, activities, permissions } = data;

  const friendName = person.name.split(" ")[0];

  return (
    <CoralScreen>
      <CoralTopBar title={person.name} onBack={handleBack} />

      <View style={{ alignItems: "center", marginTop: 24, marginBottom: 10 }}>
        <AppUserAvatar user={person} size="lg" />
      </View>

      <View style={{ alignItems: "center", marginBottom: 6 }}>
        {isSettled ? (
          <MoneyAmount tone="neutral" size="hero">
            $0.00
          </MoneyAmount>
        ) : nonZeroCurrencies.length === 1 ? (
          <MoneyAmount
            tone={nonZeroCurrencies[0][1] > 0 ? "positive" : "negative"}
            size="hero"
          >
            {formatSignedAmount(nonZeroCurrencies[0][1], nonZeroCurrencies[0][0])}
          </MoneyAmount>
        ) : (
          <View style={{ alignItems: "center", gap: 2 }}>
            {nonZeroCurrencies.map(([ccy, amt]) => (
              <Text
                key={ccy}
                style={{
                  fontFamily: "IBMPlexMono_600SemiBold",
                  fontSize: 18,
                  color: amt > 0 ? coral.positive : coral.negative,
                }}
              >
                {ccy} {formatSignedAmount(amt, ccy)}
              </Text>
            ))}
          </View>
        )}
      </View>

      <Text
        style={{
          fontFamily: "InstrumentSans_400Regular",
          fontSize: 15,
          color: color.muted,
          textAlign: "center",
          lineHeight: 21,
          marginHorizontal: 32,
          marginBottom: 18,
        }}
      >
        {isSettled
          ? `You and ${friendName} are all settled.`
          : totalOwed
            ? `${friendName} owes you.`
            : totalOwe
              ? `You owe ${friendName}.`
              : `You have mixed balances with ${friendName}.`}
      </Text>

      <View style={{ flexDirection: "row", gap: 12, marginBottom: 8 }}>
        <View style={{ flex: 1 }}>
          <CoralButton
            label="Settle up"
            variant="secondary"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push(settlementHref({ context: primaryContext }));
            }}
          />
        </View>
        <View style={{ flex: 1 }}>
          <CoralButton
            label="Add expense"
            variant="secondary"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push(expenseHref(primaryContext));
            }}
          />
        </View>
      </View>

      {remindOptions.length > 0 && (
        <View style={{ marginBottom: 8 }}>
          <CoralButton label="Send reminder" variant="text" onPress={openRemind} />
        </View>
      )}

      {sharedGroups.length > 0 && (
        <>
          <Eyebrow>Together</Eyebrow>
          {sharedGroups.map(({ group, balance }) => (
            <MoneyRow
              key={group.id}
              title={group.name}
              subtitle={`${group.members.length} people`}
              amount={
                balance
                  ? formatSignedAmount(balance.signedAmountMinor, balance.currency)
                  : "$0.00"
              }
              amountTone={
                balance
                  ? balance.signedAmountMinor > 0
                    ? "positive"
                    : balance.signedAmountMinor < 0
                      ? "negative"
                      : "neutral"
                  : "neutral"
              }
              onPress={() => router.push(`/group/${group.id}`)}
            />
          ))}
        </>
      )}

      {activities.length > 0 && (
        <>
          <Eyebrow>History</Eyebrow>
          {activities.slice(0, 10).map((activity) => {
            if (activity.type === "expense" && activity.expense) {
              const expense = activity.expense;
              const isPayer = expense.paidBy === person.id;
              const userShare = expense.splits.find((s) => s.userId === person.id);
              return (
                <MoneyRow
                  key={activity.id}
                  title={expense.title}
                  subtitle={isPayer ? `${friendName} paid` : "You paid"}
                  amount={formatAmount(
                    isPayer ? (userShare?.amount ?? 0) : expense.amount,
                    expense.currency
                  )}
                  amountTone={isPayer ? "negative" : "positive"}
                  onPress={() => router.push(`/expense/${expense.id}`)}
                />
              );
            }
            if (activity.type === "settlement" && activity.settlement) {
              const settlement = activity.settlement;
              const fromFriend = settlement.fromUserId === person.id;
              return (
                <MoneyRow
                  key={activity.id}
                  title={fromFriend ? `${friendName} paid you` : `You paid ${friendName}`}
                  subtitle="Settlement"
                  amount={formatAmount(settlement.amount, settlement.currency)}
                  amountTone={fromFriend ? "positive" : "negative"}
                />
              );
            }
            return null;
          })}
        </>
      )}

      <View style={{ marginTop: 24, gap: 8 }}>
        {permissions.canRemoveFriend && (
          <CoralButton label="Remove friend" variant="danger" onPress={handleRemove} />
        )}
        {permissions.canBlock && (
          <CoralButton label="Block" variant="danger" onPress={handleBlock} />
        )}
        {permissions.canUnblock && (
          <CoralButton label="Unblock" variant="secondary" onPress={handleUnblock} />
        )}
      </View>

      <CoralSheet visible={remindVisible} onClose={() => setRemindVisible(false)}>
        <View style={{ paddingHorizontal: 20, gap: 16 }}>
          <Text
            style={{
              fontFamily: "InstrumentSans_600SemiBold",
              fontSize: 18,
              color: color.text,
              textAlign: "center",
            }}
          >
            Send Reminder
          </Text>
          <Text
            style={{
              fontFamily: "InstrumentSans_400Regular",
              fontSize: 14,
              color: color.muted,
              textAlign: "center",
            }}
          >
            From: You · To: {person.name}
          </Text>

          {remindOptions.length > 1 && (
            <View style={{ gap: 6 }}>
              <Text
                style={{
                  fontFamily: "InstrumentSans_500Medium",
                  fontSize: 13,
                  color: color.muted,
                }}
              >
                Select balance
              </Text>
              {remindOptions.map((opt) => {
                const isSelected =
                  selectedRemind?.context === opt.context &&
                  selectedRemind?.currency === opt.currency;
                return (
                  <Text
                    key={`${opt.context.type}-${opt.currency}`}
                    onPress={() => setSelectedRemind(opt)}
                    style={{
                      fontFamily: "InstrumentSans_400Regular",
                      fontSize: 16,
                      color: isSelected ? coral.accent : color.text,
                      paddingVertical: 12,
                      paddingHorizontal: 14,
                      borderRadius: 12,
                      backgroundColor: isSelected ? coral.accentSoft : "transparent",
                      overflow: "hidden",
                    }}
                  >
                    {opt.label}
                  </Text>
                );
              })}
            </View>
          )}

          {selectedRemind && (
            <Text
              style={{
                fontFamily: "IBMPlexMono_600SemiBold",
                fontSize: 20,
                color: color.text,
                textAlign: "center",
              }}
            >
              {selectedRemind.currency}{" "}
              {formatSignedAmount(
                balances.find(
                  (b) =>
                    b.currency === selectedRemind.currency &&
                    b.context.type === selectedRemind.context.type &&
                    (selectedRemind.context.type === "group"
                      ? b.context.groupId === selectedRemind.context.groupId
                      : b.context.friendshipId === selectedRemind.context.friendshipId)
                )?.signedAmountMinor ?? 0,
                selectedRemind.currency
              )}
            </Text>
          )}

          <CoralField
            label="Optional message"
            placeholder="Add a note..."
            value={remindMessage}
            onChangeText={(t) => setRemindMessage(t.slice(0, 280))}
            multiline
          />
          <Text
            style={{
              fontFamily: "InstrumentSans_400Regular",
              fontSize: 12,
              color: color.muted,
              textAlign: "right",
            }}
          >
            {remindMessage.length}/280
          </Text>

          <CoralButton
            label="Send"
            onPress={handleSendReminder}
            disabled={!selectedRemind}
            loading={sendReminderMutation.isPending}
          />
        </View>
      </CoralSheet>
    </CoralScreen>
  );
}
