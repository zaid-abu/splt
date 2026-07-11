import { Stack, SplashScreen } from "expo-router";
import type { JSX } from "react";
import { useEffect, useState } from "react";
import { Text, TextInput } from "react-native";
import { useFonts } from "expo-font";
import { supabase } from "@/services/supabase/client";

import { AppProvider } from "@/providers/AppProvider";
import { useUIStore } from "@/store/useUIStore";
import { UI, applyTheme } from "@/components/ui/native-ui";
import { Uniwind } from "uniwind";
import "../global.css";

export { ErrorFallback as ErrorBoundary } from "@/components/feedback/ErrorFallback";

SplashScreen.preventAutoHideAsync();

const TextComponent = Text as typeof Text & {
  defaultProps?: Record<string, unknown>;
};
const TextInputComponent = TextInput as typeof TextInput & {
  defaultProps?: Record<string, unknown>;
};

TextComponent.defaultProps = {
  ...TextComponent.defaultProps,
  maxFontSizeMultiplier: 1.3,
};

TextInputComponent.defaultProps = {
  ...TextInputComponent.defaultProps,
  maxFontSizeMultiplier: 1.3,
};

export default function RootLayout(): JSX.Element | null {
  const [loaded] = useFonts({
    Sora_600SemiBold: require("@/assets/fonts/Sora-SemiBold.ttf"),
    IBMPlexSans_400Regular: require("@/assets/fonts/IBMPlexSans-Regular.ttf"),
    IBMPlexSans_500Medium: require("@/assets/fonts/IBMPlexSans-Medium.ttf"),
    IBMPlexSans_600SemiBold: require("@/assets/fonts/IBMPlexSans-SemiBold.ttf"),
  });

  const [authReady, setAuthReady] = useState(false);
  const isDarkMode = useUIStore((s) => s.isDarkMode);

  // Apply theme on every render so UI.color is updated before children render
  applyTheme(isDarkMode);
  Uniwind.setTheme(isDarkMode ? "dark" : "light");

  useEffect(() => {
    if (!loaded) return;

    supabase.auth.getSession().then(() => {
      setAuthReady(true);
      SplashScreen.hideAsync();
    });
  }, [loaded]);

  if (!loaded || !authReady) return null;

  return (
    <AppProvider>
      <Stack
        key={isDarkMode ? "dark" : "light"}
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
          contentStyle: { backgroundColor: UI.color.bg },
        }}
      >
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
          name="expense/new"
          options={{
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
