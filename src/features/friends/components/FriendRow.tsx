import { View, Pressable } from "react-native";
import { Typography } from "heroui-native";
import { useRouter } from "expo-router";
import * as icons from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { useUI } from "@/components/ui";
import { getBalanceCopy } from "@/utils/balance";
import { formatActivityDate } from "@/utils/date";
import { SwipeableRow } from "@/components/layout/SwipeableRow";
import type { FriendListItem } from "@/features/friends/hooks/useFriendsList";

interface FriendRowProps {
  row: FriendListItem;
  sectionIndex: number;
  sectionCount: number;
  currencyCode: string;
  onRemove: (row: FriendListItem) => void;
  onPrimaryAction: (row: FriendListItem) => void;
}

export function FriendRow({
  row,
  sectionIndex,
  sectionCount,
  currencyCode,
  onRemove,
  onPrimaryAction,
}: FriendRowProps): React.JSX.Element {
  const { color, radius, space } = useUI();
  const router = useRouter();

  const { friend, balance, recentExpense } = row;
  const balanceCopy = getBalanceCopy(balance, currencyCode);
  const isFirst = sectionIndex === 0;
  const isLast = sectionIndex === sectionCount - 1;
  const actionLabel = balance > 0 ? "Remind" : balance < 0 ? "Settle" : "Add";
  const ActionIcon = balance > 0 ? icons.Bell : balance < 0 ? icons.CheckCircle2 : icons.Plus;

  return (
    <View style={{ paddingHorizontal: space.page }}>
      <SwipeableRow
        onDelete={() => onRemove(row)}
        onSettle={
          balance !== 0
            ? () =>
                router.push({
                  pathname: "/settle/[id]",
                  params: { id: friend.id },
                })
            : undefined
        }
        onRemind={balance > 0 ? () => onPrimaryAction(row) : undefined}
      >
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push(`/friend/${friend.id}`);
          }}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            minHeight: 78,
            paddingVertical: 12,
            paddingHorizontal: 14,
            backgroundColor: color.surface,
            borderWidth: 1,
            borderColor: color.border,
            borderTopWidth: isFirst ? 1 : 0,
            borderTopLeftRadius: isFirst ? radius.lg : 0,
            borderTopRightRadius: isFirst ? radius.lg : 0,
            borderBottomLeftRadius: isLast ? radius.lg : 0,
            borderBottomRightRadius: isLast ? radius.lg : 0,
            opacity: pressed ? 0.62 : 1,
          })}
        >
          <AppUserAvatar user={friend} size="md" balance={balance} />

          <View style={{ flex: 1, minWidth: 0, marginLeft: 12, marginRight: 10 }}>
            <Typography
              numberOfLines={1}
              style={{
                fontSize: 16,
                lineHeight: 21,
                color: color.text,
                fontFamily: "IBMPlexSans_600SemiBold",
                letterSpacing: -0.2,
              }}
            >
              {friend.name}
            </Typography>
            <Typography
              numberOfLines={1}
              style={{
                marginTop: 2,
                fontSize: 13,
                lineHeight: 17,
                color: color.muted,
                fontFamily: "IBMPlexSans_500Medium",
              }}
            >
              {recentExpense
                ? `${recentExpense.title} - ${formatActivityDate(recentExpense.date)}`
                : row.friendship
                  ? friend.email
                  : "Shared group contact"}
            </Typography>
          </View>

          <View style={{ alignItems: "flex-end", maxWidth: 116 }}>
            <View
              style={{
                paddingHorizontal: 9,
                paddingVertical: 5,
                borderRadius: 999,
                backgroundColor: balanceCopy.bg,
                borderWidth: 1,
                borderColor: color.border,
              }}
            >
              <Typography
                numberOfLines={1}
                adjustsFontSizeToFit
                style={{
                  fontSize: 13,
                  lineHeight: 16,
                  color: balanceCopy.color,
                  fontFamily: "IBMPlexSans_600SemiBold",
                }}
              >
                {balance === 0 ? balanceCopy.label : balanceCopy.amount}
              </Typography>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={(event) => {
                event.stopPropagation();
                onPrimaryAction(row);
              }}
              style={({ pressed }) => ({
                marginTop: 7,
                minHeight: 36,
                paddingHorizontal: 9,
                borderRadius: 999,
                backgroundColor: balance === 0 ? color.control : color.text,
                borderWidth: 1,
                borderColor: balance === 0 ? color.border : color.text,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
                opacity: pressed ? 0.72 : 1,
              })}
            >
              <ActionIcon
                size={13}
                color={balance === 0 ? color.text : color.textInverse}
                strokeWidth={2}
              />
              <Typography
                style={{
                  fontSize: 12,
                  lineHeight: 15,
                  color: balance === 0 ? color.text : color.textInverse,
                  fontFamily: "IBMPlexSans_600SemiBold",
                }}
              >
                {actionLabel}
              </Typography>
            </Pressable>
          </View>
        </Pressable>
      </SwipeableRow>
    </View>
  );
}
