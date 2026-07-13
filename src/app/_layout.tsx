import { Stack, SplashScreen } from "expo-router";
import type { JSX } from "react";
import { useEffect, useState } from "react";
import { Text, TextInput } from "react-native";
import { useFonts } from "expo-font";
import { supabase } from "@/services/supabase/client";

import * as SystemUI from "expo-system-ui";
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

const linking = {
  prefixes: ["splt://", "https://splt.app"],
  config: {
    screens: {
      "(auth)": {
        screens: {
          welcome: "welcome",
          login: "login",
          register: "register",
        },
      },
      "(tabs)": {
        screens: {
          feed: "feed",
          groups: "groups",
          friends: "friends",
          profile: "profile",
        },
      },
      "group": {
        screens: {
          "[id]": "group/:id",
        },
      },
      "expense": {
        screens: {
          "[id]": "expense/:id",
        },
      },
      "friend": {
        screens: {
          "[id]": "friend/:id",
        },
      },
      "settle": {
        screens: {
          "[id]": "settle/:id",
        },
      },
    },
  },
}

export default function RootLayout(): JSX.Element | null {
  const [loaded] = useFonts({
    Sora_600SemiBold: require("@/assets/fonts/Sora-SemiBold.ttf"),
    IBMPlexSans_400Regular: require("@/assets/fonts/IBMPlexSans-Regular.ttf"),
    IBMPlexSans_500Medium: require("@/assets/fonts/IBMPlexSans-Medium.ttf"),
    IBMPlexSans_600SemiBold: require("@/assets/fonts/IBMPlexSans-SemiBold.ttf"),
  });

  const [authReady, setAuthReady] = useState(false);
  const isDarkMode = useUIStore((s) => s.isDarkMode);

  applyTheme(isDarkMode);
  Uniwind.setTheme(isDarkMode ? "dark" : "light");

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(UI.color.bg);
  }, [isDarkMode]);

  useEffect(() => {
    supabase.auth.getSession().then(() => {
      setAuthReady(true);
    });
  }, []);

  useEffect(() => {
    if (loaded && authReady) {
      SplashScreen.hideAsync();
    }
  }, [loaded, authReady]);

  if (!loaded || !authReady) return null;

  return (
    <AppProvider>
      <Stack
        key={isDarkMode ? "dark" : "light"}
        linking={linking}
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
