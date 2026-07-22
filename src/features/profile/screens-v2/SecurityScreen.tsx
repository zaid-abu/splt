import type { JSX } from "react";
import { View, Text, ScrollView, Switch } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

import { CoralScreen } from "@/components/coral/CoralScreen";
import { CoralTopBar } from "@/components/coral/CoralTopBar";
import { CoralField } from "@/components/coral/CoralField";
import { CoralButton } from "@/components/coral/CoralButton";
import { useCoralColors } from "@/components/coral/useCoral";
import { useProfile } from "@/features/profile/hooks/useProfile";

export default function SecurityScreen(): JSX.Element {
  const router = useRouter();
  const coral = useCoralColors();
  const { signOut } = useProfile();

  const handleRowPress = (path: string) => {
    void Haptics.selectionAsync();
    router.push(path as any);
  };

  return (
    <CoralScreen scroll={false}>
      <CoralTopBar title="Profile and security" onBack={() => router.back()} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40, gap: 18 }}>
        
        <View style={{ marginTop: 8 }}>
          <CoralField
            label="Password"
            value="••••••••••••"
            editable={false}
            style={{ opacity: 0.6 }}
          />
          <Text
            onPress={() => handleRowPress("/profile/change-password")}
            style={{
              fontFamily: "InstrumentSans_600SemiBold",
              fontSize: 13,
              color: coral.accent,
              marginTop: 8,
              alignSelf: "flex-end",
            }}
          >
            Change password
          </Text>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 52 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: "InstrumentSans_600SemiBold", fontSize: 16, color: coral.foreground }}>
              Face ID
            </Text>
            <Text style={{ fontFamily: "InstrumentSans_400Regular", fontSize: 13, color: coral.muted, marginTop: 2 }}>
              Biometric login check
            </Text>
          </View>
          <Switch value={true} onValueChange={() => {}} trackColor={{ true: coral.accent }} />
        </View>

        <View style={{ height: 1, backgroundColor: coral.border, opacity: 0.5 }} />

        <View style={{ gap: 8 }}>
          <Text style={{ fontFamily: "InstrumentSans_600SemiBold", fontSize: 15, color: coral.foreground }}>
            Active sessions
          </Text>
          <View style={{ backgroundColor: coral.surface, borderWidth: 1, borderColor: coral.border, borderRadius: 16, padding: 14 }}>
            <Text style={{ fontFamily: "InstrumentSans_600SemiBold", fontSize: 14, color: coral.foreground }}>
              Current session
            </Text>
            <Text style={{ fontFamily: "InstrumentSans_400Regular", fontSize: 12, color: coral.muted, marginTop: 4 }}>
              Mac OS · San Francisco, CA
            </Text>
          </View>
        </View>

        <View
          style={{
            padding: 14,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: coral.border,
            backgroundColor: coral.surface,
          }}
        >
          <Text
            style={{
              fontFamily: "InstrumentSans_400Regular",
              fontSize: 13,
              color: coral.muted,
              lineHeight: 18,
            }}
          >
            Account deletion immediately revokes access, hides your profile, and cancels pending actions. Past expense records belong to the mutual circles.
          </Text>
        </View>

        <View style={{ gap: 10, marginTop: 12 }}>
          <CoralButton
            label="Sign out of this session"
            variant="secondary"
            onPress={() => signOut()}
          />
          <CoralButton
            label="Delete account"
            variant="danger"
            onPress={() => {}}
          />
        </View>

      </ScrollView>
    </CoralScreen>
  );
}
