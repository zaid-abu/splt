import { Pressable } from "react-native"
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  useSharedValue,
  Easing,
} from "react-native-reanimated"
import { Plus } from "lucide-react-native"
import * as Haptics from "expo-haptics"

interface FloatingAddButtonProps {
  onPress: () => void
}

export function FloatingAddButton({ onPress }: FloatingAddButtonProps) {
  const pulse = useSharedValue(1)

  pulse.value = withRepeat(
    withSequence(
      withTiming(1.05, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
    ),
    -1,
    true,
  )

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }))

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    onPress()
  }

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          bottom: 80,
          alignSelf: "center",
          zIndex: 100,
        },
        animatedStyle,
      ]}
    >
      <Pressable
        onPress={handlePress}
        className="w-14 h-14 rounded-full bg-ink items-center justify-center"
        accessibilityLabel="Add expense"
        accessibilityRole="button"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <Plus size={28} color="#FFFFFF" strokeWidth={2.5} />
      </Pressable>
    </Animated.View>
  )
}
