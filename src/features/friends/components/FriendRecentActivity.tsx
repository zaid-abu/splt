import { View } from "react-native";
import { Typography } from "heroui-native";
import * as icons from "lucide-react-native";
import { ActivityItem } from "@/features/activity/components/ActivityItem";
import { SectionLabel, useUI } from "@/components/ui";
import Animated, { FadeInDown } from "react-native-reanimated";
import type { Activity } from "@/types";

interface FriendRecentActivityProps {
  sharedActivities: Activity[];
}

export function FriendRecentActivity({
  sharedActivities,
}: FriendRecentActivityProps): React.JSX.Element {
  const { color, radius } = useUI();

  return (
    <Animated.View
      entering={FadeInDown.duration(400).delay(150).springify()}
      style={{ paddingHorizontal: 24, marginBottom: 40 }}
    >
      <SectionLabel>Recent Activity</SectionLabel>

      <View
        style={{
          borderRadius: radius.lg,
          borderWidth: sharedActivities.length === 0 ? 1 : 0,
          borderColor: color.border,
          backgroundColor:
            sharedActivities.length === 0 ? color.surface : "transparent",
        }}
      >
        {sharedActivities.length === 0 ? (
          <View
            style={{
              paddingVertical: 36,
              alignItems: "center",
            }}
          >
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: radius.pill,
                backgroundColor: color.control,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
                borderWidth: 1,
                borderColor: color.border,
              }}
            >
              <icons.Receipt size={24} color={color.text} strokeWidth={1.8} />
            </View>
            <Typography
              style={{
                fontSize: 16,
                color: color.text,
                fontFamily: "IBMPlexSans_600SemiBold",
                marginBottom: 8,
              }}
            >
              No shared activity
            </Typography>
            <Typography
              style={{
                fontSize: 14,
                color: color.muted,
                fontFamily: "IBMPlexSans_500Medium",
              }}
            >
              Add an expense to get started
            </Typography>
          </View>
        ) : (
          <View
            style={{
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: color.border,
              backgroundColor: color.surface,
            }}
          >
            {sharedActivities.map((activity, idx) => (
              <ActivityItem
                key={activity.id}
                activity={activity}
                index={idx}
                isLast={idx === sharedActivities.length - 1}
              />
            ))}
          </View>
        )}
      </View>
    </Animated.View>
  );
}
