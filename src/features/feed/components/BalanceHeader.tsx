import type { ComponentType, JSX } from "react"
import { View, Pressable } from "react-native"
import { Typography } from "heroui-native"
import * as icons from "lucide-react-native"
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from "react-native-reanimated"
import type { SharedValue } from "react-native-reanimated"
import { UI } from "@/components/ui/native-ui"

type LucideIcon = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>

function IconShell({ icon: Icon, tone }: { icon: LucideIcon; tone: string }): JSX.Element {
  return (
    <View
      style={{
        width: 36,
        height: 36,
        borderRadius: 10,
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
        size={18}
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
  )
}

interface BalanceHeaderProps {
  scrollY: SharedValue<number>
  netBalance: number
  balanceTone: "danger" | "success" | "neutral"
  balanceTitle: string
  balanceSubtitle: string
  onAnalyticsPress: () => void
}

export function BalanceHeader({
  scrollY,
  netBalance,
  balanceTone,
  balanceTitle,
  balanceSubtitle,
  onAnalyticsPress,
}: BalanceHeaderProps): JSX.Element {
  const headerStyle = useAnimatedStyle(() => ({
    height: interpolate(scrollY.value, [0, 150], [180, 60], Extrapolation.CLAMP),
  }))

  const contentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 80], [1, 0], Extrapolation.CLAMP),
  }))

  const amountStyle = useAnimatedStyle(() => ({
    fontSize: interpolate(scrollY.value, [0, 150], [36, 20], Extrapolation.CLAMP),
  }))

  return (
    <View style={{ paddingHorizontal: UI.space.page, marginBottom: 16 }}>
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
            overflow: "hidden",
          },
          headerStyle,
        ]}
      >
        <Pressable
          onPress={onAnalyticsPress}
          style={{ flex: 1, padding: 16, justifyContent: "center" }}
          accessibilityLabel="View analytics"
          accessibilityRole="button"
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 }}>
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
            <Animated.Text
              style={[
                {
                  fontFamily: "Sora_600SemiBold",
                  color: UI.color.textStrong,
                  letterSpacing: -0.3,
                },
                amountStyle,
              ]}
              numberOfLines={1}
            >
              {balanceTitle}
            </Animated.Text>
          </View>

          <Animated.View style={contentStyle}>
            <Typography
              style={{
                fontSize: 14,
                color: UI.color.muted,
                fontFamily: "IBMPlexSans_500Medium",
                lineHeight: 20,
              }}
            >
              {balanceSubtitle}
            </Typography>
          </Animated.View>
        </Pressable>
      </Animated.View>
    </View>
  )
}
