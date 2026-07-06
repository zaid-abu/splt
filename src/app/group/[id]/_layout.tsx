import { Stack } from "expo-router";
import type { JSX } from "react";

export default function GroupLayout(): JSX.Element {
  return (
    <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="settle" />
    </Stack>
  );
}
