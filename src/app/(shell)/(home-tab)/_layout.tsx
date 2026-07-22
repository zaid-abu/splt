import { Stack } from "expo-router";

export default function HomeTabLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "transparent" } }}>
      <Stack.Screen name="home" />
    </Stack>
  );
}
