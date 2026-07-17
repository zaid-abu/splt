import type { JSX } from "react";
import { GlassSection } from "@/components/ui";
import { ActivityItem } from "@/features/activity/components/ActivityItem";
import type { Activity } from "@/types";

interface ActivitySectionProps {
  title: string;
  data: Activity[];
}

export function ActivitySection({ title, data }: ActivitySectionProps): JSX.Element {
  return (
    <GlassSection title={title}>
      {data.map((activity, idx) => (
        <ActivityItem
          key={activity.id}
          activity={activity}
          index={idx}
          isLast={idx === data.length - 1}
        />
      ))}
    </GlassSection>
  );
}
