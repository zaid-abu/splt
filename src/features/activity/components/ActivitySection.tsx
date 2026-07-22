import type { JSX } from "react";
import { View } from "react-native";
import { useCoralColors , Eyebrow } from "@/components/coral";
import { ActivityItem } from "@/features/activity/components/ActivityItem";
import type { Activity } from "@/types";

interface ActivitySectionProps {
  title: string;
  data: Activity[];
}

export function ActivitySection({ title, data }: ActivitySectionProps): JSX.Element {
  const coral = useCoralColors();

  return (
    <View style={{ marginBottom: 28 }}>
      <Eyebrow style={{ marginTop: 0 }}>{title}</Eyebrow>
      <View
        style={{
          backgroundColor: coral.surface,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: coral.border,
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
