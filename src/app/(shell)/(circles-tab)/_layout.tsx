import { Stack } from "expo-router";

export default function CirclesTabLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "transparent" } }}>
      <Stack.Screen name="circles" />
    </Stack>
  );
}
