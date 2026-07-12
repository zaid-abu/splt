import type { ComponentType, JSX } from "react";
import { useEffect } from "react";
import { View, Pressable } from "react-native";
import { Typography } from "heroui-native";
import * as icons from "lucide-react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeInDown,
} from "react-native-reanimated";
import { useRouter } from "expo-router";
import { UI } from "@/components/ui/native-ui";
import { MoneySignal } from "@/components/ui/MoneySignal";
import { formatAmount } from "@/components/ui/AmountDisplay";

type LucideIcon = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

function IconShell({ icon: Icon, tone }: { icon: LucideIcon; tone: string }): JSX.Element {
  return (
    <View
      style={{
        width: 44,
        height: 44,
        borderRadius: UI.radius.lg,
        backgroundColor:
          tone === "danger"
            ? UI.color.dangerTint
            : tone === "success"
              ? UI.color.successTint
              : UI.color.control,
        borderWidth: 1,
        borderColor: UI.color.border,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon
        size={20}
        color={
          tone === "danger"
            ? UI.color.danger
            : tone === "success"
              ? UI.color.success
              : UI.color.muted
        }
        strokeWidth={2}
      />
    </View>
  );
}

export interface BalanceWidgetProps {
  youOwe: number;
  owedToYou: number;
  netBalance: number;
  balanceTone: "danger" | "success" | "neutral";
  balanceTitle: string;
  balanceSubtitle: string;
  totalSpent: number;
  expenseCount: number;
  preferredCurrency: { code: string };
}

export function BalanceWidget({
  youOwe,
  owedToYou,
  netBalance,
  balanceTone,
  balanceTitle,
  balanceSubtitle,
  totalSpent,
  expenseCount,
  preferredCurrency,
}: BalanceWidgetProps): JSX.Element {
  const router = useRouter();
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

  return (
    <Animated.View
      entering={FadeInDown.duration(350).springify()}
      style={{ paddingHorizontal: UI.space.page, marginBottom: 18 }}
    >
      <Animated.View
        style={[
          {
            backgroundColor:
              balanceTone === "danger"
                ? UI.color.dangerTint
                : balanceTone === "success"
                  ? UI.color.successTint
                  : UI.color.surface,
            borderRadius: UI.radius.lg,
            borderWidth: 1,
            borderColor: UI.color.border,
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
                color: UI.color.muted,
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
                color: UI.color.textStrong,
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
                color: UI.color.muted,
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
            value={formatAmount(youOwe, preferredCurrency.code)}
            tone={youOwe > 0 ? "danger" : "neutral"}
          />
          <MoneySignal
            label="Owed to you"
            value={formatAmount(owedToYou, preferredCurrency.code)}
            tone={owedToYou > 0 ? "success" : "neutral"}
          />
        </View>

        {totalSpent > 0 && (
          <>
            <View
              style={{
                height: 1,
                backgroundColor: UI.color.border,
                marginTop: 14,
                marginBottom: 12,
              }}
            />
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/stats")}
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
                    backgroundColor: UI.color.control,
                    borderWidth: 1,
                    borderColor: UI.color.border,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <icons.BarChart3 size={16} color={UI.color.muted} strokeWidth={1.75} />
                </View>
                <View>
                  <Typography
                    style={{
                      fontSize: 13,
                      color: UI.color.muted,
                      fontFamily: "IBMPlexSans_500Medium",
                    }}
                  >
                    This month
                  </Typography>
                  <Typography
                    style={{
                      fontSize: 16,
                      color: UI.color.text,
                      fontFamily: "IBMPlexSans_600SemiBold",
                    }}
                  >
                    {formatAmount(totalSpent, preferredCurrency.code)}
                  </Typography>
                </View>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Typography
                  style={{
                    fontSize: 13,
                    color: UI.color.muted,
                    fontFamily: "IBMPlexSans_500Medium",
                  }}
                >
                  {expenseCount} expense{expenseCount !== 1 ? "s" : ""}
                </Typography>
                <icons.ChevronRight size={16} color={UI.color.muted} strokeWidth={1.75} />
              </View>
            </Pressable>
          </>
        )}
      </Animated.View>
    </Animated.View>
  );
}
