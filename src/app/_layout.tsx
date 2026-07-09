import { Stack, SplashScreen } from "expo-router";
import type { JSX } from "react";
import { useEffect } from "react";
import { Text, TextInput } from "react-native";
import { useFonts, Sora_600SemiBold } from "@expo-google-fonts/sora";
import {
  IBMPlexSans_400Regular,
  IBMPlexSans_500Medium,
  IBMPlexSans_600SemiBold,
} from "@expo-google-fonts/ibm-plex-sans";

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
    Sora_600SemiBold,
    IBMPlexSans_400Regular,
    IBMPlexSans_500Medium,
    IBMPlexSans_600SemiBold,
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
            presentation: "transparentModal",
            animation: "fade",
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
