import type { JSX } from "react";
import { View } from "react-native";
import { useUI } from "@/components/ui";
import { HapticButton } from "@/components/ui/HapticButton";

interface DashboardActionsProps {
  onAddExpense: () => void;
  onSettleUp: () => void;
}

export function DashboardActions({ onAddExpense, onSettleUp }: DashboardActionsProps): JSX.Element {
  const { color } = useUI();

  return (
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
  );
}
