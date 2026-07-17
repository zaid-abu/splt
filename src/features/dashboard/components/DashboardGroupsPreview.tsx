import type { JSX } from "react";
import { View, Pressable } from "react-native";
import { Typography } from "heroui-native";
import * as icons from "lucide-react-native";
import { useUI } from "@/components/ui";
import { GroupRow } from "@/features/groups/components/GroupRow";
import { ListRowSkeleton } from "@/components/ui/Skeleton";
import type { Group } from "@/types";

type LucideIcon = React.ComponentType<{
  size?: number;
  color?: string;
  strokeWidth?: number;
}>;

function SectionLabel({
  children,
  rightAction,
}: {
  children: string;
  rightAction?: JSX.Element;
}): JSX.Element {
  const { color } = useUI();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 14,
      }}
    >
      <Typography
        style={{
          fontSize: 18,
          color: color.text,
          fontFamily: "IBMPlexSans_600SemiBold",
          letterSpacing: -0.2,
        }}
      >
        {children}
      </Typography>
      {rightAction}
    </View>
  );
}

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

  return (
    <View style={{ marginBottom: 28 }}>
      <SectionLabel
        rightAction={
          <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
            <Typography
              style={{
                fontSize: 13,
                color: color.muted,
                fontFamily: "IBMPlexSans_500Medium",
              }}
            >
              {openCount} open
            </Typography>
            <Pressable
              accessibilityRole="button"
              onPress={onViewAll}
              hitSlop={8}
              style={({ pressed }) => ({
                minHeight: 44,
                justifyContent: "center",
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Typography
                style={{
                  fontSize: 14,
                  color: color.text,
                  fontFamily: "IBMPlexSans_600SemiBold",
                }}
              >
                View all
              </Typography>
            </Pressable>
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
        }
      >
        Groups
      </SectionLabel>

      <View
        style={{
          backgroundColor: color.surface,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: color.border,
          paddingHorizontal: 14,
        }}
      >
        {isLoading ? (
          <View>
            <ListRowSkeleton />
            <ListRowSkeleton />
          </View>
        ) : groups.length > 0 ? (
          groups.map(({ group, netBalance }, idx) => (
            <GroupRow
              key={group.id}
              group={group}
              balance={netBalance}
              currency={group.currency}
              isLast={idx === groups.length - 1}
              onPress={() => onGroupPress(group.id)}
            />
          ))
        ) : (
          <View
            style={{ paddingVertical: 28, alignItems: "center", justifyContent: "center" }}
          >
            <EmptyIconShell icon={icons.UsersRound} />
            <Typography
              style={{
                color: color.text,
                fontFamily: "IBMPlexSans_600SemiBold",
                fontSize: 17,
                marginBottom: 4,
              }}
            >
              No groups yet
            </Typography>
            <Typography
              style={{
                color: color.muted,
                fontFamily: "IBMPlexSans_500Medium",
                fontSize: 14,
                textAlign: "center",
                marginBottom: 16,
              }}
            >
              Start a shared space for expenses.
            </Typography>
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
              <Typography
                style={{
                  fontSize: 14,
                  color: color.textInverse,
                  fontFamily: "IBMPlexSans_600SemiBold",
                }}
              >
                Create group
              </Typography>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}
