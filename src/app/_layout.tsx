import { Stack, SplashScreen } from "expo-router";
import type { JSX } from "react";
import { useEffect } from "react";
import { View, Text, TextInput } from "react-native";
import { useFonts } from "expo-font";
import {
  InstrumentSans_400Regular,
  InstrumentSans_500Medium,
  InstrumentSans_600SemiBold,
} from "@expo-google-fonts/instrument-sans";
import { IBMPlexMono_500Medium, IBMPlexMono_600SemiBold } from "@expo-google-fonts/ibm-plex-mono";

import * as SystemUI from "expo-system-ui";
import { AppProvider } from "@/providers/AppProvider";
import { useUIStore } from "@/store/useUIStore";
import { CORAL_COLORS } from "@/components/coral/theme";
import { CommandNavigationProvider } from "@/features/navigation/CommandNavigationProvider";
import { CoralTabBar } from "@/components/coral/CoralTabBar";
import { CoralFAB } from "@/components/coral/CoralPillBar";

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
    InstrumentSans_400Regular,
    InstrumentSans_500Medium,
    InstrumentSans_600SemiBold,
    IBMPlexMono_500Medium,
    IBMPlexMono_600SemiBold,
  });

  const isDarkMode = useUIStore((s) => s.isDarkMode);

  Uniwind.setTheme(isDarkMode ? "dark" : "light");

  const backgroundColor = isDarkMode ? CORAL_COLORS.dark.bg : CORAL_COLORS.light.bg;

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(backgroundColor);
  }, [backgroundColor]);

  useEffect(() => {
    if (!loaded) return;
    void SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <AppProvider>
      <CommandNavigationProvider>
        <View style={{ flex: 1, backgroundColor }}>
          <Stack
            key={isDarkMode ? "dark" : "light"}
            screenOptions={{
              headerShown: false,
              animation: "slide_from_right",
              contentStyle: { backgroundColor },
            }}
          >
            <Stack.Screen name="(auth)" />

            {/* Post-auth routes */}

            <Stack.Screen name="onboarding" />
            <Stack.Screen name="profile-setup" />
            <Stack.Screen name="first-action" />
            <Stack.Screen name="auth/callback" options={{ animation: "fade" }} />
            <Stack.Screen name="verify-email" />

            {/* Primary screens */}

            <Stack.Screen name="home" />
            <Stack.Screen name="people" />
            <Stack.Screen name="groups" />
            <Stack.Screen name="activity" />
            <Stack.Screen name="analytics" />
            <Stack.Screen name="notifications" />
            <Stack.Screen name="settings" />
            <Stack.Screen name="currencies" />

            {/* Friend routes */}

            <Stack.Screen name="friend/[id]" />
            <Stack.Screen name="friend/new" />

            {/* Group routes */}

            <Stack.Screen name="group/[id]" />
            <Stack.Screen name="group/[id]/settings" />
            <Stack.Screen
              name="group/new"
              options={{
                presentation: "transparentModal",
                animation: "fade",
                headerShown: false,
              }}
            />

            {/* Expense routes */}

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

            {/* Settle route */}

            <Stack.Screen
              name="settle/[id]"
              options={{
                presentation: "modal",
                headerShown: false,
              }}
            />

            {/* Profile routes */}

            <Stack.Screen name="profile/edit" />
            <Stack.Screen name="profile/change-password" />

            {/* Recurring routes */}

            <Stack.Screen name="recurring/index" />
            <Stack.Screen name="recurring/[id]" />
            <Stack.Screen name="recurring/[id]/edit" />
            <Stack.Screen name="recurring/new" />
          </Stack>
          <CoralTabBar />
          <CoralFAB />
        </View>
      </CommandNavigationProvider>
    </AppProvider>
  );
}
