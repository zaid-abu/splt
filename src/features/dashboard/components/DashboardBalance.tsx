import type { JSX } from "react";
import { useEffect } from "react";
import { View, Pressable } from "react-native";
import { Typography } from "heroui-native";
import * as icons from "lucide-react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { useUI, GlassHeroBalance } from "@/components/ui";
import { formatAmount } from "@/components/ui/AmountDisplay";
import type { User } from "@/types";

interface DashboardBalanceProps {
  balanceTone: "danger" | "success" | "neutral";
  perUserBalances: Map<string, number>;
  owedToYou: number;
  youOwe: number;
  currencyCode: string;
  oweUsers: User[];
  owedUsers: User[];
  onOwePress?: () => void;
  onOwedPress?: () => void;
  onViewStats?: () => void;
  totalSpent: number;
  expenseCount: number;
}

export function DashboardBalance({
  balanceTone,
  owedToYou,
  youOwe,
  currencyCode,
  onViewStats,
  totalSpent,
  expenseCount,
}: DashboardBalanceProps): JSX.Element {
  const { color } = useUI();

  const balanceScale = useSharedValue(1);
  const balanceAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: balanceScale.value }],
  }));

  useEffect(() => {
    const timer = setTimeout(() => {
      balanceScale.value = withSpring(1.02, { damping: 10, stiffness: 120 });
      setTimeout(() => {
        balanceScale.value = withSpring(1, { damping: 12, stiffness: 100 });
      }, 200);
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const netBalance = owedToYou - youOwe;
  const balanceTitle =
    netBalance > 0
      ? `${formatAmount(netBalance, currencyCode)} owed to you`
      : netBalance < 0
        ? `${formatAmount(Math.abs(netBalance), currencyCode)} left to settle`
        : "You are settled up";

  const amountColor =
    netBalance > 0
      ? color.success
      : netBalance < 0
        ? color.danger
        : color.muted;

  return (
    <Animated.View style={balanceAnimatedStyle}>
      <GlassHeroBalance
        label="Today's money state"
        amount={balanceTitle}
        amountColor={amountColor}
        metrics={[
          {
            label: "You owe",
            value: formatAmount(youOwe, currencyCode),
            color: youOwe > 0 ? color.danger : color.muted,
          },
          {
            label: "Owed to you",
            value: formatAmount(owedToYou, currencyCode),
            color: owedToYou > 0 ? color.success : color.muted,
          },
        ]}
      >
        {totalSpent > 0 && (
          <Pressable
            accessibilityRole="button"
            onPress={onViewStats}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 16,
              paddingTop: 14,
              borderTopWidth: 1,
              borderTopColor: color.borderSoft,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <icons.BarChart3 size={16} color={color.muted} strokeWidth={1.75} />
              <View>
                <Typography
                  style={{
                    fontSize: 13,
                    color: color.muted,
                    fontFamily: "IBMPlexSans_500Medium",
                  }}
                >
                  This month
                </Typography>
                <Typography
                  style={{
                    fontSize: 16,
                    color: color.text,
                    fontFamily: "IBMPlexSans_600SemiBold",
                  }}
                >
                  {formatAmount(totalSpent, currencyCode)}
                </Typography>
              </View>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Typography
                style={{
                  fontSize: 13,
                  color: color.muted,
                  fontFamily: "IBMPlexSans_500Medium",
                }}
              >
                {expenseCount} expense{expenseCount !== 1 ? "s" : ""}
              </Typography>
              <icons.ChevronRight size={16} color={color.muted} strokeWidth={1.75} />
            </View>
          </Pressable>
        )}
      </GlassHeroBalance>
    </Animated.View>
  );
}
