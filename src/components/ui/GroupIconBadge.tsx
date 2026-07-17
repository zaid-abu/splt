import { Typography } from "heroui-native";
import type { JSX } from "react";
import { View } from "react-native";
import * as icons from "lucide-react-native";

import { useUI } from "@/components/ui";
import type { Group } from "@/types";

type GroupTone = {
  fill: string;
  icon: string;
};

const GROUP_ICON_PALETTE: GroupTone[] = [
  { fill: "#F5E7DD", icon: "#9A5F3E" },
  { fill: "#EFE4D6", icon: "#8C6B43" },
  { fill: "#E8EEE6", icon: "#5F7A5D" },
  { fill: "#E3ECEB", icon: "#4B7772" },
  { fill: "#E6E8F1", icon: "#5C648F" },
  { fill: "#EFE3E8", icon: "#926177" },
  { fill: "#ECE4DE", icon: "#7F6552" },
  { fill: "#E6EBE2", icon: "#6A7A58" },
];

const SIZE_MAP = {
  sm: { size: 40, radius: 14, font: 17, inset: 2, icon: 18 },
  md: { size: 48, radius: 18, font: 20, inset: 2, icon: 21 },
  lg: { size: 64, radius: 22, font: 24, inset: 3, icon: 26 },
} as const;

function getPaletteIndex(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }

  return Math.abs(hash) % GROUP_ICON_PALETTE.length;
}

function getFallbackLabel(group: Group): string {
  return group.icon && group.icon.length <= 2
    ? group.icon
    : group.name.substring(0, 1).toUpperCase();
}

export function getGroupTone(group: Group): GroupTone {
  return GROUP_ICON_PALETTE[getPaletteIndex(group.id)];
}

export function GroupIconBadge({
  group,
  size = "md",
}: {
  group: Group;
  size?: keyof typeof SIZE_MAP;
}): JSX.Element {
  const dims = SIZE_MAP[size] ?? SIZE_MAP.md;
  const tone = getGroupTone(group);
  const GroupIconComp = (icons as any)[group.icon] as
    React.ComponentType<{ size: number; color: string; strokeWidth: number }> | undefined;
  const contentRadius = Math.max(dims.radius - dims.inset, 10);
  const { color, radius, space, shadow } = useUI();

  return (
    <View
      style={{
        width: dims.size,
        height: dims.size,
        borderRadius: dims.radius,
        backgroundColor: color.control,
        borderWidth: 1,
        borderColor: color.border,
        padding: dims.inset,
      }}
    >
      <View
        style={{
          flex: 1,
          borderRadius: contentRadius,
          backgroundColor: tone.fill,
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {GroupIconComp ? (
          <GroupIconComp size={dims.icon} color={tone.icon} strokeWidth={1.75} />
        ) : (
          <Typography
            style={{
              fontSize: dims.font,
              color: tone.icon,
              fontFamily: "IBMPlexSans_600SemiBold",
              letterSpacing: -0.3,
            }}
            numberOfLines={1}
          >
            {getFallbackLabel(group)}
          </Typography>
        )}
      </View>
    </View>
  );
}
