/**
 * StatsPlaceholderScreen
 *
 * Temporary screen used by the Stats tab while Phase 7 (Analytics) is built.
 * Shows a warm, on-brand empty state so the tab is functional without a crash.
 */
import type { JSX } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Typography } from "heroui-native";
import * as icons from "lucide-react-native";
import { FocusAwareView } from "@/components/animations/PageAnimator";
import { ThemedStatusBar } from "@/components/ui/ThemedStatusBar";
import { useUI } from "@/components/ui";

export default function StatsPlaceholderScreen(): JSX.Element {
  const { color, radius, space, shadow } = useUI();
  return (
    <FocusAwareView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} className="bg-background" edges={["top"]}>
        <ThemedStatusBar />

        {/* Header */}
        <View className="px-5 pt-4 pb-6">
          <Typography type="h2" className="font-heading text-[28px] text-foreground">
            Stats
          </Typography>
        </View>

        {/* Empty state */}
        <View className="flex-1 items-center justify-center px-8 pb-24">
          <View className="w-20 h-20 rounded-none items-center justify-center mb-6 border border-border-light bg-surface-secondary">
            <icons.BarChart2 size={36} color={color.textStrong} strokeWidth={1.5} />
          </View>
          <Typography
            type="h3"
            className="font-heading text-[22px] text-foreground text-center mb-2"
          >
            Analytics coming soon
          </Typography>
          <Typography type="body" className="text-muted-foreground text-center leading-relaxed">
            Spending trends, category breakdowns, and monthly comparisons are on their way in Phase
            7.
          </Typography>
        </View>
      </SafeAreaView>
    </FocusAwareView>
  );
}
