import { Stack } from "expo-router";

export default function CirclesTabLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="circles" />
    </Stack>
  );
}
