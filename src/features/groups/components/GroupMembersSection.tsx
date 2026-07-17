import type { JSX } from "react";
import { View, Pressable } from "react-native";
import { Typography } from "heroui-native";
import * as icons from "lucide-react-native";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { getCurrencySymbol } from "@/components/ui/AmountDisplay";
import { useUI, SectionLabel } from "@/components/ui";
import type { GroupMember } from "@/types";

export interface GroupMembersSectionProps {
  members: GroupMember[];
  currentUserId: string;
  balances: Map<string, number>;
  currencyCode: string;
  onAddMemberPress: () => void;
  onRemoveMember: (userId: string, userName: string) => void;
}

export function GroupMembersSection({
  members,
  currentUserId,
  balances,
  currencyCode,
  onAddMemberPress,
  onRemoveMember,
}: GroupMembersSectionProps): JSX.Element {
  const { color, radius } = useUI();

  return (
    <>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <SectionLabel>Members</SectionLabel>
        <Pressable
          accessibilityRole="button"
          onPress={onAddMemberPress}
          hitSlop={8}
          style={({ pressed }) => ({ opacity: pressed ? 0.65 : 1 })}
        >
          <Typography
            style={{
              fontSize: 14,
              color: color.text,
              fontFamily: "IBMPlexSans_600SemiBold",
            }}
          >
            + Add Member
          </Typography>
        </Pressable>
      </View>

      <View
        style={{
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: color.border,
          backgroundColor: color.surface,
          overflow: "hidden",
        }}
      >
        {members.map((member, idx) => {
          const memBalance = balances.get(member.userId) ?? 0;
          const isLast = idx === members.length - 1;
          return (
            <View
              key={member.userId}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingVertical: 14,
                paddingHorizontal: 16,
                borderBottomWidth: isLast ? 0 : 1,
                borderBottomColor: color.border,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                <AppUserAvatar user={member.user} size="md" />
                <View>
                  <Typography
                    style={{
                      fontSize: 16,
                      color: color.text,
                      fontFamily: "IBMPlexSans_600SemiBold",
                    }}
                  >
                    {member.userId === currentUserId ? "You" : member.user.name}
                  </Typography>
                  <Typography
                    style={{
                      fontSize: 14,
                      color: color.muted,
                      fontFamily: "IBMPlexSans_500Medium",
                      marginTop: 2,
                    }}
                  >
                    {getCurrencySymbol(currencyCode)}
                    {Math.abs(memBalance).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Typography>
                </View>
              </View>
              {member.userId !== currentUserId && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${member.user.name}`}
                  onPress={() => onRemoveMember(member.userId, member.user.name)}
                  hitSlop={8}
                  style={({ pressed }) => ({
                    width: 44,
                    height: 44,
                    borderRadius: radius.pill,
                    backgroundColor: color.control,
                    borderWidth: 1,
                    borderColor: color.border,
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: pressed ? 0.65 : 1,
                  })}
                >
                  <icons.X size={18} color={color.muted} strokeWidth={2} />
                </Pressable>
              )}
            </View>
          );
        })}
      </View>
    </>
  );
}
