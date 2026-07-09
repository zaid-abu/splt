import type { JSX } from "react";
import { View } from "react-native";
import * as icons from "lucide-react-native";

import { EXPENSE_CATEGORIES } from "@/types";
import type { ExpenseCategory } from "@/types";

const SHELL = "#FFFFFF";
const BORDER = "#E8E4DF";

type CategoryTone = {
  fill: string;
  icon: string;
};

const CATEGORY_TONES: Record<ExpenseCategory, CategoryTone> = {
  food: { fill: "#F5E7DD", icon: "#9A5F3E" },
  transport: { fill: "#E6E8F1", icon: "#5C648F" },
  accommodation: { fill: "#EFE3E8", icon: "#926177" },
  entertainment: { fill: "#EEE7F2", icon: "#7B668D" },
  shopping: { fill: "#F1E3DF", icon: "#A1675B" },
  utilities: { fill: "#E3ECEB", icon: "#4B7772" },
  health: { fill: "#E6EEE8", icon: "#5D7C69" },
  travel: { fill: "#E9E7EF", icon: "#69658A" },
  other: { fill: "#ECE4DE", icon: "#7F6552" },
};

const SIZE_MAP = {
  sm: { size: 36, radius: 14, icon: 18, inset: 2 },
  md: { size: 48, radius: 18, icon: 20, inset: 2 },
  lg: { size: 64, radius: 22, icon: 28, inset: 3 },
} as const;

function getCategoryIconName(category: string): keyof typeof icons {
  return (
    EXPENSE_CATEGORIES.find((item) => item.key === category)?.icon as keyof typeof icons | undefined
  ) || "Package";
}

export function getCategoryTone(category: string): CategoryTone {
  return CATEGORY_TONES[(category as ExpenseCategory) || "other"] || CATEGORY_TONES.other;
}

export function CategoryIconBadge({
  category,
  size = "md",
}: {
  category?: string;
  size?: keyof typeof SIZE_MAP;
}): JSX.Element {
  const dims = SIZE_MAP[size] ?? SIZE_MAP.md;
  const tone = getCategoryTone(category || "other");
  const iconName = getCategoryIconName(category || "other");
  const IconComp = (icons as any)[iconName] || icons.Package;
  const contentRadius = Math.max(dims.radius - dims.inset, 10);

  return (
    <View
      style={{
        width: dims.size,
        height: dims.size,
        borderRadius: dims.radius,
        backgroundColor: SHELL,
        borderWidth: 1,
        borderColor: BORDER,
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
        <IconComp size={dims.icon} color={tone.icon} strokeWidth={1.75} />
      </View>
    </View>
  );
}
