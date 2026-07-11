import type { JSX, ReactNode } from "react";
import { View } from "react-native";
import type { ViewStyle } from "react-native";
import { UI } from "@/components/ui/native-ui";

interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
  padding?: number;
}

export function Card({ children, style, padding = 16 }: CardProps): JSX.Element {
  return (
    <View
      style={[
        {
          backgroundColor: UI.color.surface,
          borderRadius: UI.radius.lg,
          borderWidth: 1,
          borderColor: UI.color.border,
          padding,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
