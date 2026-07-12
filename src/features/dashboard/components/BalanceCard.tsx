/**
 * BalanceCard
 */
import type { JSX } from "react";
import { View, Pressable } from "react-native";
import { Typography } from "heroui-native";
import * as icons from "lucide-react-native";
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";
import { UI } from "@/components/ui/native-ui";
import type { User } from "@/types";

function SectionLabel({ children }: { children: string }): JSX.Element {
  return (
    <Typography
      style={{
        fontSize: 10,
        letterSpacing: 0.8,
        color: UI.color.muted,
        fontFamily: "IBMPlexSans_600SemiBold",
        textTransform: "uppercase",
        marginBottom: 6,
      }}
    >
      {children}
    </Typography>
  );
}

interface HalfCardProps {
  label: string;
  amount: number;
  currencyCode: string;
  amountColor: string;
  panelColor: string;
  users: User[];
  onPress: () => void;
  accessibilityLabel: string;
}

function HalfCard({
  label,
  amount,
  currencyCode,
  amountColor,
  panelColor,
  users,
  onPress,
  accessibilityLabel,
}: HalfCardProps): JSX.Element {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const a = Math.abs(amount);
  let valStr = a.toFixed(2);
  if (a >= 1_000_000) valStr = `${(a / 1_000_000).toFixed(1)}M`;
  else if (a >= 10_000) valStr = `${(a / 1_000).toFixed(1)}K`;

  const leadUser = users[0];
  const userHint = leadUser
    ? users.length > 1
      ? `${leadUser.name.split(" ")[0]} +${users.length - 1}`
      : leadUser.name.split(" ")[0]
    : "No balances";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      // eslint-disable-next-line
      onPressIn={() => (scale.value = withSpring(0.97, { damping: 15, stiffness: 300 }))}
      // eslint-disable-next-line
      onPressOut={() => (scale.value = withSpring(1, { damping: 15, stiffness: 300 }))}
      style={{ flex: 1 }}
    >
      <Animated.View
        style={[
          {
            flex: 1,
            paddingVertical: 14,
            paddingHorizontal: 12,
            backgroundColor: panelColor,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: UI.color.border,
          },
          animatedStyle,
        ]}
      >
        <SectionLabel>{label}</SectionLabel>

        {/* Amount + Currency */}
        <View style={{ flexDirection: "row", alignItems: "baseline", marginBottom: 12 }}>
          <Typography
            style={{
              fontSize: 26,
              color: amountColor,
              fontFamily: "IBMPlexSans_600SemiBold",
              lineHeight: 31,
              letterSpacing: -0.6,
            }}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {valStr}
          </Typography>
          <Typography
            style={{
              fontSize: 13,
              color: UI.color.muted,
              fontFamily: "IBMPlexSans_500Medium",
              marginLeft: 3,
            }}
          >
            {currencyCode}
          </Typography>
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            minHeight: 28,
          }}
        >
          <Typography
            numberOfLines={1}
            style={{
              flex: 1,
              marginRight: 8,
              fontSize: 12,
              color: UI.color.muted,
              fontFamily: "IBMPlexSans_500Medium",
              lineHeight: 16,
            }}
          >
            {userHint}
          </Typography>
          <icons.ArrowUpRight size={16} color={amountColor} strokeWidth={2.25} />
        </View>
      </Animated.View>
    </Pressable>
  );
}

export interface BalanceCardProps {
  youOwe: number;
  owedToYou: number;
  currencyCode: string;
  oweUsers: User[];
  owedUsers: User[];
  onOwePress: () => void;
  onOwedPress: () => void;
  onSettlePress?: () => void;
  onViewBalancesPress?: () => void;
}

