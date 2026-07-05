import { Stack, SplashScreen } from "expo-router";
import type { JSX } from "react";
import { useEffect } from "react";
import { useFonts, UnicaOne_400Regular } from "@expo-google-fonts/unica-one";
import {
  CrimsonText_400Regular,
  CrimsonText_400Regular_Italic,
  CrimsonText_600SemiBold,
  CrimsonText_700Bold,
} from "@expo-google-fonts/crimson-text";

import { AppProvider } from "@/providers/AppProvider";
import "../global.css";

export { ErrorFallback as ErrorBoundary } from "@/components/feedback/ErrorFallback";

SplashScreen.preventAutoHideAsync();

export default function RootLayout(): JSX.Element | null {
  const [loaded] = useFonts({
    UnicaOne_400Regular,
    CrimsonText_400Regular,
    CrimsonText_400Regular_Italic,
    CrimsonText_600SemiBold,
    CrimsonText_700Bold,
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) return null;

  return (
    <AppProvider>
      <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="group/new"
          options={{
            presentation: "transparentModal",
            animation: "fade",
            headerShown: false,
          }}
        />
        <Stack.Screen name="group/[id]" options={{ headerShown: false }} />
        <Stack.Screen
          name="expense/[id]"
          options={{
            presentation: "modal",
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="settle/[id]"
          options={{
            presentation: "modal",
            headerShown: false,
          }}
        />
      </Stack>
    </AppProvider>
  );
}
