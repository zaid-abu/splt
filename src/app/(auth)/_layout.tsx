import { Stack } from "expo-router";
import type { JSX } from "react";

export default function AuthLayout(): JSX.Element {
  return (
    <Stack screenOptions={{ headerShown: false, animation: "fade_from_bottom" }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
