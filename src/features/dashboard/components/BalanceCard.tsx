/**
 * BalanceCard — Premium Edge-to-Edge Design
 */
import type { JSX } from "react";
import { View, Pressable } from "react-native";
import { Typography } from "heroui-native";
import * as icons from "lucide-react-native";
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";
import type { User } from "@/types";

const BG = "transparent";
const TEXT_PRIMARY = "#000000";
const TEXT_MUTED = "#8A8782";
const SEPARATOR = "#E8E4DF";
const AMOUNT_OWE = "#000000";
const AMOUNT_OWED = "#4CAF82";

function SectionLabel({ children }: { children: string }): JSX.Element {
  return (
    <Typography
      style={{
        fontSize: 10,
        letterSpacing: 1.2,
        color: TEXT_MUTED,
        fontFamily: "CrimsonText_700Bold",
        textTransform: "uppercase",
        marginBottom: 8,
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
  users: User[];
  onPress: () => void;
  accessibilityLabel: string;
  showSettleButton?: boolean;
  onSettlePress?: () => void;
}

function HalfCard({
  label,
  amount,
  currencyCode,
  amountColor,
  users,
  onPress,
  accessibilityLabel,
  showSettleButton,
  onSettlePress,
}: HalfCardProps): JSX.Element {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const a = Math.abs(amount);
  let valStr = a.toFixed(2);
  if (a >= 1_000_000) valStr = `${(a / 1_000_000).toFixed(1)}M`;
  else if (a >= 10_000) valStr = `${(a / 1_000).toFixed(1)}K`;

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
            paddingVertical: 12,
            paddingHorizontal: 12,
            backgroundColor: "transparent",
            borderRadius: 16,
          },
          animatedStyle,
        ]}
      >
        <SectionLabel>{label}</SectionLabel>

        {/* Amount + Currency */}
        <View style={{ flexDirection: "row", alignItems: "baseline", marginBottom: 16 }}>
          <Typography
            style={{
              fontSize: 32,
              color: amountColor,
              fontFamily: "CrimsonText_700Bold",
              lineHeight: 40,
              letterSpacing: -1,
            }}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {valStr}
          </Typography>
          <Typography
            style={{
              fontSize: 14,
              color: TEXT_MUTED,
              fontFamily: "CrimsonText_600SemiBold",
              marginLeft: 4,
            }}
          >
            {currencyCode}
          </Typography>
        </View>

        {/* Action row */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "flex-end",
            minHeight: 28,
          }}
        >
          {showSettleButton && users.length > 0 && amount > 0 ? (
            <Pressable
              accessibilityRole="button"
              onPress={(e) => {
                e.stopPropagation();
                onSettlePress?.();
              }}
              style={({ pressed }) => ({
                backgroundColor: SEPARATOR,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 0,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Typography
                style={{ fontSize: 12, color: TEXT_PRIMARY, fontFamily: "CrimsonText_700Bold" }}
              >
                Settle
              </Typography>
            </Pressable>
          ) : (
            <icons.ArrowUpRight size={18} color={amountColor} strokeWidth={2.5} />
          )}
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
}: BalanceCardProps): JSX.Element {
  const isAllSettled = youOwe === 0 && owedToYou === 0;
  const netBalance = owedToYou - youOwe;

  if (isAllSettled) {
    return (
      <View
        style={{
          backgroundColor: "transparent",
          paddingVertical: 32,
          paddingHorizontal: 16,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 0,
            borderWidth: 1,
            borderColor: SEPARATOR,
            backgroundColor: "transparent",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
          }}
        >
          <icons.Check size={32} color={AMOUNT_OWED} strokeWidth={2.5} />
        </View>
        <Typography
          style={{
            fontSize: 24,
            color: TEXT_PRIMARY,
            fontFamily: "CrimsonText_700Bold",
            marginBottom: 8,
          }}
        >
          All settled up!
        </Typography>
        <Typography
          style={{ fontSize: 15, color: TEXT_MUTED, fontFamily: "CrimsonText_600SemiBold" }}
        >
          You don&apos;t owe anyone, and no one owes you.
        </Typography>
      </View>
    );
  }

  return (
    <View
      style={{
        backgroundColor: BG,
        paddingVertical: 16,
        flexDirection: "row",
        alignItems: "stretch",
        position: "relative",
      }}
    >
      <HalfCard
        label="YOU OWE"
        amount={youOwe}
        currencyCode={currencyCode}
        amountColor={AMOUNT_OWE}
        users={oweUsers}
        onPress={onOwePress}
        accessibilityLabel={`You owe ${youOwe} ${currencyCode}`}
        showSettleButton={true}
        onSettlePress={onSettlePress}
      />

      {/* Divider */}
      <View
        style={{ width: 1, backgroundColor: SEPARATOR, marginVertical: 12, marginHorizontal: 4 }}
      />

      <HalfCard
        label="YOU ARE OWED"
        amount={owedToYou}
        currencyCode={currencyCode}
        amountColor={AMOUNT_OWED}
        users={owedUsers}
        onPress={onOwedPress}
        accessibilityLabel={`You are owed ${owedToYou} ${currencyCode}`}
      />

      {/* Net Balance Pill */}
    </View>
  );
}
