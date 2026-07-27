import type { JSX } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { ChevronRight } from "lucide-react-native";

import { CoralScreen } from "@/components/coral/CoralScreen";
import { CoralTopBar } from "@/components/coral/CoralTopBar";
import { useCoralColors } from "@/components/coral/useCoral";

export default function HelpScreen(): JSX.Element {
  const router = useRouter();
  const coral = useCoralColors();

  return (
    <CoralScreen scroll={false}>
      <CoralTopBar title="Help & support" onBack={() => router.back()} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40, gap: 20 }}
      >
        <View style={{ gap: 6, marginTop: 8 }}>
          <Text
            style={{
              fontFamily: "InstrumentSans_600SemiBold",
              fontSize: 16,
              color: coral.foreground,
            }}
          >
            Need help?
          </Text>
          <Text
            style={{
              fontFamily: "InstrumentSans_400Regular",
              fontSize: 14,
              color: coral.muted,
              lineHeight: 20,
            }}
          >
            Guides and in-app support are being prepared. Until then, your legal and privacy
            information is available here.
          </Text>
        </View>

        <View
          style={{
            backgroundColor: coral.surface,
            borderWidth: 1,
            borderColor: coral.border,
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open terms and privacy policies"
            onPress={() => router.push("/legal")}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              minHeight: 56,
              paddingHorizontal: 16,
              opacity: pressed ? 0.65 : 1,
            })}
          >
            <Text
              style={{
                fontFamily: "InstrumentSans_600SemiBold",
                fontSize: 14,
                color: coral.foreground,
              }}
            >
              Terms & privacy policies
            </Text>
            <ChevronRight size={18} color={coral.muted} />
          </Pressable>
        </View>
      </ScrollView>
    </CoralScreen>
  );
}
