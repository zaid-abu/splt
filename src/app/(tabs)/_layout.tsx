/**
 * Tab Bar Layout — Phase 2 Redesign
 *
 * Reference spec:
 *  [Dashboard] [Groups] [Friends] [Activity]
 *
 * - Solid white (#FFFFFF) background, no BlurView
 * - Thin stroke icons (1.5px), 22px, gray #8E8E93 when inactive
 * - Active: dark (#1A1A1A) icon + small filled dot below
 * - NO text labels
 * - NO floating pill — flush bottom bar with safe-area padding
 * - Subtle 1px top border: #E8E4DF
 */
import { Tabs, Redirect } from "expo-router";
import type { JSX } from "react";
import { View, Pressable, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as icons from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/context/AppContext";
import Animated, { useAnimatedStyle, withSpring, withTiming } from "react-native-reanimated";

// ─── Design tokens ────────────────────────────────────────────────────────────
const COLOR_ACTIVE = "#1A1A1A";
const COLOR_INACTIVE = "#8E8E93";
const COLOR_TAB_BG = "#FFFFFF";
const COLOR_BORDER_TOP = "#E8E4DF";
const ICON_SIZE = 22;
const ICON_STROKE_INACTIVE = 1.5;
const ICON_STROKE_ACTIVE = 2;

// ─── TabBarItem ───────────────────────────────────────────────────────────────
type TabBarItemProps = {
  isFocused: boolean;
  icon: React.ComponentType<{ size: number; color: string; strokeWidth: number }>;
  label: string; // for accessibility only
  onPress: () => void;
};

function TabBarItem({ isFocused, icon: Icon, label, onPress }: TabBarItemProps): JSX.Element {
  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(isFocused ? 1.1 : 1, { damping: 16, stiffness: 140 }) }],
    opacity: withTiming(1, { duration: 120 }),
  }));

  const dotAnimatedStyle = useAnimatedStyle(() => ({
    opacity: withSpring(isFocused ? 1 : 0, { damping: 16, stiffness: 140 }),
    transform: [{ scaleX: withSpring(isFocused ? 1 : 0, { damping: 16, stiffness: 140 }) }],
  }));

  const handlePress = () => {
    if (!isFocused) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: isFocused }}
      onPress={handlePress}
      style={({ pressed }) => ({
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 10,
        opacity: pressed ? 0.72 : 1,
      })}
    >
      <Animated.View style={iconAnimatedStyle}>
        <Icon
          size={ICON_SIZE}
          color={isFocused ? COLOR_ACTIVE : COLOR_INACTIVE}
          strokeWidth={isFocused ? ICON_STROKE_ACTIVE : ICON_STROKE_INACTIVE}
        />
      </Animated.View>

      {/* Active indicator dot */}
      <Animated.View
        style={[
          dotAnimatedStyle,
          {
            width: 4,
            height: 4,
            borderRadius: 2,
            backgroundColor: COLOR_ACTIVE,
            marginTop: 5,
          },
        ]}
      />
    </Pressable>
  );
}

// ─── TabsLayout ───────────────────────────────────────────────────────────────
export default function TabsLayout(): JSX.Element | null {
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) return <Redirect href="/(auth)/welcome" />;

  // Height of the custom tab bar (icon area + safe area bottom padding)
  const tabBarHeight = 56 + Math.max(insets.bottom, Platform.OS === "android" ? 8 : 0);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // We supply a fully custom tabBar, so hide the native one completely
        tabBarStyle: { display: "none" },
      }}
      tabBar={({ state, navigation }) => {
        // Map Expo Router tab indices to named routes
        // Tab order: index(0) → groups(1) → friends(2) → activity(3)
        const navigate = (routeName: string) => navigation.navigate(routeName);

        return (
          <View
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: tabBarHeight,
              backgroundColor: COLOR_TAB_BG,
              borderTopWidth: 1,
              borderTopColor: COLOR_BORDER_TOP,
              flexDirection: "row",
              alignItems: "flex-start",
              paddingTop: 0,
              paddingBottom: insets.bottom,
              // Android shadow
              elevation: 8,
              // iOS shadow
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -1 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
            }}
          >
            {/* 1. Dashboard */}
            <TabBarItem
              isFocused={state.index === 0}
              icon={icons.LayoutDashboard}
              label="Dashboard"
              onPress={() => navigate("index")}
            />

            {/* 2. Groups */}
            <TabBarItem
              isFocused={state.index === 1}
              icon={icons.UsersRound}
              label="Groups"
              onPress={() => navigate("groups")}
            />

            {/* 3. Friends */}
            <TabBarItem
              isFocused={state.index === 2}
              icon={icons.UserRoundCheck}
              label="Friends"
              onPress={() => navigate("friends")}
            />

            {/* 4. Activity */}
            <TabBarItem
              isFocused={state.index === 3}
              icon={icons.ListChecks}
              label="Activity"
              onPress={() => navigate("activity")}
            />
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
