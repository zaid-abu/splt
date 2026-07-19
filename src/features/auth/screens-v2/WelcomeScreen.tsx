import { useRouter } from "expo-router";
import type { JSX } from "react";
import { View, Text } from "react-native";
import * as Haptics from "expo-haptics";
import { CoralScreen } from "@/components/coral/CoralScreen";
import { CoralButton } from "@/components/coral/CoralButton";
import { LargeTitle } from "@/components/coral/LargeTitle";
import { useCoralColors } from "@/components/coral/useCoral";

export default function WelcomeScreen(): JSX.Element {
  const router = useRouter();
  const coral = useCoralColors();

  return (
    <CoralScreen scroll={false}>
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 20,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 9, marginBottom: 30 }}>
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              backgroundColor: coral.accent,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                fontFamily: "IBMPlexMono_700Bold",
                fontSize: 16,
                lineHeight: 18,
                color: coral.inkOnAccent,
              }}
            >
              S
            </Text>
          </View>
          <Text
            style={{
              fontFamily: "InstrumentSans_700Bold",
              fontSize: 17,
              color: coral.foreground,
            }}
          >
            Splt
          </Text>
        </View>

        <LargeTitle style={{ textAlign: "center", marginTop: 0 }}>
          Shared money, made lighter.
        </LargeTitle>

        <Text
          style={{
            fontFamily: "InstrumentSans_400Regular",
            fontSize: 17,
            lineHeight: 26,
            color: coral.muted,
            textAlign: "center",
            marginTop: 12,
            marginBottom: 40,
            paddingHorizontal: 8,
          }}
        >
          Split nights out, trips, rent, and recurring bills without turning friendship into
          accounting.
        </Text>

        <View style={{ width: "100%", gap: 10 }}>
          <CoralButton
            label="Create an account"
            variant="primary"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push("/(auth)/register");
            }}
          />

          <CoralButton
            label="Sign in"
            variant="secondary"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/(auth)/login");
            }}
          />
        </View>

        <Text
          style={{
            fontFamily: "InstrumentSans_400Regular",
            fontSize: 13,
            color: coral.muted,
            textAlign: "center",
            marginTop: 24,
            lineHeight: 20,
          }}
        >
          Social sign-in follows the same verification and profile setup lifecycle.
        </Text>
      </View>
    </CoralScreen>
  );
}
