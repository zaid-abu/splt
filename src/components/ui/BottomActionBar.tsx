import type { JSX } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUI } from "@/components/ui/native-ui";

interface BottomActionBarProps {
  children: React.ReactNode;
}

export function BottomActionBar({ children }: BottomActionBarProps): JSX.Element {
  const insets = useSafeAreaInsets();
  const { color, radius, space, shadow } = useUI();

  return (
    <View
      style={{
        paddingHorizontal: space.page,
        paddingTop: 16,
        paddingBottom: Math.max(insets.bottom, 16),
        flexDirection: "row",
        gap: 12,
        backgroundColor: color.bg,
        borderTopWidth: 1,
        borderTopColor: color.border,
      }}
    >
      {children}
    </View>
  );
}
