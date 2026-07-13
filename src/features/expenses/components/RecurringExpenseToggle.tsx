import { View, Pressable } from "react-native"
import { Text } from "react-native"
import { Repeat, Calendar } from "lucide-react-native"

export type RecurringInterval = "weekly" | "monthly"

interface RecurringExpenseToggleProps {
  enabled: boolean
  interval: RecurringInterval
  onToggle: (enabled: boolean) => void
  onIntervalChange: (interval: RecurringInterval) => void
}

export function RecurringExpenseToggle({
  enabled,
  interval,
  onToggle,
  onIntervalChange,
}: RecurringExpenseToggleProps) {
  return (
    <View className="bg-ivory border border-warm rounded-xl p-4">
      <Pressable
        onPress={() => onToggle(!enabled)}
        className="flex-row items-center justify-between"
        accessibilityLabel={`Recurring expense ${enabled ? "enabled" : "disabled"}`}
        accessibilityRole="switch"
        accessibilityState={{ checked: enabled }}
      >
        <View className="flex-row items-center gap-3">
          <Repeat size={20} color="#1A1A1A" />
          <View>
            <Text className="font-ibmplexsans-semibold text-sm text-ink">Recurring expense</Text>
            <Text className="font-ibmplexsans text-xs text-muted">
              {enabled ? `Repeats ${interval}` : "Set to repeat"}
            </Text>
          </View>
        </View>
        <View
          className={`w-11 h-6 rounded-full p-0.5 ${enabled ? "bg-ink" : "bg-warm"}`}
        >
          <View
            className={`w-5 h-5 rounded-full bg-white shadow-sm ${enabled ? "ml-auto" : ""}`}
          />
        </View>
      </Pressable>

      {enabled && (
        <View className="flex-row gap-2 mt-3 pt-3 border-t border-warm">
          <Pressable
            onPress={() => onIntervalChange("weekly")}
            className={`flex-1 py-2 rounded-full items-center ${interval === "weekly" ? "bg-ink" : "bg-control border border-warm"}`}
            accessibilityLabel="Repeat weekly"
            accessibilityRole="button"
          >
            <Text className={`font-ibmplexsans-semibold text-xs ${interval === "weekly" ? "text-white" : "text-ink"}`}>
              Weekly
            </Text>
          </Pressable>
          <Pressable
            onPress={() => onIntervalChange("monthly")}
            className={`flex-1 py-2 rounded-full items-center ${interval === "monthly" ? "bg-ink" : "bg-control border border-warm"}`}
            accessibilityLabel="Repeat monthly"
            accessibilityRole="button"
          >
            <Text className={`font-ibmplexsans-semibold text-xs ${interval === "monthly" ? "text-white" : "text-ink"}`}>
              Monthly
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  )
}
