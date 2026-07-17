import type { JSX } from "react";
import { View } from "react-native";
import { Typography } from "heroui-native";
import { useUI } from "@/components/ui";
import { ActivityItem } from "@/features/activity/components/ActivityItem";
import type { Activity } from "@/types";

interface ActivitySectionProps {
  title: string;
  data: Activity[];
}

export function ActivitySection({ title, data }: ActivitySectionProps): JSX.Element {
  const { color, radius } = useUI();

  return (
    <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
      <Typography
        style={{
          fontSize: 11,
          fontFamily: "IBMPlexSans_600SemiBold",
          color: color.muted,
          textTransform: "uppercase",
          letterSpacing: 1.4,
          marginBottom: 10,
          paddingLeft: 2,
        }}
      >
        {title}
      </Typography>

      <View
        style={{
          backgroundColor: color.surface,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: color.border,
          overflow: "hidden",
        }}
      >
        {data.map((activity, idx) => (
          <ActivityItem
            key={activity.id}
            activity={activity}
            index={idx}
            isLast={idx === data.length - 1}
          />
        ))}
      </View>
    </View>
  );
}
