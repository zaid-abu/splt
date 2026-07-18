import { Children, isValidElement, useRef } from "react";
import type { ReactNode } from "react";
import { View, ScrollView, Platform } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCoralColors } from "./useCoral";
import { StatusBar } from "expo-status-bar";
import { BlurTargetView } from "expo-blur";
import { useUIStore } from "@/store/useUIStore";
import { CoralTopBar } from "./CoralTopBar";
import { CoralBlurTargetContext } from "./CoralBlurContext";

type CoralScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  commandButton?: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

export function CoralScreen({
  children,
  scroll = true,
  commandButton,
  contentContainerStyle,
}: CoralScreenProps) {
  const insets = useSafeAreaInsets();
  const isDark = useUIStore((s) => s.isDarkMode);
  const coral = useCoralColors();
  const isIOS = Platform.OS === "ios";
  const blurTarget = useRef<View | null>(null);

  const gutter = isIOS ? 22 : 20;
  const bottomClearance = insets.bottom + 76;
  const childArray = Children.toArray(children);
  const hasTopBar =
    childArray.length > 0 && isValidElement(childArray[0]) && childArray[0].type === CoralTopBar;
  const topBar = hasTopBar ? childArray[0] : null;
  const bodyChildren = hasTopBar ? childArray.slice(1) : childArray;
  const topBarHeight = hasTopBar ? insets.top + 62 : 0;

  const content = scroll ? (
    <ScrollView
      contentContainerStyle={[
        {
          paddingTop: hasTopBar ? topBarHeight : insets.top,
          paddingHorizontal: gutter,
          paddingBottom: bottomClearance,
        },
        contentContainerStyle,
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {bodyChildren}
    </ScrollView>
  ) : (
    <View
      style={[
        {
          flex: 1,
          paddingTop: hasTopBar ? topBarHeight : insets.top,
          paddingHorizontal: gutter,
          paddingBottom: bottomClearance,
        },
        contentContainerStyle,
      ]}
    >
      {bodyChildren}
    </View>
  );

  return (
    <CoralBlurTargetContext.Provider value={blurTarget}>
      <View style={{ flex: 1, backgroundColor: coral.bg }}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <BlurTargetView ref={blurTarget} style={{ flex: 1 }}>
          {content}
        </BlurTargetView>
        {topBar ? (
          <View
            pointerEvents="box-none"
            style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 20 }}
          >
            {topBar}
          </View>
        ) : null}
        {commandButton}
      </View>
    </CoralBlurTargetContext.Provider>
  );
}
