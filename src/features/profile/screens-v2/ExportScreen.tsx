import type { JSX } from "react";
import { View, Text, ScrollView } from "react-native";
import { useRouter } from "expo-router";

import { CoralScreen } from "@/components/coral/CoralScreen";
import { CoralTopBar } from "@/components/coral/CoralTopBar";
import { CoralButton } from "@/components/coral/CoralButton";
import { CoralSelect } from "@/components/coral/CoralSelect";
import { useCoralColors } from "@/components/coral/useCoral";

export default function ExportScreen(): JSX.Element {
  const router = useRouter();
  const coral = useCoralColors();

  return (
    <CoralScreen scroll={false}>
      <CoralTopBar title="Export data" onBack={() => router.back()} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40, gap: 18 }}>
        
        <View style={{ marginTop: 8 }}>
          <Text style={{ fontFamily: "InstrumentSans_600SemiBold", fontSize: 16, color: coral.foreground }}>
            Generate export
          </Text>
          <Text style={{ fontFamily: "InstrumentSans_400Regular", fontSize: 13, color: coral.muted, marginTop: 2 }}>
            Download transaction records and balance ledger history
          </Text>
        </View>

        <CoralSelect
          label="Format"
          options={[
            { label: "CSV spreadsheet", value: "csv" },
            { label: "JSON raw data", value: "json" },
          ]}
          value="csv"
          onValueChange={() => {}}
        />

        <View style={{ marginTop: 6 }}>
          <CoralSelect
            label="Date range"
            options={[
              { label: "All history", value: "all" },
              { label: "Last 30 days", value: "30" },
              { label: "Current calendar year", value: "ytd" },
            ]}
            value="all"
            onValueChange={() => {}}
          />
        </View>

        <View
          style={{
            padding: 14,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: coral.border,
            backgroundColor: coral.surface,
            marginTop: 8,
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
            Exports are compiled securely in the background. A download link will be prepared and active for 48 hours.
          </Text>
        </View>

        <View style={{ marginTop: 20 }}>
          <CoralButton
            label="Generate export"
            variant="primary"
            onPress={() => router.back()}
          />
        </View>

      </ScrollView>
    </CoralScreen>
  );
}
