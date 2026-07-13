import { View, Pressable } from "react-native"
import { Typography } from "heroui-native"
import { UI } from "@/components/ui/native-ui"

interface StatPill {
  label: string
  value: string
  onPress: () => void
}

interface QuickStatsRowProps {
  pills: StatPill[]
}

export function QuickStatsRow({ pills }: QuickStatsRowProps) {
  return (
    <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: UI.space.page, marginBottom: 20 }}>
      {pills.map((pill) => (
        <Pressable
          key={pill.label}
          onPress={pill.onPress}
          style={({ pressed }) => ({
            flex: 1,
            backgroundColor: UI.color.surface,
            borderRadius: UI.radius.md,
            borderWidth: 1,
            borderColor: UI.color.border,
            paddingVertical: 10,
            paddingHorizontal: 12,
            opacity: pressed ? 0.7 : 1,
          })}
          accessibilityLabel={`${pill.label}: ${pill.value}`}
          accessibilityRole="button"
        >
          <Typography
            style={{
              fontSize: 11,
              color: UI.color.muted,
              fontFamily: "IBMPlexSans_600SemiBold",
              textTransform: "uppercase",
              letterSpacing: 0.5,
              marginBottom: 2,
            }}
          >
            {pill.label}
          </Typography>
          <Typography
            style={{
              fontSize: 15,
              color: UI.color.text,
              fontFamily: "Sora_600SemiBold",
            }}
            numberOfLines={1}
          >
            {pill.value}
          </Typography>
        </Pressable>
      ))}
    </View>
  )
}
