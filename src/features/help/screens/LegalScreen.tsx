import type { JSX } from "react";
import { View, Text, ScrollView } from "react-native";
import { useRouter } from "expo-router";

import { CoralScreen } from "@/components/coral/CoralScreen";
import { CoralTopBar } from "@/components/coral/CoralTopBar";
import { useCoralColors } from "@/components/coral/useCoral";

export default function LegalScreen(): JSX.Element {
  const router = useRouter();
  const coral = useCoralColors();

  return (
    <CoralScreen scroll={false}>
      <CoralTopBar title="Terms & privacy" onBack={() => router.back()} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40, gap: 20 }}>
        
        <View style={{ gap: 8, marginTop: 8 }}>
          <Text style={{ fontFamily: "InstrumentSans_600SemiBold", fontSize: 16, color: coral.foreground }}>
            Terms of Service
          </Text>
          <Text style={{ fontFamily: "InstrumentSans_400Regular", fontSize: 13, color: coral.muted, lineHeight: 18 }}>
            By using Splt, you agree to track expenses honestly and settle obligations directly with counterparties. Splt does not hold funds, offer credit, or process banking transactions.
          </Text>
        </View>

        <View style={{ gap: 8 }}>
          <Text style={{ fontFamily: "InstrumentSans_600SemiBold", fontSize: 16, color: coral.foreground }}>
            Privacy Policy
          </Text>
          <Text style={{ fontFamily: "InstrumentSans_400Regular", fontSize: 13, color: coral.muted, lineHeight: 18 }}>
            We sync shared expenses, email identifiers, and transaction metadata to coordinate circle balances. Your financial logs are shared only with the explicit participants of your groups.
          </Text>
        </View>

        <View
          style={{
            padding: 14,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: coral.border,
            backgroundColor: coral.surface,
            marginTop: 12,
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
            Splt records shared expenses; it is not a bank.
          </Text>
        </View>

      </ScrollView>
    </CoralScreen>
  );
}
