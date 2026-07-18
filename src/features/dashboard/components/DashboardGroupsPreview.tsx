import type { JSX } from "react";
import { View, Pressable, Text } from "react-native";
import * as icons from "lucide-react-native";
import { useUI } from "@/components/ui";
import { GroupIconBadge } from "@/components/ui/GroupIconBadge";
import { formatAmount } from "@/components/ui/AmountDisplay";
import { ListRowSkeleton } from "@/components/ui/Skeleton";
import { MoneyRow, Eyebrow, useCoralColors } from "@/components/coral";
import type { Group } from "@/types";

type LucideIcon = React.ComponentType<{
  size?: number;
  color?: string;
  strokeWidth?: number;
}>;

function EmptyIconShell({ icon: Icon }: { icon: LucideIcon }): JSX.Element {
  const { color, radius } = useUI();
  return (
    <View
      style={{
        width: 56,
        height: 56,
        borderRadius: radius.lg,
        backgroundColor: color.control,
        borderWidth: 1,
        borderColor: color.border,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
      }}
    >
      <Icon size={24} color={color.muted} strokeWidth={1.5} />
    </View>
  );
}

interface GroupItem {
  group: Group;
  netBalance: number;
}

interface DashboardGroupsPreviewProps {
  groups: GroupItem[];
  openCount: number;
  isLoading: boolean;
  onViewAll: () => void;
  onCreateGroup: () => void;
  onGroupPress: (groupId: string) => void;
}

export function DashboardGroupsPreview({
  groups,
  openCount,
  isLoading,
  onViewAll,
  onCreateGroup,
  onGroupPress,
}: DashboardGroupsPreviewProps): JSX.Element {
  const { color, radius } = useUI();
  const coral = useCoralColors();

  return (
    <View style={{ marginBottom: 28 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 4,
          paddingHorizontal: 2,
        }}
      >
        <Text
          style={{
            fontSize: 13,
            color: color.muted,
            fontFamily: "InstrumentSans_500Medium",
          }}
        >
          {openCount} open
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Create group"
          onPress={onCreateGroup}
          hitSlop={8}
          style={({ pressed }) => ({
            width: 44,
            height: 44,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: radius.pill,
            borderWidth: 1,
            borderColor: color.border,
            backgroundColor: color.control,
            opacity: pressed ? 0.72 : 1,
          })}
        >
          <icons.Plus size={22} color={color.text} strokeWidth={2.5} />
        </Pressable>
      </View>

      <View style={{ marginBottom: 28 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 10,
          }}
        >
          <Eyebrow style={{ marginTop: 0, marginBottom: 0 }}>Groups</Eyebrow>
          <Pressable onPress={onViewAll} hitSlop={8}>
            <Text
              style={{
                fontSize: 13,
                fontFamily: "InstrumentSans_600SemiBold",
                color: color.muted,
              }}
            >
              View all
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
          {isLoading ? (
            <View>
              <ListRowSkeleton />
              <ListRowSkeleton />
            </View>
          ) : groups.length > 0 ? (
            groups.map(({ group, netBalance }) => {
              const memberCount = group.members.length;
              let subAmountText = "";
              let subAmountTone: "neutral" | "positive" | "negative" = "neutral";

              if (netBalance < 0) {
                subAmountText = `${formatAmount(Math.abs(netBalance), group.currency)}`;
                subAmountTone = "negative";
              } else if (netBalance > 0) {
                subAmountText = `${formatAmount(netBalance, group.currency)}`;
                subAmountTone = "positive";
              } else {
                subAmountText = "Settled";
              }

              return (
                <MoneyRow
                  key={group.id}
                  avatar={<GroupIconBadge group={group} size="md" />}
                  title={group.name}
                  subtitle={`${memberCount} participants`}
                  onPress={() => onGroupPress(group.id)}
                  amount={subAmountText}
                  amountTone={subAmountTone}
                  rightElement={<icons.ChevronRight size={18} color={color.muted} />}
                />
              );
            })
          ) : (
            <View style={{ paddingVertical: 28, alignItems: "center", justifyContent: "center" }}>
              <EmptyIconShell icon={icons.UsersRound} />
              <Text
                style={{
                  color: color.text,
                  fontFamily: "InstrumentSans_600SemiBold",
                  fontSize: 17,
                  marginBottom: 4,
                }}
              >
                No groups yet
              </Text>
              <Text
                style={{
                  color: color.muted,
                  fontFamily: "InstrumentSans_500Medium",
                  fontSize: 14,
                  textAlign: "center",
                  marginBottom: 16,
                }}
              >
                Start a shared space for expenses.
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={onCreateGroup}
                style={({ pressed }) => ({
                  paddingHorizontal: 16,
                  minHeight: 44,
                  backgroundColor: color.text,
                  borderRadius: radius.pill,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <Text
                  style={{
                    fontSize: 14,
                    color: color.textInverse,
                    fontFamily: "InstrumentSans_600SemiBold",
                  }}
                >
                  Create group
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
