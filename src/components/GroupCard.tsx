import { Chip, PressableFeedback, Typography } from "heroui-native";
import type { JSX } from "react";
import { View } from "react-native";

import { AmountDisplay } from "@/components/AmountDisplay";
import { AvatarStack } from "@/components/MemberAvatar";
import * as icons from "lucide-react-native";
import type { Group } from "@/types";

interface GroupCardProps {
  group: Group;
  currentUserId: string;
  onPress?: () => void;
}

export function GroupCard({ group, currentUserId, onPress }: GroupCardProps): JSX.Element {
  const me = group.members.find((m) => m.userId === currentUserId);
  const balance = me?.balance ?? 0;
  const memberUsers = group.members.map((m) => m.user);

  const balanceLabel = balance > 0 ? "You are owed" : balance < 0 ? "You owe" : "Settled up";
  const labelColor = balance > 0 ? "text-success" : balance < 0 ? "text-danger" : "text-muted-foreground";
  
  const GroupIcon = (icons as any)[group.icon] || icons.Users;

  return (
    <PressableFeedback onPress={onPress} className="mb-4">
      <View className="bg-surface rounded-[24px] p-5 border border-border">
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center gap-3">
            <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center">
              <GroupIcon size={24} className="text-primary" strokeWidth={2} />
            </View>
            <View>
              <Typography type="body" className="font-bold text-foreground text-[17px] mb-0.5">
                {group.name}
              </Typography>
              <Typography type="body-xs" className="text-muted-foreground font-medium">
                {group.members.length} members
              </Typography>
            </View>
          </View>
          <View className="w-10 h-10 rounded-full bg-secondary items-center justify-center">
            <icons.ChevronRight size={20} className="text-primary" />
          </View>
        </View>
        
        <View className="h-[1px] bg-border/60 w-full mb-4" />

        <View className="flex-row items-center justify-between">
          <AvatarStack users={memberUsers} max={4} />
          
          <View className="items-end">
            <Typography type="body-xs" className={`font-bold mb-1 tracking-wider ${labelColor}`}>
              {balanceLabel.toUpperCase()}
            </Typography>
            <AmountDisplay
              amount={Math.abs(balance)}
              currency={group.currency}
              size="lg"
              colored={true}
            />
          </View>
        </View>
      </View>
    </PressableFeedback>
  );
}
