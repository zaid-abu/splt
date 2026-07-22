import { Stack } from "expo-router";

export default function MoreTabLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "transparent" }, animation: "slide_from_right" }}>
      <Stack.Screen name="more" />
      <Stack.Screen name="analytics" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="currencies" />
    </Stack>
  );
}
