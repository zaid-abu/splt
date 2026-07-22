import type { JSX } from "react";
import { View, Text, ScrollView, Switch } from "react-native";
import { useRouter } from "expo-router";

import { CoralScreen } from "@/components/coral/CoralScreen";
import { CoralTopBar } from "@/components/coral/CoralTopBar";
import { CoralSegment } from "@/components/coral/CoralSegment";
import { useCoralColors } from "@/components/coral/useCoral";
import { useUIStore, type ThemePreference } from "@/store/useUIStore";

export default function AppearanceScreen(): JSX.Element {
  const router = useRouter();
  const coral = useCoralColors();
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);

  const themeOptions = [
    { label: "System", value: "system" },
    { label: "Light", value: "light" },
    { label: "Dark", value: "dark" },
  ];

  return (
    <CoralScreen scroll={false}>
      <CoralTopBar title="Appearance" onBack={() => router.back()} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40, gap: 20 }}>
        
        <View style={{ marginTop: 8 }}>
          <Text style={{ fontFamily: "InstrumentSans_600SemiBold", fontSize: 16, color: coral.foreground }}>
            Theme
          </Text>
          <Text style={{ fontFamily: "InstrumentSans_400Regular", fontSize: 13, color: coral.muted, marginTop: 2 }}>
            Choose how Splt looks on this device
          </Text>
        </View>

        <CoralSegment
          options={themeOptions}
          selected={theme}
          onSelect={(value) => setTheme(value as ThemePreference)}
        />

        <View style={{ height: 1, backgroundColor: coral.border, opacity: 0.5 }} />

        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 52 }}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={{ fontFamily: "InstrumentSans_600SemiBold", fontSize: 16, color: coral.foreground }}>
              Reduce motion
            </Text>
            <Text style={{ fontFamily: "InstrumentSans_400Regular", fontSize: 13, color: coral.muted, marginTop: 2 }}>
              Disable page-turn and overlay slide animations
            </Text>
          </View>
          <Switch value={false} onValueChange={() => {}} trackColor={{ true: coral.accent }} />
        </View>

      </ScrollView>
    </CoralScreen>
  );
}
