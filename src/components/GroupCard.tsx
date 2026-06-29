import { Chip, PressableFeedback, Typography } from "heroui-native";
import type { JSX } from "react";
import { View } from "react-native";

import { AmountDisplay } from "@/components/AmountDisplay";
import * as icons from "lucide-react-native";
import type { Group } from "@/types";
import { useApp } from "@/context/AppContext";

interface GroupCardProps {
  group: Group;
  currentUserId: string;
  onPress?: () => void;
}

export function GroupCard({ group, currentUserId, onPress }: GroupCardProps): JSX.Element {
  const { getGroupBalances, preferredCurrency } = useApp();
  
  const balances = getGroupBalances(group.id);
  const balance = balances.get(currentUserId) ?? 0;

  const balanceLabel = balance > 0 ? "You are owed" : balance < 0 ? "You owe" : "Settled up";
  const labelColor = balance > 0 ? "text-success" : balance < 0 ? "text-danger" : "text-muted-foreground";
  
  const GroupIcon = (icons as any)[group.icon] || icons.Users;

  return (
    <PressableFeedback onPress={onPress}>
      <View className="bg-white p-4 border-b border-border/50 flex-row items-center justify-between">
        <View className="flex-row items-center gap-4 flex-1 pr-4">
          <View className="w-12 h-12 rounded-[16px] bg-primary/10 items-center justify-center">
            <GroupIcon size={24} className="text-primary" strokeWidth={2} />
          </View>
          <View className="flex-1">
            <Typography type="body" className="font-bold text-foreground text-[17px] mb-0.5" numberOfLines={1}>
              {group.name}
            </Typography>
            <Typography type="body-xs" className="text-muted-foreground font-medium">
              {group.members.length} members
            </Typography>
          </View>
        </View>
        
        <View className="items-end">
          <Typography type="body-xs" className={`font-bold mb-1 tracking-wider uppercase ${labelColor}`}>
            {balanceLabel}
          </Typography>
          {balance !== 0 && (
            <AmountDisplay
              amount={Math.abs(balance)}
              currency={preferredCurrency.code}
              size="md"
              colored={true}
            />
          )}
        </View>
      </View>
    </PressableFeedback>
  );
}
