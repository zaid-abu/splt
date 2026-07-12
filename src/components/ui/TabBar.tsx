import { View, Pressable, Platform } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { BlurView } from "expo-blur"
import * as Haptics from "expo-haptics"
import { House, Users, UserRound, CircleUserRound } from "lucide-react-native"
import Animated, { useAnimatedStyle, withSpring } from "react-native-reanimated"
import { UI } from "./native-ui"
import { useUIStore } from "@/store/useUIStore"

const ICONS: Record<
  string,
  React.ComponentType<{ size: number; color: string; strokeWidth: number }>
> = {
  feed: House,
  groups: Users,
  friends: UserRound,
  profile: CircleUserRound,
}

const ICON_SIZE = 22
const ICON_STROKE_ACTIVE = 2
const ICON_STROKE_INACTIVE = 1.5
const TAB_BAR_HEIGHT = 64

type TabBarItemProps = {
  isFocused: boolean
  icon: React.ComponentType<{ size: number; color: string; strokeWidth: number }>
  label: string
  onPress: () => void
}

function TabBarItem({ isFocused, icon: Icon, label, onPress }: TabBarItemProps) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(isFocused ? 1.1 : 1, { damping: 16, stiffness: 140 }) }],
  }))

  const dotStyle = useAnimatedStyle(() => ({
    opacity: withSpring(isFocused ? 1 : 0, { damping: 16, stiffness: 140 }),
    transform: [{ scaleX: withSpring(isFocused ? 1 : 0, { damping: 16, stiffness: 140 }) }],
  }))

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: isFocused }}
      onPress={() => {
        if (!isFocused) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        onPress()
      }}
      style={({ pressed }) => ({
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        opacity: pressed ? 0.72 : 1,
      })}
    >
      <Animated.View style={animatedStyle}>
        <Icon
          size={ICON_SIZE}
          color={isFocused ? UI.color.text : UI.color.muted}
          strokeWidth={isFocused ? ICON_STROKE_ACTIVE : ICON_STROKE_INACTIVE}
        />
      </Animated.View>
      <Animated.View
        style={[
          dotStyle,
          {
            width: 4,
            height: 4,
            borderRadius: 2,
            backgroundColor: UI.color.text,
            marginTop: 5,
          },
        ]}
      />
    </Pressable>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function TabBar(props: any) {
  const state: { index: number; routes: { key: string; name: string }[] } = props.state
  const navigation: { emit: (opts: Record<string, unknown>) => { defaultPrevented: boolean }; navigate: (name: string) => void } = props.navigation
  const insets = props.insets ?? useSafeAreaInsets()
  const isDarkMode = useUIStore((s) => s.isDarkMode)

  return (
    <View
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: "center",
        pointerEvents: "box-none",
      }}
    >
      <View
        style={{
          width: "92%",
          maxWidth: 420,
          height: TAB_BAR_HEIGHT,
          marginBottom: Math.max(insets.bottom, 12),
          borderRadius: 24,
          overflow: "hidden",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.12,
          shadowRadius: 16,
          elevation: 10,
        }}
      >
        <BlurView
          intensity={Platform.OS === "ios" ? 85 : 90}
          tint={isDarkMode ? "dark" : "light"}
          style={{
            flex: 1,
            backgroundColor: Platform.OS === "android" ? UI.color.control : "transparent",
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 8,
          }}
        >
          {state.routes.map((route, index) => {
            const isFocused = state.index === index
            const Icon = ICONS[route.name]
            if (!Icon) return null

            const label = route.name.charAt(0).toUpperCase() + route.name.slice(1)

            const onPress = () => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              }) as { defaultPrevented: boolean }

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name)
              }
            }

            return (
              <TabBarItem
                key={route.key}
                isFocused={isFocused}
                icon={Icon}
                label={label}
                onPress={onPress}
              />
            )
          })}
        </BlurView>
      </View>
    </View>
  )
}
