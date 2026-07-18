import { Stack } from "expo-router";
import type { JSX } from "react";
import { useUIStore } from "@/store/useUIStore";
import { CORAL_COLORS } from "@/components/coral/theme";

export default function AuthLayout(): JSX.Element {
  const isDarkMode = useUIStore((s) => s.isDarkMode);
  const backgroundColor = isDarkMode ? CORAL_COLORS.dark.bg : CORAL_COLORS.light.bg;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        contentStyle: { backgroundColor },
      }}
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="reset-password" />
    </Stack>
  );
}
