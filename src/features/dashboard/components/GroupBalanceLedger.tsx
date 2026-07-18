import type { JSX } from "react";
import { Pressable, Text, View } from "react-native";
import { ArrowRight } from "lucide-react-native";
import * as Haptics from "expo-haptics";

import { formatAmount } from "@/components/ui/AmountDisplay";
import { GroupIconBadge } from "@/components/ui/GroupIconBadge";
import { useUI } from "@/components/ui";
import type { DashboardGroupBalancePreview } from "@/features/dashboard/hooks/useDashboard";

const SETTLED_THRESHOLD = 0.005;

type GroupBalanceLedgerProps = {
  items: DashboardGroupBalancePreview[];
  currencyCode: string;
  onGroupPress: (groupId: string) => void;
  onViewAll: () => void;
};

function getSupportingCopy(item: DashboardGroupBalancePreview, currencyCode: string): string {
  const { keyPerson, keyPersonBalance, netBalance } = item;

  if (Math.abs(netBalance) <= SETTLED_THRESHOLD) return "No open balances";
  if (!keyPerson || keyPersonBalance === undefined) return "Open balance";

  const amount = formatAmount(Math.abs(keyPersonBalance), currencyCode);
  return keyPersonBalance > 0
    ? `${keyPerson.name} owes you ${amount}`
    : `You owe ${keyPerson.name} ${amount}`;
}

function getAccessibilityLabel(item: DashboardGroupBalancePreview, currencyCode: string): string {
  if (Math.abs(item.netBalance) <= SETTLED_THRESHOLD) {
    return `${item.group.name}, settled`;
  }

  const amount = formatAmount(Math.abs(item.netBalance), currencyCode);
  return item.netBalance > 0
    ? `${item.group.name}, you are owed ${amount}`
    : `${item.group.name}, you owe ${amount}`;
}

export function GroupBalanceLedger({
  items,
  currencyCode,
  onGroupPress,
  onViewAll,
}: GroupBalanceLedgerProps): JSX.Element | null {
  const { color, radius } = useUI();

  if (items.length === 0) return null;

  return (
    <View style={{ marginTop: 28 }}>
      <View
        style={{
          minHeight: 44,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text
          style={{
            fontFamily: "InstrumentSans_600SemiBold",
            fontSize: 14,
            fontWeight: "600",
            letterSpacing: 0.14,
            color: color.muted,
          }}
        >
          Where you stand
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="View all groups"
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onViewAll();
          }}
          style={({ pressed }) => ({
            minHeight: 48,
            paddingLeft: 16,
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
            opacity: pressed ? 0.62 : 1,
          })}
        >
          <Text
            style={{
              fontFamily: "InstrumentSans_600SemiBold",
              fontSize: 13,
              color: color.text,
            }}
          >
            All groups
          </Text>
          <ArrowRight size={15} color={color.brand} strokeWidth={1.8} />
        </Pressable>
      </View>

      <View
        style={{
          overflow: "hidden",
          borderWidth: 1,
          borderColor: color.border,
          borderRadius: radius.lg,
          backgroundColor: color.surface,
        }}
      >
        {items.map((item, index) => {
          const isSettled = Math.abs(item.netBalance) <= SETTLED_THRESHOLD;
          const isNegative = item.netBalance < -SETTLED_THRESHOLD;
          const pillBackground = isSettled
            ? color.subtle
            : isNegative
              ? color.dangerTint
              : color.successTint;
          const pillForeground = isSettled ? color.muted : isNegative ? color.danger : color.text;
          const pillCopy = isSettled
            ? "Settled"
            : `${item.netBalance > 0 ? "+" : "-"}${formatAmount(
                Math.abs(item.netBalance),
                currencyCode
              )}`;

          return (
            <Pressable
              key={item.group.id}
              accessibilityRole="button"
              accessibilityLabel={getAccessibilityLabel(item, currencyCode)}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onGroupPress(item.group.id);
              }}
              style={({ pressed }) => ({
                minHeight: 72,
                paddingHorizontal: 14,
                paddingVertical: 11,
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                backgroundColor: pressed ? color.subtle : color.surface,
                borderBottomWidth: index === items.length - 1 ? 0 : 1,
                borderBottomColor: color.border,
              })}
            >
              <GroupIconBadge group={item.group} size="sm" />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: "InstrumentSans_600SemiBold",
                    fontSize: 15,
                    fontWeight: "600",
                    color: color.text,
                  }}
                >
                  {item.group.name}
                </Text>
                <Text
                  numberOfLines={1}
                  style={{
                    marginTop: 3,
                    fontFamily: "InstrumentSans_400Regular",
                    fontSize: 12,
                    color: color.muted,
                  }}
                >
                  {getSupportingCopy(item, currencyCode)}
                </Text>
              </View>
              <View
                style={{
                  flexShrink: 0,
                  minHeight: 26,
                  paddingHorizontal: 9,
                  borderRadius: radius.pill,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: pillBackground,
                }}
              >
                <Text
                  style={{
                    fontFamily: "IBMPlexMono_600SemiBold",
                    fontSize: 11,
                    fontWeight: "600",
                    color: pillForeground,
                    fontVariant: ["tabular-nums"],
                  }}
                >
                  {pillCopy}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
