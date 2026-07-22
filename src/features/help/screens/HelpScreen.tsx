import type { JSX } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { ChevronRight } from "lucide-react-native";

import { CoralScreen } from "@/components/coral/CoralScreen";
import { CoralTopBar } from "@/components/coral/CoralTopBar";
import { CoralSearchField } from "@/components/coral/CoralSearchField";
import { useCoralColors } from "@/components/coral/useCoral";

export default function HelpScreen(): JSX.Element {
  const router = useRouter();
  const coral = useCoralColors();

  const handleRowPress = (path: string) => {
    router.push(path as any);
  };

  return (
    <CoralScreen scroll={false}>
      <CoralTopBar title="Help & support" onBack={() => router.back()} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40, gap: 20 }}>
        
        <CoralSearchField
          value=""
          onChangeText={() => {}}
          placeholder="Search guides"
        />

        <Text style={{ fontFamily: "InstrumentSans_600SemiBold", fontSize: 15, color: coral.foreground, marginBottom: -8 }}>
          Popular guides
        </Text>

        <View style={{ backgroundColor: coral.surface, borderWidth: 1, borderColor: coral.border, borderRadius: 16, overflow: "hidden" }}>
          
          <Pressable
            onPress={() => {}}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              minHeight: 56,
              paddingHorizontal: 16,
              opacity: pressed ? 0.65 : 1,
            })}
          >
            <Text style={{ fontFamily: "InstrumentSans_600SemiBold", fontSize: 14, color: coral.foreground }}>
              How splits work
            </Text>
            <ChevronRight size={18} color={coral.muted} />
          </Pressable>

          <View style={{ height: 1, backgroundColor: coral.border, opacity: 0.5 }} />

          <Pressable
            onPress={() => {}}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              minHeight: 56,
              paddingHorizontal: 16,
              opacity: pressed ? 0.65 : 1,
            })}
          >
            <Text style={{ fontFamily: "InstrumentSans_600SemiBold", fontSize: 14, color: coral.foreground }}>
              Simplifying debt balances
            </Text>
            <ChevronRight size={18} color={coral.muted} />
          </Pressable>

        </View>

        <Text style={{ fontFamily: "InstrumentSans_600SemiBold", fontSize: 15, color: coral.foreground, marginBottom: -8 }}>
          Contact and policies
        </Text>

        <View style={{ backgroundColor: coral.surface, borderWidth: 1, borderColor: coral.border, borderRadius: 16, overflow: "hidden" }}>
          
          <Pressable
            onPress={() => {}}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              minHeight: 56,
              paddingHorizontal: 16,
              opacity: pressed ? 0.65 : 1,
            })}
          >
            <Text style={{ fontFamily: "InstrumentSans_600SemiBold", fontSize: 14, color: coral.foreground }}>
              Contact support
            </Text>
            <ChevronRight size={18} color={coral.muted} />
          </Pressable>

          <View style={{ height: 1, backgroundColor: coral.border, opacity: 0.5 }} />

          <Pressable
            onPress={() => handleRowPress("/legal")}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              minHeight: 56,
              paddingHorizontal: 16,
              opacity: pressed ? 0.65 : 1,
            })}
          >
            <Text style={{ fontFamily: "InstrumentSans_600SemiBold", fontSize: 14, color: coral.foreground }}>
              Terms & privacy policies
            </Text>
            <ChevronRight size={18} color={coral.muted} />
          </Pressable>

        </View>

      </ScrollView>
    </CoralScreen>
  );
}
