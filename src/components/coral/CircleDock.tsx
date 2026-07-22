import type { ComponentType, JSX } from "react";
import { useEffect } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import { useSegments } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import type { BottomTabBarProps } from "expo-router/js-tabs";
import * as Haptics from "expo-haptics";
import { CirclePlus, Clock3, Home, Menu, Orbit } from "lucide-react-native";

import { SHELL_TABS, type ShellTabKey } from "@/features/navigation/shell";
import { useUIStore } from "@/store/useUIStore";
import { useCoralColors } from "./useCoral";

type DockIcon = ComponentType<{
  size?: number;
  color?: string;
  strokeWidth?: number;
}>;

const ICONS: Record<ShellTabKey, DockIcon> = {
  home: Home,
  circles: Orbit,
  activity: Clock3,
  more: Menu,
};

const SPRING_CONFIG = { damping: 15, stiffness: 260, mass: 0.7 };

function TabButton({
  route,
  tab,
  index,
  state,
  descriptors,
  navigation,
  targetSize,
  coral: c,
}: {
  route: any;
  tab: (typeof SHELL_TABS)[number];
  index: number;
  state: any;
  descriptors: any;
  navigation: any;
  targetSize: number;
  coral: any;
}) {
  const focused = state.index === index;
  const options = descriptors[route.key]?.options;
  const Icon = ICONS[tab.key];

  const scale = useSharedValue(focused ? 1 : 0.85);
  const iconOpacity = useSharedValue(focused ? 1 : 0.5);
  const dotOpacity = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    scale.value = withSpring(focused ? 1 : 0.85, SPRING_CONFIG);
    iconOpacity.value = withTiming(focused ? 1 : 0.5, { duration: 180 });
    dotOpacity.value = withTiming(focused ? 1 : 0, { duration: 200 });
  }, [focused, scale, iconOpacity, dotOpacity]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: iconOpacity.value,
  }));

  const dotStyle = useAnimatedStyle(() => ({
    opacity: dotOpacity.value,
    transform: [{ scale: dotOpacity.value }],
  }));

  return (
    <Pressable
      key={route.key}
      accessibilityRole="tab"
      accessibilityLabel={options?.tabBarAccessibilityLabel ?? tab.label}
      accessibilityState={{ selected: focused }}
      onPress={() => {
        const event = navigation.emit({
          type: "tabPress",
          target: route.key,
          canPreventDefault: true,
        });
        if (!focused && !event.defaultPrevented) {
          void Haptics.selectionAsync();
          navigation.navigate(route.name, route.params);
        }
      }}
      onLongPress={() => navigation.emit({ type: "tabLongPress", target: route.key })}
      style={({ pressed }) => ({
        flex: 1,
        minWidth: 0,
        minHeight: targetSize,
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        borderRadius: 12,
        opacity: pressed ? 0.62 : 1,
      })}
    >
      <Animated.View style={iconStyle}>
        <Icon size={22} color={focused ? c.foreground : c.muted} strokeWidth={focused ? 2.2 : 1.7} />
      </Animated.View>
      <Text
        numberOfLines={1}
        maxFontSizeMultiplier={1.15}
        style={{
          fontFamily: "InstrumentSans_600SemiBold",
          fontSize: 10,
          color: focused ? c.foreground : c.muted,
        }}
      >
        {tab.label}
      </Text>
      <Animated.View
        style={[
          dotStyle,
          {
            width: 4,
            height: 4,
            borderRadius: 2,
            backgroundColor: c.accent,
          },
        ]}
      />
    </Pressable>
  );
}

export type CircleDockProps = BottomTabBarProps & {
  onAddPress: () => void;
};

export function CircleDock({
  state,
  descriptors,
  navigation,
  insets,
  onAddPress,
}: CircleDockProps): JSX.Element | null {
  const coral = useCoralColors();
  const isDark = useUIStore((state) => state.isDarkMode);
  const targetSize = Platform.OS === "ios" ? 44 : 48;
  const segments = useSegments() as string[];
  const activeTab = SHELL_TABS.find((tab) => segments.includes(tab.routeName));
  const activeLeaf = segments[segments.length - 1];
  const isNestedRoute = Boolean(activeTab && activeLeaf && activeLeaf !== activeTab.key);

  if (isNestedRoute) return null;

  const tabButtons = state.routes.flatMap((route, index) => {
    const tab = SHELL_TABS.find((item) => item.routeName === route.name);
    if (!tab) return [];
    return [
      <TabButton
        key={route.key}
        route={route}
        tab={tab}
        index={index}
        state={state}
        descriptors={descriptors}
        navigation={navigation}
        targetSize={targetSize}
        coral={coral}
      />,
    ];
  });

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        paddingTop: 20,
        paddingHorizontal: 16,
        paddingBottom: Math.max(insets.bottom, 12),
        backgroundColor: "transparent",
      }}
    >
      <View
        accessibilityRole="tablist"
        style={{
          minHeight: 74,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 7,
          borderRadius: 20,
          overflow: "visible",
          backgroundColor: coral.surface,
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: isDark ? 0.35 : 0.12,
          shadowRadius: 18,
          elevation: 0,
        }}
      >
        {tabButtons[0]}
        {tabButtons[1]}
        <View style={{ flex: 1, minWidth: 0, alignItems: "center" }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open Add actions"
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onAddPress();
            }}
            style={({ pressed }) => ({
              width: 56,
              height: 56,
              borderRadius: 28,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: coral.accent,
              transform: [{ translateY: -16 }, { scale: pressed ? 0.96 : 1 }],
              shadowColor: coral.accent,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.35,
              shadowRadius: 8,
              elevation: 8,
            })}
          >
            <CirclePlus size={28} color={coral.inkOnAccent} strokeWidth={2.2} />
          </Pressable>
        </View>
        {tabButtons[2]}
        {tabButtons[3]}
      </View>
    </View>
  );
}
