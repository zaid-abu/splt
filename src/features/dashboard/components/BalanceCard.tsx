/**
 * BalanceCard — Dark-first design with user avatars and settle action.
 */
import type { JSX } from "react";
import { View } from "react-native";
import * as icons from "lucide-react-native";
import type { User } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/primitives/Text";
import { AvatarStack } from "@/components/ui/AvatarStack";

interface HalfCardProps {
  label: string;
  amount: number;
  currencyCode: string;
  amountColor: "foreground" | "success" | "danger";
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
  const a = Math.abs(amount);
  let valStr = a.toFixed(2);
  if (a >= 1_000_000) valStr = `${(a / 1_000_000).toFixed(1)}M`;
  else if (a >= 10_000) valStr = `${(a / 1_000).toFixed(1)}K`;

  return (
    <Card onPress={onPress} bordered={false} accessibilityLabel={accessibilityLabel} className="flex-1 py-4 px-4">
      <Text variant="bodySmall" color="muted" className="font-semibold">{label}</Text>

      <View className="flex-row items-baseline mb-3">
        <Text
          variant="screenTitle"
          className={amountColor === "foreground" ? "text-foreground" : amountColor === "success" ? "text-success" : "text-danger"}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {valStr}
        </Text>
        <Text variant="bodySmall" color="muted" className="font-semibold ml-1">
          {currencyCode}
        </Text>
      </View>

      {users.length > 0 && (
        <View className="flex-row mb-3">
          <AvatarStack users={users} max={3} />
        </View>
      )}

      <View className="flex-row justify-end min-h-[28px]">
        {showSettleButton && users.length > 0 && amount > 0 ? (
          <Button variant="secondary" size="sm" onPress={onSettlePress}>
            Settle
          </Button>
        ) : (
          <icons.ArrowUpRight
            size={18}
            className={amountColor === "success" ? "text-success" : "text-foreground"}
            strokeWidth={2.5}
          />
        )}
      </View>
    </Card>
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

  if (isAllSettled) {
    return (
      <Card bordered className="items-center justify-center py-8 px-4">
        <View className="w-16 h-16 rounded-2xl border border-border items-center justify-center mb-4">
          <icons.Check size={32} className="text-success" strokeWidth={2.5} />
        </View>
        <Text variant="sectionLabel" className="mb-2 text-foreground">All settled up!</Text>
        <Text variant="bodySmall" color="muted" className="text-center">
          You don&apos;t owe anyone, and no one owes you.
        </Text>
      </Card>
    );
  }

  return (
    <Card bordered className="flex-row items-stretch p-0">
      <HalfCard
        label="YOU OWE"
        amount={youOwe}
        currencyCode={currencyCode}
        amountColor="foreground"
        users={oweUsers}
        onPress={onOwePress}
        accessibilityLabel={`You owe ${youOwe} ${currencyCode}`}
        showSettleButton
        onSettlePress={onSettlePress}
      />

      <View className="w-px bg-divider my-3" />

      <HalfCard
        label="YOU ARE OWED"
        amount={owedToYou}
        currencyCode={currencyCode}
        amountColor="success"
        users={owedUsers}
        onPress={onOwedPress}
        accessibilityLabel={`You are owed ${owedToYou} ${currencyCode}`}
      />
    </Card>
  );
}
