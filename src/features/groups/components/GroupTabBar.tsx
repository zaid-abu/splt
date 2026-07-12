import { View, Pressable } from "react-native"
import { Typography } from "heroui-native"
import { UI } from "@/components/ui/native-ui"
import * as Haptics from "expo-haptics"

const TABS = ["Expenses", "Balances", "Members", "Stats"]

interface GroupTabBarProps {
  activeTab: number
  onTabChange: (index: number) => void
}

export function GroupTabBar({ activeTab, onTabChange }: GroupTabBarProps) {
  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: UI.color.bg,
        borderBottomWidth: 1,
        borderBottomColor: UI.color.border,
        paddingHorizontal: UI.space.page,
      }}
    >
      {TABS.map((label, index) => {
        const isActive = activeTab === index
        return (
          <Pressable
            key={label}
            accessibilityRole="tab"
            accessibilityLabel={label}
            accessibilityState={{ selected: isActive }}
            onPress={() => {
              Haptics.selectionAsync()
              onTabChange(index)
            }}
            style={{
              flex: 1,
              alignItems: "center",
              paddingVertical: 14,
              borderBottomWidth: 2,
              borderBottomColor: isActive ? UI.color.ink : "transparent",
            }}
          >
            <Typography
              style={{
                fontSize: 14,
                fontFamily: "IBMPlexSans_600SemiBold",
                color: isActive ? UI.color.ink : UI.color.muted,
              }}
            >
              {label}
            </Typography>
          </Pressable>
        )
      })}
    </View>
  )
}
