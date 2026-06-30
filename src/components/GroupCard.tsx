import { Chip, PressableFeedback, Typography } from "heroui-native";
import type { JSX } from "react";
import { View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { AmountDisplay } from "@/components/AmountDisplay";
import { SwipeableRow } from "@/components/SwipeableRow";
import { getStringColor, hexToRgba } from "@/utils/theme";
import * as icons from "lucide-react-native";
import type { Group } from "@/types";
import { useApp } from "@/context/AppContext";

interface GroupCardProps {
  group: Group;
  currentUserId: string;
  index?: number;
  onPress?: () => void;
}

export function GroupCard({
  group,
  currentUserId,
  index = 0,
  onPress,
}: GroupCardProps): JSX.Element {
  const { getGroupBalances, deleteGroup } = useApp();

  const balances = getGroupBalances(group.id);
  const balance = balances.get(currentUserId) ?? 0;

  const balanceLabel = balance > 0 ? "You are owed" : balance < 0 ? "You owe" : "Settled up";
  const labelColor =
    balance > 0 ? "text-success" : balance < 0 ? "text-danger" : "text-muted-foreground";

  const GroupIcon = (icons as any)[group.icon] || icons.Users;
  const themeColor = getStringColor(group.id);
  const themeBgColor = hexToRgba(themeColor, 0.15);

  return (
    <Animated.View entering={FadeInDown.delay(100 + index * 50).springify()}>
      <SwipeableRow onDelete={() => deleteGroup(group.id)}>
        <PressableFeedback onPress={onPress}>
          <View className="bg-white p-4 border-b border-border/50 flex-row items-center justify-between">
            <View className="flex-row items-center gap-4 flex-1 pr-4">
              <View
                className="w-12 h-12 rounded-[16px] items-center justify-center"
                style={{ backgroundColor: themeBgColor }}
              >
                <GroupIcon size={24} color={themeColor} strokeWidth={2.5} />
              </View>
              <View className="flex-1">
                <Typography
                  type="body"
                  className="font-bold text-foreground text-[17px] mb-0.5"
                  numberOfLines={1}
                >
                  {group.name}
                </Typography>
                <Typography type="body-xs" className="text-muted-foreground font-medium">
                  {group.members.length} members
                </Typography>
              </View>
            </View>

            <View className="items-end">
              <Typography
                type="body-xs"
                className={`font-medium tracking-wider mb-1 ${labelColor}`}
              >
                {balanceLabel}
              </Typography>
              {balance !== 0 && (
                <AmountDisplay
                  amount={Math.abs(balance)}
                  currency={group.currency}
                  size="md"
                  colored={true}
                />
              )}
            </View>
          </View>
        </PressableFeedback>
      </SwipeableRow>
    </Animated.View>
  );
}
