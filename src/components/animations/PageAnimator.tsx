import type { JSX, PropsWithChildren } from "react";
import { View } from "react-native";

interface FocusAwareViewProps extends PropsWithChildren {
  delay?: number;
  style?: any;
}

export function FocusAwareView({ children, style }: FocusAwareViewProps): JSX.Element {
  return <View style={style}>{children}</View>;
}
