import { Chip, PressableFeedback, Typography } from "heroui-native";
import type { JSX } from "react";
import { View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  useGroups,
  useCreateGroup,
  useUpdateGroup,
  useDeleteGroup,
  useAddGroupMembers,
} from "@/features/groups/queries/useGroups";
import {
  useUserExpenses,
  useAddExpense,
  useUpdateExpense,
  useDeleteExpense,
} from "@/features/expenses/queries/useExpenses";
import {
  useUserActivities,
  useLogActivity,
  useDeleteActivity,
} from "@/features/activity/queries/useActivities";
import {
  useUserSettlements,
  useAddSettlement,
} from "@/features/settlements/queries/useSettlements";
import * as balancesUtil from "@/features/settlements/utils/balances";
import { useMemo } from "react";

import { AmountDisplay } from "@/components/ui/AmountDisplay";
import { SwipeableRow } from "@/components/layout/SwipeableRow";
import { getStringColor, hexToRgba } from "@/utils/theme";
import * as icons from "lucide-react-native";
import { useAuth } from "@/context/AppContext";
import type { Group } from "@/types";
import { useUIStore } from "@/store/useUIStore";

interface GroupCardProps {
  group: Group;
  currentUserId: string;
  index?: number;
  isLast?: boolean;
  onPress?: () => void;
}

export function GroupCard({
  group,
  currentUserId,
  index = 0,
  isLast = false,
  onPress,
}: GroupCardProps): JSX.Element {
  const { currentUser } = useAuth();
  const { mutateAsync: deleteGroup } = useDeleteGroup();

  const { data: groups = [] } = useGroups(currentUser?.id);
  const { data: expenses = [] } = useUserExpenses(currentUser?.id);
  const { data: settlements = [] } = useUserSettlements(currentUser?.id);

  const preferredCurrency = useUIStore((s) => s.preferredCurrency);
  const convertCurrency = useUIStore((s) => s.convertCurrency);

  const balances = useMemo(() => {
    return balancesUtil.getGroupBalances(
      group.id,
      expenses,
      settlements,
      group,
      preferredCurrency,
      convertCurrency
    );
  }, [group.id, expenses, settlements, group, preferredCurrency, convertCurrency]);

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
        <PressableFeedback accessibilityRole="button" onPress={onPress}>
          <View
            className={`bg-white p-4 flex-row items-center justify-between ${!isLast ? "border-b border-border/50" : ""}`}
          >
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
