import { Stack } from "expo-router";

export default function ActivityTabLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "transparent" } }}>
      <Stack.Screen name="activity" />
    </Stack>
  );
}
