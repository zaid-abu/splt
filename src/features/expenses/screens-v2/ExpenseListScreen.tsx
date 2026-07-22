import type { JSX } from "react";
import { View, Text, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { CoralScreen } from "@/components/coral/CoralScreen";
import { CoralTopBar } from "@/components/coral/CoralTopBar";
import { CoralSegment } from "@/components/coral/CoralSegment";
import { BalanceHero } from "@/components/coral/BalanceHero";
import { useCoralColors } from "@/components/coral/useCoral";

export default function ExpenseListScreen(): JSX.Element {
  const router = useRouter();
  const coral = useCoralColors();
  const { category = "Expenses" } = useLocalSearchParams<{ category: string }>();

  return (
      <CoralScreen scroll={false}>
      <CoralTopBar title="Filtered expenses" onBack={() => router.back()} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40, gap: 20 }}>
        
        <CoralSegment
          options={[
            { label: "Your share", value: "share" },
            { label: "Total value", value: "total" },
          ]}
          selected="share"
          onSelect={() => {}}
        />

        <BalanceHero
          label={category}
          value="$0.00"
        />

        <View style={{ alignItems: "center", paddingVertical: 40 }}>
          <Text style={{ fontFamily: "InstrumentSans_400Regular", fontSize: 15, color: coral.muted }}>
            No expenses found for this category.
          </Text>
        </View>

      </ScrollView>
    </CoralScreen>
  );
}
