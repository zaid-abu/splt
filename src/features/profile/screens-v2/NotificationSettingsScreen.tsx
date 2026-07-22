import type { JSX } from "react";
import { View, Text, ScrollView, Switch } from "react-native";
import { useRouter } from "expo-router";

import { CoralScreen } from "@/components/coral/CoralScreen";
import { CoralTopBar } from "@/components/coral/CoralTopBar";
import { useCoralColors } from "@/components/coral/useCoral";

export default function NotificationSettingsScreen(): JSX.Element {
  const router = useRouter();
  const coral = useCoralColors();

  return (
    <CoralScreen scroll={false}>
      <CoralTopBar title="Notifications" onBack={() => router.back()} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40, gap: 20 }}>
        
        <View style={{ marginTop: 8 }}>
          <Text style={{ fontFamily: "InstrumentSans_600SemiBold", fontSize: 16, color: coral.foreground }}>
            Push Notifications
          </Text>
          <Text style={{ fontFamily: "InstrumentSans_400Regular", fontSize: 13, color: coral.muted, marginTop: 2 }}>
            Manage delivery channels and triggers
          </Text>
        </View>

        <View style={{ backgroundColor: coral.surface, borderWidth: 1, borderColor: coral.border, borderRadius: 16, overflow: "hidden" }}>
          
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16 }}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={{ fontFamily: "InstrumentSans_600SemiBold", fontSize: 14, color: coral.foreground }}>
                Friend & group invites
              </Text>
              <Text style={{ fontFamily: "InstrumentSans_400Regular", fontSize: 12, color: coral.muted, marginTop: 2 }}>
                When someone invites you or accepts a request
              </Text>
            </View>
            <Switch value={true} onValueChange={() => {}} trackColor={{ true: coral.accent }} />
          </View>

          <View style={{ height: 1, backgroundColor: coral.border, opacity: 0.5 }} />

          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16 }}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={{ fontFamily: "InstrumentSans_600SemiBold", fontSize: 14, color: coral.foreground }}>
                New expenses & settlements
              </Text>
              <Text style={{ fontFamily: "InstrumentSans_400Regular", fontSize: 12, color: coral.muted, marginTop: 2 }}>
                When activity occurs in your circles
              </Text>
            </View>
            <Switch value={true} onValueChange={() => {}} trackColor={{ true: coral.accent }} />
          </View>

          <View style={{ height: 1, backgroundColor: coral.border, opacity: 0.5 }} />

          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16 }}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={{ fontFamily: "InstrumentSans_600SemiBold", fontSize: 14, color: coral.foreground }}>
                Scheduled reviews
              </Text>
              <Text style={{ fontFamily: "InstrumentSans_400Regular", fontSize: 12, color: coral.muted, marginTop: 2 }}>
                When a recurring bill requires final confirmation
              </Text>
            </View>
            <Switch value={true} onValueChange={() => {}} trackColor={{ true: coral.accent }} />
          </View>

        </View>

      </ScrollView>
    </CoralScreen>
  );
}
