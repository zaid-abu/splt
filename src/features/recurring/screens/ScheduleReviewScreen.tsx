import type { JSX } from "react";
import { View, Text, ScrollView, TextInput, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

import { CoralScreen } from "@/components/coral/CoralScreen";
import { CoralTopBar } from "@/components/coral/CoralTopBar";
import { CoralField } from "@/components/coral/CoralField";
import { CoralButton } from "@/components/coral/CoralButton";
import { BalanceHero } from "@/components/coral/BalanceHero";
import { useCoralColors } from "@/components/coral/useCoral";
import { useUI } from "@/components/ui";

export default function ScheduleReviewScreen(): JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const coral = useCoralColors();
  const { color } = useUI();

  // Simple mock review UI matching standard Coral components
  const handlePost = () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  return (
    <CoralScreen scroll={false}>
      <CoralTopBar title="Scheduled review" onBack={() => router.back()} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        
        <View style={{ marginBottom: 24 }}>
          <BalanceHero
            label="Needs review - due Monday"
            value="$96.40"
          />
        </View>

        <CoralField
          label="Final amount"
          value="96.40"
          keyboardType="decimal-pad"
          onChangeText={() => {}}
        />

        <View style={{ marginTop: 18 }}>
          <CoralField
            label="Paid by"
            value="You"
            editable={false}
          />
        </View>

        <View style={{ marginTop: 18 }}>
          <CoralField
            label="Split method"
            value="Equal (4 shares)"
            editable={false}
          />
        </View>

        <View style={{ marginTop: 18 }}>
          <CoralField
            label="Category and date"
            value="Bills · July 20, 2026"
            editable={false}
          />
        </View>

        <View style={{ marginTop: 18 }}>
          <CoralField
            label="Next occurrence"
            value="August 20, 2026"
            editable={false}
          />
        </View>

        <View
          style={{
            marginTop: 24,
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
            Posting this occurrence does not change the next scheduled date.
          </Text>
        </View>

        <View style={{ marginTop: 28 }}>
          <CoralButton
            label="Post expense - $96.40"
            variant="primary"
            onPress={handlePost}
          />
        </View>
      </ScrollView>
    </CoralScreen>
  );
}
