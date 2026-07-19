import { Stack, SplashScreen } from "expo-router";
import type { JSX } from "react";
import { useEffect } from "react";
import { Text, TextInput } from "react-native";
import { useFonts } from "expo-font";
import {
  InstrumentSans_400Regular,
  InstrumentSans_500Medium,
  InstrumentSans_600SemiBold,
} from "@expo-google-fonts/instrument-sans";
import { IBMPlexMono_500Medium, IBMPlexMono_600SemiBold } from "@expo-google-fonts/ibm-plex-mono";
import * as SystemUI from "expo-system-ui";
import { Uniwind } from "uniwind";

import { CORAL_COLORS } from "@/components/coral/theme";
import { AppProvider } from "@/providers/AppProvider";
import { useUIStore } from "@/store/useUIStore";
import "../global.css";

export { ErrorFallback as ErrorBoundary } from "@/components/feedback/ErrorFallback";

void SplashScreen.preventAutoHideAsync();

const TextComponent = Text as typeof Text & { defaultProps?: Record<string, unknown> };
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
    InstrumentSans_400Regular,
    InstrumentSans_500Medium,
    InstrumentSans_600SemiBold,
    IBMPlexMono_500Medium,
    IBMPlexMono_600SemiBold,
  });
  const isDarkMode = useUIStore((state) => state.isDarkMode);
  const backgroundColor = isDarkMode ? CORAL_COLORS.dark.bg : CORAL_COLORS.light.bg;

  Uniwind.setTheme(isDarkMode ? "dark" : "light");

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(backgroundColor);
  }, [backgroundColor]);

  useEffect(() => {
    if (loaded) void SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <AppProvider>
      <Stack
        key={isDarkMode ? "dark" : "light"}
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
          contentStyle: { backgroundColor },
        }}
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(shell)" options={{ animation: "fade" }} />

        <Stack.Screen name="onboarding" />
        <Stack.Screen name="profile-setup" />
        <Stack.Screen name="first-action" />
        <Stack.Screen name="auth/callback" options={{ animation: "fade" }} />
        <Stack.Screen name="verify-email" />

        <Stack.Screen name="groups" />
        <Stack.Screen name="people" />
        <Stack.Screen name="settings" />

        <Stack.Screen name="friend/[id]" />
        <Stack.Screen name="friend/new" />

        <Stack.Screen name="group/[id]" />
        <Stack.Screen name="group/[id]/settings" />
        <Stack.Screen name="group/new" />

        <Stack.Screen name="expense/[id]" options={{ presentation: "modal" }} />
        <Stack.Screen name="expense/[id]/edit" />
        <Stack.Screen name="expense/new" />

        <Stack.Screen name="settle/new" />
        <Stack.Screen name="settle/[id]" options={{ presentation: "modal" }} />

        <Stack.Screen name="profile/edit" />
        <Stack.Screen name="profile/change-password" />

        <Stack.Screen name="recurring/index" />
        <Stack.Screen name="recurring/[id]" />
        <Stack.Screen name="recurring/[id]/edit" />
        <Stack.Screen name="recurring/new" />

        <Stack.Screen name="invite/[token]" />
      </Stack>
    </AppProvider>
  );
}
