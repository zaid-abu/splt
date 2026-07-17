import type { JSX } from "react";
import { ScrollView, Pressable } from "react-native";
import { Typography } from "heroui-native";
import * as Haptics from "expo-haptics";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { formatAmount } from "@/components/ui/AmountDisplay";
import { useUI } from "@/components/ui";
import type { GroupMember } from "@/types";

export interface GroupMemberBarProps {
  members: GroupMember[];
  currentUserId?: string;
  memberBalances: Map<string, number>;
  currency: string;
  onMemberPress: (userId: string) => void;
}

export function GroupMemberBar({
  members,
  currentUserId,
  memberBalances,
  currency,
  onMemberPress,
}: GroupMemberBarProps): JSX.Element {
  const { color, radius } = useUI();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        gap: 10,
        minHeight: 56,
        alignItems: "center",
      }}
    >
      {members.map((member) => {
        const isMe = member.userId === currentUserId;
        const balance = memberBalances.get(member.userId) ?? 0;
        const hasBalance = Math.abs(balance) > 0.005;
        return (
          <Pressable
            key={member.userId}
            accessibilityRole="button"
            accessibilityLabel={isMe ? "You" : member.user.name}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onMemberPress(member.userId);
            }}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              paddingRight: 14,
              paddingLeft: 6,
              paddingVertical: 6,
              borderRadius: radius.pill,
              backgroundColor: color.control,
              borderWidth: 1,
              borderColor: color.border,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <AppUserAvatar user={member.user} size="sm" />
            <Typography
              numberOfLines={1}
              style={{
                fontSize: 14,
                color: color.text,
                fontFamily: "IBMPlexSans_600SemiBold",
              }}
            >
              {isMe ? "You" : member.user.name.split(" ")[0]}
            </Typography>
            {hasBalance && (
              <Typography
                style={{
                  fontSize: 12,
                  color: balance > 0 ? color.success : color.danger,
                  fontFamily: "IBMPlexSans_600SemiBold",
                  marginLeft: -4,
                }}
              >
                {formatAmount(Math.abs(balance), currency)}
              </Typography>
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
