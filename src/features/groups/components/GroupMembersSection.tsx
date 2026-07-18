import type { JSX } from "react";
import { Pressable, View, Text } from "react-native";
import * as icons from "lucide-react-native";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { getCurrencySymbol } from "@/components/ui/AmountDisplay";
import { useUI } from "@/components/ui";
import { MoneyRow, Eyebrow, useCoralColors } from "@/components/coral";
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
  const coral = useCoralColors();

  return (
    <View style={{ marginBottom: 28 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <Eyebrow style={{ marginTop: 0, marginBottom: 0 }}>Members</Eyebrow>
        <Pressable onPress={onAddMemberPress} hitSlop={8}>
          <Text
            style={{
              fontSize: 13,
              fontFamily: "InstrumentSans_600SemiBold",
              color: color.muted,
            }}
          >
            + Add Member
          </Text>
        </Pressable>
      </View>
      <View
        style={{
          backgroundColor: coral.surface,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: coral.border,
          overflow: "hidden",
        }}
      >
        {members.map((member) => {
          const memBalance = balances.get(member.userId) ?? 0;
          return (
            <MoneyRow
              key={member.userId}
              avatar={<AppUserAvatar user={member.user} size="md" />}
              title={member.userId === currentUserId ? "You" : member.user.name}
              amount={`${getCurrencySymbol(currencyCode)}${Math.abs(memBalance).toLocaleString(
                undefined,
                {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }
              )}`}
              amountTone={memBalance > 0 ? "positive" : memBalance < 0 ? "negative" : "neutral"}
              rightElement={
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
      </View>
    </View>
  );
}
