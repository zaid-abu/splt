import { Tabs, Redirect } from "expo-router";
import type { JSX } from "react";
import { View, Pressable, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import * as icons from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/context/AppContext";
import Animated, { useAnimatedStyle, withSpring } from "react-native-reanimated";
import { useUIStore } from "@/store/useUIStore";
import { GLASS_LIGHT, GLASS_DARK } from "@/constants/glassmorphism-tokens";

const ICON_SIZE = 22;
const ICON_STROKE_INACTIVE = 1.5;
const ICON_STROKE_ACTIVE = 2;
const TAB_BAR_HEIGHT = 64;

type TabBarItemProps = {
  isFocused: boolean;
  icon: React.ComponentType<{ size: number; color: string; strokeWidth: number }>;
  label: string;
  onPress: () => void;
};

function TabBarItem({ isFocused, icon: Icon, label, onPress }: TabBarItemProps): JSX.Element {
  const isDarkMode = useUIStore((s) => s.isDarkMode);
  const tokens = isDarkMode ? GLASS_DARK : GLASS_LIGHT;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(isFocused ? 1.1 : 1, { damping: 16, stiffness: 140 }) }],
  }));

  const dotStyle = useAnimatedStyle(() => ({
    opacity: withSpring(isFocused ? 1 : 0, { damping: 16, stiffness: 140 }),
    transform: [{ scaleX: withSpring(isFocused ? 1 : 0, { damping: 16, stiffness: 140 }) }],
  }));

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: isFocused }}
      onPress={() => {
        if (!isFocused) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
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
          color={isFocused ? tokens.text : tokens.muted}
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
            backgroundColor: tokens.text,
            marginTop: 5,
          },
        ]}
      />
    </Pressable>
  );
}

export default function TabsLayout(): JSX.Element | null {
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  const isDarkMode = useUIStore((s) => s.isDarkMode);
  const tokens = isDarkMode ? GLASS_DARK : GLASS_LIGHT;

  if (!isAuthenticated) return <Redirect href="/(auth)/welcome" />;

  return (
    <Tabs
      screenOptions={{ headerShown: false, tabBarStyle: { display: "none" } }}
      tabBar={({ state, navigation }) => {
        const navigate = (routeName: string) => navigation.navigate(routeName);

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
                borderWidth: 1,
                borderColor: tokens.border,
                shadowColor: "rgba(79, 140, 255, 0.18)",
                shadowOffset: { width: 0, height: 12 },
                shadowOpacity: 1,
                shadowRadius: 40,
                elevation: 12,
              }}
            >
              <BlurView
                intensity={Platform.OS === "ios" ? 80 : 90}
                tint={isDarkMode ? "dark" : "light"}
                style={{
                  flex: 1,
                  backgroundColor:
                    Platform.OS === "android"
                      ? isDarkMode
                        ? "rgba(20, 35, 55, 0.9)"
                        : "rgba(255, 255, 255, 0.85)"
                      : "transparent",
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 8,
                }}
              >
                <TabBarItem
                  isFocused={state.index === 0}
                  icon={icons.LayoutDashboard}
                  label="Dashboard"
                  onPress={() => navigate("index")}
                />
                <TabBarItem
                  isFocused={state.index === 1}
                  icon={icons.UsersRound}
                  label="Groups"
                  onPress={() => navigate("groups")}
                />
                <TabBarItem
                  isFocused={state.index === 2}
                  icon={icons.UserRoundCheck}
                  label="Friends"
                  onPress={() => navigate("friends")}
                />
                <TabBarItem
                  isFocused={state.index === 3}
                  icon={icons.ListChecks}
                  label="Activity"
                  onPress={() => navigate("activity")}
                />
              </BlurView>
            </View>
          </View>
        );
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="groups" />
      <Tabs.Screen name="friends" />
      <Tabs.Screen name="activity" />
    </Tabs>
  );
}
