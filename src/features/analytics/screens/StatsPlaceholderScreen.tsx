import type { JSX } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as icons from "lucide-react-native";
import { FocusAwareView } from "@/components/animations/PageAnimator";
import { Text } from "@/components/ui/Text";

export default function StatsPlaceholderScreen(): JSX.Element {
  return (
    <FocusAwareView className="flex-1">
      <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
        <StatusBar style="light" />

        <View className="px-5 pt-4 pb-6">
          <Text variant="h2" color="foreground" className="font-heading">
            Stats
          </Text>
        </View>

        <View className="flex-1 items-center justify-center px-8 pb-24">
          <View className="w-20 h-20 rounded-2xl bg-surface-2 items-center justify-center mb-6 border border-border">
            <icons.BarChart2 size={36} color="#FB923C" strokeWidth={1.5} />
          </View>
          <Text variant="h4" color="foreground" className="text-center mb-2">
            Analytics coming soon
          </Text>
          <Text variant="body" color="muted" className="text-center leading-relaxed">
            Spending trends, category breakdowns, and monthly comparisons are on their way.
          </Text>
        </View>
      </SafeAreaView>
    </FocusAwareView>
  );
}
