import type { JSX, ComponentType } from "react";
import { View, Pressable } from "react-native";
import { Typography } from "heroui-native";
import * as icons from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { GroupRow } from "@/features/groups/components/GroupRow";
import { UI } from "@/components/ui/native-ui";
import { ListRowSkeleton } from "@/components/ui/Skeleton";
import type { Group } from "@/types";

type LucideIcon = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

function EmptyIconShell({ icon: Icon }: { icon: LucideIcon }): JSX.Element {
  return (
    <View
      style={{
        width: 56,
        height: 56,
        borderRadius: UI.radius.lg,
        backgroundColor: UI.color.control,
        borderWidth: 1,
        borderColor: UI.color.border,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
      }}
    >
      <Icon size={24} color={UI.color.muted} strokeWidth={1.5} />
    </View>
  );
}

function SectionLabel({
  children,
  rightAction,
}: {
  children: string;
  rightAction?: JSX.Element;
}): JSX.Element {
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
          color: UI.color.text,
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

export interface DashboardGroupsProps {
  activeGroups: Array<{ group: Group; netBalance: number }>;
  openGroupCount: number;
  isLoadingGroups: boolean;
  preferredCurrency: string;
  onGroupPress: (groupId: string) => void;
  onViewAllGroups: () => void;
  onCreateGroup: () => void;
}

export function DashboardGroups({
  activeGroups,
  openGroupCount,
  isLoadingGroups,
  preferredCurrency,
  onGroupPress,
  onViewAllGroups,
  onCreateGroup,
}: DashboardGroupsProps): JSX.Element {
  return (
    <Animated.View
      entering={FadeInDown.duration(350).delay(140).springify()}
      style={{ paddingHorizontal: UI.space.page, marginBottom: 28 }}
    >
      <SectionLabel
        rightAction={
          <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
            <Typography
              style={{
                fontSize: 13,
                color: UI.color.muted,
                fontFamily: "IBMPlexSans_500Medium",
              }}
            >
              {openGroupCount} open
            </Typography>
            <Pressable
              accessibilityRole="button"
              onPress={onViewAllGroups}
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
                  color: UI.color.text,
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
                borderRadius: UI.radius.pill,
                borderWidth: 1,
                borderColor: UI.color.border,
                backgroundColor: UI.color.control,
                opacity: pressed ? 0.72 : 1,
              })}
            >
              <icons.Plus size={22} color={UI.color.text} strokeWidth={2.5} />
            </Pressable>
          </View>
        }
      >
        Groups
      </SectionLabel>

      <View
        style={{
          backgroundColor: UI.color.surface,
          borderRadius: UI.radius.lg,
          borderWidth: 1,
          borderColor: UI.color.border,
          paddingHorizontal: 14,
        }}
      >
        {isLoadingGroups ? (
          <View>
            <ListRowSkeleton />
            <ListRowSkeleton />
          </View>
        ) : activeGroups.length > 0 ? (
          activeGroups.map(({ group, netBalance }, idx) => (
            <GroupRow
              key={group.id}
              group={group}
              balance={netBalance}
              currency={preferredCurrency}
              isLast={idx === activeGroups.length - 1}
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
                color: UI.color.text,
                fontFamily: "IBMPlexSans_600SemiBold",
                fontSize: 17,
                marginBottom: 4,
              }}
            >
              No groups yet
            </Typography>
            <Typography
              style={{
                color: UI.color.muted,
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
                backgroundColor: UI.color.text,
                borderRadius: UI.radius.pill,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Typography
                style={{
                  fontSize: 14,
                  color: UI.color.textInverse,
                  fontFamily: "IBMPlexSans_600SemiBold",
                }}
              >
                Create group
              </Typography>
            </Pressable>
          </View>
        )}
      </View>
    </Animated.View>
  );
}
