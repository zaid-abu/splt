import type { ComponentType, JSX } from "react";
import { useMemo, useEffect } from "react";
import { View, Pressable } from "react-native";
import { Typography } from "heroui-native";
import * as icons from "lucide-react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { useUI } from "@/components/ui";
import { formatAmount } from "@/components/ui/AmountDisplay";
import { MoneySignal } from "@/components/ui/MoneySignal";
import type { User } from "@/types";

type LucideIcon = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

function IconShell({ icon: Icon, tone }: { icon: LucideIcon; tone: string }): JSX.Element {
  const { color, radius } = useUI();
  return (
    <View
      style={{
        width: 44,
        height: 44,
        borderRadius: radius.lg,
        backgroundColor:
          tone === "danger"
            ? color.dangerTint
            : tone === "success"
              ? color.successTint
              : color.control,
        borderWidth: 1,
        borderColor: color.border,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon
        size={20}
        color={
          tone === "danger" ? color.danger : tone === "success" ? color.success : color.muted
        }
        strokeWidth={2}
      />
    </View>
  );
}

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
  perUserBalances,
  owedToYou,
  youOwe,
  currencyCode,
  oweUsers,
  owedUsers,
  onOwePress,
  onOwedPress,
  onViewStats,
  totalSpent,
  expenseCount,
}: DashboardBalanceProps): JSX.Element {
  const { color, radius, space } = useUI();

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
  const owedBackLabel =
    owedUsers.length > 1
      ? `${owedUsers.length} people`
      : owedUsers[0]?.name.split(" ")[0] || "Someone";
  const waitingPersonLabel =
    oweUsers.length > 1
      ? `${oweUsers.length} people`
      : oweUsers[0]?.name.split(" ")[0] || "Someone";
  const balanceSubtitle =
    netBalance > 0
      ? `${owedBackLabel} can settle back when ready.`
      : netBalance < 0
        ? `${waitingPersonLabel} ${oweUsers.length > 1 ? "are" : "is"} waiting on you.`
        : "Nothing urgent. Add expenses as they happen.";

  return (
    <Animated.View
      style={[
        {
          backgroundColor:
            balanceTone === "danger"
              ? color.dangerTint
              : balanceTone === "success"
                ? color.successTint
                : color.surface,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: color.border,
          padding: 16,
        },
        balanceAnimatedStyle,
      ]}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
        <IconShell
          icon={
            balanceTone === "danger"
              ? icons.ArrowUpRight
              : balanceTone === "success"
                ? icons.ArrowDownLeft
                : icons.Check
          }
          tone={balanceTone}
        />
        <View style={{ flex: 1 }}>
          <Typography
            style={{
              fontSize: 12,
              color: color.muted,
              fontFamily: "IBMPlexSans_600SemiBold",
            }}
          >
            Today&apos;s money state
          </Typography>
          <Typography
            numberOfLines={1}
            adjustsFontSizeToFit
            style={{
              marginTop: 4,
              fontSize: 24,
              color: color.textStrong,
              fontFamily: "Sora_600SemiBold",
              letterSpacing: -0.2,
            }}
          >
            {balanceTitle}
          </Typography>
          <Typography
            style={{
              marginTop: 5,
              fontSize: 14,
              color: color.muted,
              fontFamily: "IBMPlexSans_500Medium",
            }}
          >
            {balanceSubtitle}
          </Typography>
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
        <MoneySignal
          label="You owe"
          value={formatAmount(youOwe, currencyCode)}
          tone={youOwe > 0 ? "danger" : "neutral"}
        />
        <MoneySignal
          label="Owed to you"
          value={formatAmount(owedToYou, currencyCode)}
          tone={owedToYou > 0 ? "success" : "neutral"}
        />
      </View>

      {totalSpent > 0 && (
        <>
          <View
            style={{
              height: 1,
              backgroundColor: color.border,
              marginTop: 14,
              marginBottom: 12,
            }}
          />
          <Pressable
            accessibilityRole="button"
            onPress={onViewStats}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: color.control,
                  borderWidth: 1,
                  borderColor: color.border,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <icons.BarChart3 size={16} color={color.muted} strokeWidth={1.75} />
              </View>
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
        </>
      )}
    </Animated.View>
  );
}
