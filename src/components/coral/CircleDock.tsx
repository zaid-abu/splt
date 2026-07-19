import type { ComponentType, JSX } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import { BlurView } from "expo-blur";
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

export type CircleDockProps = BottomTabBarProps & {
  onAddPress: () => void;
};

export function CircleDock({
  state,
  descriptors,
  navigation,
  insets,
  onAddPress,
}: CircleDockProps): JSX.Element {
  const coral = useCoralColors();
  const isDark = useUIStore((state) => state.isDarkMode);
  const targetSize = Platform.OS === "ios" ? 44 : 48;

  const tabButtons = state.routes.map((route, index) => {
    const tab = SHELL_TABS.find((item) => item.routeName === route.name);
    if (!tab) return null;
    const focused = state.index === index;
    const options = descriptors[route.key]?.options;
    const Icon = ICONS[tab.key];

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
        <Icon
          size={22}
          color={focused ? coral.foreground : coral.muted}
          strokeWidth={focused ? 2.2 : 1.7}
        />
        <Text
          numberOfLines={1}
          maxFontSizeMultiplier={1.15}
          style={{
            fontFamily: "InstrumentSans_600SemiBold",
            fontSize: 10,
            color: focused ? coral.foreground : coral.muted,
          }}
        >
          {tab.label}
        </Text>
        <View
          style={{
            width: 4,
            height: 4,
            borderRadius: 2,
            backgroundColor: coral.accent,
            opacity: focused ? 1 : 0,
          }}
        />
      </Pressable>
    );
  });

  return (
    <View
      pointerEvents="box-none"
      style={{
        paddingTop: 20,
        paddingHorizontal: 12,
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
          borderWidth: 1,
          borderColor: coral.border,
          borderRadius: 20,
          overflow: "visible",
          shadowColor: "#122237",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: isDark ? 0.28 : 0.16,
          shadowRadius: 14,
          elevation: 12,
        }}
      >
        <BlurView
          intensity={Platform.OS === "ios" ? 85 : 55}
          tint={isDark ? "dark" : "light"}
          blurReductionFactor={2}
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 20,
            overflow: "hidden",
            backgroundColor: Platform.OS === "android" ? coral.surface : "transparent",
          }}
        />
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
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.34,
              shadowRadius: 9,
              elevation: 10,
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
