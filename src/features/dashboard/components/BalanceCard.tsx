/**
 * BalanceCard — Edge-to-Edge Editorial Design
 *
 * Left column:  "YOU OWE"      — amount in danger red
 * Right column: "YOU ARE OWED" — amount in success green
 * 
 * Separated by a thin vertical line instead of boxed in cards.
 */
import type { JSX } from "react";
import { View, Pressable } from "react-native";
import { Typography } from "heroui-native";
import * as icons from "lucide-react-native";
import { AvatarStack } from "@/components/ui/MemberAvatar";
import type { User } from "@/types";

// ─── Section Label ────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: string }): JSX.Element {
  return (
    <Typography
      style={{
        fontSize: 10,
        fontWeight: "700",
        letterSpacing: 1.2,
        color: "#999999",
        fontFamily: "PlusJakartaSans_700Bold",
        textTransform: "uppercase",
        marginBottom: 4,
      }}
    >
      {children}
    </Typography>
  );
}

// ─── Single balance half-column ───────────────────────────────────────────────
interface HalfCardProps {
  label: string;
  amount: number;
  currencyCode: string;
  amountColor: string;
  users: User[];
  onPress: () => void;
  accessibilityLabel: string;
}

function HalfCard({
  label,
  amount,
  currencyCode,
  amountColor,
  users,
  onPress,
  accessibilityLabel,
}: HalfCardProps): JSX.Element {
  const a = Math.abs(amount);
  let valStr = a.toFixed(2);
  if (a >= 1_000_000) valStr = `${(a / 1_000_000).toFixed(1)}M`;
  else if (a >= 10_000) valStr = `${(a / 1_000).toFixed(1)}K`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        backgroundColor: "transparent",
        opacity: pressed ? 0.5 : 1,
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: 8,
      })}
    >
      <SectionLabel>{label}</SectionLabel>

      {/* Amount + Currency */}
      <View style={{ flexDirection: "row", alignItems: "baseline", marginBottom: 12 }}>
        <Typography
          style={{
            fontSize: 32,
            fontWeight: "800",
            color: amountColor,
            fontFamily: "PlusJakartaSans_800ExtraBold",
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
            fontWeight: "600",
            color: "#999999",
            fontFamily: "PlusJakartaSans_600SemiBold",
            marginLeft: 4,
          }}
        >
          {currencyCode}
        </Typography>
      </View>

      {/* Avatar stack + arrow row */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        {users.length > 0 ? (
          <AvatarStack users={users} max={3} />
        ) : (
          <View style={{ height: 28 }} />
        )}
        <icons.ArrowUpRight size={18} color={amountColor} strokeWidth={2.5} />
      </View>
    </Pressable>
  );
}

// ─── Public export ────────────────────────────────────────────────────────────
export interface BalanceCardProps {
  youOwe: number;
  owedToYou: number;
  currencyCode: string;
  oweUsers: User[];
  owedUsers: User[];
  onOwePress: () => void;
  onOwedPress: () => void;
}

export function BalanceCard({
  youOwe,
  owedToYou,
  currencyCode,
  oweUsers,
  owedUsers,
  onOwePress,
  onOwedPress,
}: BalanceCardProps): JSX.Element {
  return (
    <View style={{ flexDirection: "row", alignItems: "stretch", paddingVertical: 12 }}>
      <HalfCard
        label="YOU OWE"
        amount={youOwe}
        currencyCode={currencyCode}
        amountColor="#000000"
        users={oweUsers}
        onPress={onOwePress}
        accessibilityLabel={`You owe ${youOwe} ${currencyCode}`}
      />
      
      <View style={{ width: 1, backgroundColor: "#F3F3F3", marginHorizontal: 12, marginVertical: 12 }} />
      
      <HalfCard
        label="YOU ARE OWED"
        amount={owedToYou}
        currencyCode={currencyCode}
        amountColor="#4CAF82"
        users={owedUsers}
        onPress={onOwedPress}
        accessibilityLabel={`You are owed ${owedToYou} ${currencyCode}`}
      />
    </View>
  );
}
