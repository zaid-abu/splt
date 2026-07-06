import type { JSX } from "react";
import { ActivityIndicator, View } from "react-native";
import { twMerge } from "tailwind-merge";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = { sm: 20, md: 32, lg: 48 };

export function Spinner({ size = "md", className }: SpinnerProps): JSX.Element {
  return (
    <View className={twMerge("items-center justify-center py-8", className)}>
      <ActivityIndicator size={sizeMap[size]} color="#FB923C" />
    </View>
  );
}
