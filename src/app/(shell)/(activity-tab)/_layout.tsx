import { Stack } from "expo-router";

export default function ActivityTabLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="activity" />
    </Stack>
  );
}
