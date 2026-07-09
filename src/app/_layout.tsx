import { Stack, SplashScreen } from "expo-router";
import type { JSX } from "react";
import { useEffect } from "react";
import { Text, TextInput } from "react-native";
import { useFonts } from "expo-font";

import { AppProvider } from "@/providers/AppProvider";
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
  allowFontScaling: false,
  maxFontSizeMultiplier: 1,
};

TextInputComponent.defaultProps = {
  ...TextInputComponent.defaultProps,
  allowFontScaling: false,
  maxFontSizeMultiplier: 1,
};

export default function RootLayout(): JSX.Element | null {
  const [loaded] = useFonts({
    Sora_600SemiBold: require("@/assets/fonts/Sora-SemiBold.ttf"),
    IBMPlexSans_400Regular: require("@/assets/fonts/IBMPlexSans-Regular.ttf"),
    IBMPlexSans_500Medium: require("@/assets/fonts/IBMPlexSans-Medium.ttf"),
    IBMPlexSans_600SemiBold: require("@/assets/fonts/IBMPlexSans-SemiBold.ttf"),
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
