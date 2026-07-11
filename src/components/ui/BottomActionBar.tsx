import type { JSX } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { UI } from "@/components/ui/native-ui";

interface BottomActionBarProps {
  children: React.ReactNode;
}

export function BottomActionBar({ children }: BottomActionBarProps): JSX.Element {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        paddingHorizontal: UI.space.page,
        paddingTop: 16,
        paddingBottom: Math.max(insets.bottom, 16),
        flexDirection: "row",
        gap: 12,
        backgroundColor: UI.color.bg,
        borderTopWidth: 1,
        borderTopColor: UI.color.border,
      }}
    >
      {children}
    </View>
  );
}
