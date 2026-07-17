import type { JSX } from "react";
import { Pressable } from "react-native";
import * as icons from "lucide-react-native";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { getCurrencySymbol } from "@/components/ui/AmountDisplay";
import { useUI, GlassSection, GlassRow } from "@/components/ui";
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
    <GlassSection
      title="Members"
      viewAllLabel="+ Add Member"
      onViewAll={onAddMemberPress}
    >
      {members.map((member) => {
        const memBalance = balances.get(member.userId) ?? 0;
        return (
          <GlassRow
            key={member.userId}
            icon={<AppUserAvatar user={member.user} size="md" />}
            title={member.userId === currentUserId ? "You" : member.user.name}
            subtitle={`${getCurrencySymbol(currencyCode)}${Math.abs(memBalance).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`}
            end={
              member.userId !== currentUserId ? (
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
              ) : null
            }
          />
        );
      })}
    </GlassSection>
  );
}
