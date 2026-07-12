import type { JSX } from "react";
import { View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { UI } from "@/components/ui/native-ui";
import { HapticButton } from "@/components/ui/HapticButton";

export interface QuickActionsProps {
  onAddExpense: () => void;
  onSettleUp: () => void;
}

export function QuickActions({ onAddExpense, onSettleUp }: QuickActionsProps): JSX.Element {
  return (
    <Animated.View
      entering={FadeInDown.duration(350).delay(35).springify()}
      style={{ paddingHorizontal: UI.space.page, marginBottom: 24 }}
    >
      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <HapticButton tone="brand" onPress={onAddExpense}>
            + Add Expense
          </HapticButton>
        </View>
        <View style={{ flex: 1 }}>
          <HapticButton tone="outlined" onPress={onSettleUp}>
            Settle up
          </HapticButton>
        </View>
      </View>
    </Animated.View>
  );
}
