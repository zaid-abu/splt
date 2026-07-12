import { View, Pressable } from "react-native"
import { Typography } from "heroui-native"
import * as Haptics from "expo-haptics"
import Animated, { FadeInDown } from "react-native-reanimated"

import { UI } from "@/components/ui/native-ui"

interface TagSelectorProps {
  tags: readonly string[]
  selected: string[]
  onToggle: (tag: string) => void
}

export function TagSelector({ tags, selected, onToggle }: TagSelectorProps) {
  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
        paddingTop: 8,
      }}
    >
      {tags.map((tag, i) => {
        const isActive = selected.includes(tag)
        return (
          <Animated.View
            key={tag}
            entering={FadeInDown.delay(i * 60).duration(400)}
          >
            <Pressable
              onPress={() => {
                Haptics.selectionAsync()
                onToggle(tag)
              }}
              style={({ pressed }) => ({
                minHeight: 48,
                paddingHorizontal: 24,
                borderRadius: UI.radius.pill,
                backgroundColor: isActive ? UI.color.ink : UI.color.control,
                borderWidth: 1,
                borderColor: isActive ? UI.color.ink : UI.color.border,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.72 : 1,
              })}
            >
              <Typography
                style={{
                  fontSize: 15,
                  fontFamily: "IBMPlexSans_600SemiBold",
                  color: isActive ? UI.color.textInverse : UI.color.text,
                }}
              >
                {tag}
              </Typography>
            </Pressable>
          </Animated.View>
        )
      })}
    </View>
  )
}
