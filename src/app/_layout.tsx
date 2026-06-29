import { Stack } from "expo-router";
import { HeroUINativeProvider } from "heroui-native";
import type { JSX } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { AppProvider } from "@/context/AppContext";
import "../global.css";

export default function RootLayout(): JSX.Element {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <HeroUINativeProvider config={{ devInfo: { stylingPrinciples: false } }}>
        <AppProvider>
          <Stack screenOptions={{ headerShown: false, animation: "fade_from_bottom" }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="group/new"
              options={{
                presentation: "modal",
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="group/[id]"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="expense/[id]"
              options={{
                presentation: "modal",
                headerShown: false,
              }}
            />
          </Stack>
        </AppProvider>
      </HeroUINativeProvider>
    </GestureHandlerRootView>
  );
}