export function BalanceCard({
  youOwe,
  owedToYou,
  currencyCode,
  oweUsers,
  owedUsers,
  onOwePress,
  onOwedPress,
  onSettlePress,
  onViewBalancesPress,
}: BalanceCardProps): JSX.Element {
  const isAllSettled = youOwe === 0 && owedToYou === 0;
  const netBalance = owedToYou - youOwe;
  const netBalanceLabel =
    netBalance > 0 ? "Net owed to you" : netBalance < 0 ? "Net you owe" : "Net balance";
  const netBalanceColor =
    netBalance < 0 ? UI.color.danger : netBalance > 0 ? UI.color.success : UI.color.muted;
  const netBalanceAmount = Math.abs(netBalance).toFixed(2);

  if (isAllSettled) {
    return (
      <View
        style={{
          backgroundColor: UI.color.surface,
          paddingVertical: 28,
          paddingHorizontal: 18,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 16,
          borderWidth: 1,
          borderColor: UI.color.border,
        }}
      >
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: UI.color.border,
            backgroundColor: UI.color.successTint,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 14,
          }}
        >
          <icons.Check size={32} color={UI.color.success} strokeWidth={2.5} />
        </View>
        <Typography
          style={{
            fontSize: 22,
            lineHeight: 28,
            color: UI.color.text,
            fontFamily: "IBMPlexSans_600SemiBold",
            marginBottom: 6,
            textAlign: "center",
          }}
        >
          All settled up
        </Typography>
        <Typography
          style={{
            fontSize: 15,
            lineHeight: 21,
            color: UI.color.muted,
            fontFamily: "IBMPlexSans_500Medium",
            textAlign: "center",
          }}
        >
          You don&apos;t owe anyone, and no one owes you.
        </Typography>
        {onViewBalancesPress && (
          <Pressable
            accessibilityRole="button"
            onPress={onViewBalancesPress}
            style={({ pressed }) => ({
              marginTop: 16,
              paddingHorizontal: 18,
              minHeight: 44,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: UI.color.border,
              backgroundColor: UI.color.control,
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.75 : 1,
            })}
          >
            <Typography
              style={{ fontSize: 14, color: UI.color.text, fontFamily: "IBMPlexSans_600SemiBold" }}
            >
              View balances
            </Typography>
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <View
      style={{
        backgroundColor: UI.color.surface,
        padding: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: UI.color.border,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "baseline",
          justifyContent: "space-between",
          borderBottomWidth: 1,
          borderBottomColor: UI.color.border,
          paddingBottom: 12,
          marginBottom: 12,
        }}
      >
        <Typography
          style={{
            fontSize: 11,
            letterSpacing: 0.8,
            color: UI.color.muted,
            fontFamily: "IBMPlexSans_600SemiBold",
            textTransform: "uppercase",
          }}
        >
          {netBalanceLabel}
        </Typography>
        <Typography
          style={{
            fontSize: 18,
            color: netBalanceColor,
            fontFamily: "IBMPlexSans_600SemiBold",
            lineHeight: 24,
          }}
        >
          {netBalanceAmount} {currencyCode}
        </Typography>
      </View>

      <View style={{ flexDirection: "row", alignItems: "stretch", gap: 10 }}>
        <HalfCard
          label="YOU OWE"
          amount={youOwe}
          currencyCode={currencyCode}
          amountColor={UI.color.danger}
          panelColor={UI.color.dangerTint}
          users={oweUsers}
          onPress={onOwePress}
          accessibilityLabel={`You owe ${youOwe} ${currencyCode}`}
        />

        <HalfCard
          label="YOU ARE OWED"
          amount={owedToYou}
          currencyCode={currencyCode}
          amountColor={UI.color.success}
          panelColor={UI.color.successTint}
          users={owedUsers}
          onPress={onOwedPress}
          accessibilityLabel={`You are owed ${owedToYou} ${currencyCode}`}
        />
      </View>

      <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
        {youOwe > 0 && (
          <Pressable
            accessibilityRole="button"
            onPress={onSettlePress}
            style={({ pressed }) => ({
              flex: 1,
              minHeight: 44,
              borderRadius: 999,
              backgroundColor: UI.color.ink,
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Typography
              style={{
                fontSize: 14,
                color: "#FFFFFF",
                fontFamily: "IBMPlexSans_600SemiBold",
              }}
            >
              Settle up
            </Typography>
          </Pressable>
        )}

        {onViewBalancesPress && (
          <Pressable
            accessibilityRole="button"
            onPress={onViewBalancesPress}
            style={({ pressed }) => ({
              flex: 1,
              minHeight: 44,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: UI.color.border,
              backgroundColor: UI.color.control,
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.75 : 1,
            })}
          >
            <Typography
              style={{ fontSize: 14, color: UI.color.text, fontFamily: "IBMPlexSans_600SemiBold" }}
            >
              View balances
            </Typography>
          </Pressable>
        )}
      </View>
    </View>
  );
}
