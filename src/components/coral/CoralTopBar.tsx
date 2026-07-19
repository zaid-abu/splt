import { useContext } from "react";
import type { ComponentProps, ReactNode } from "react";
import { View, Text, Pressable, Platform } from "react-native";
import { BlurView } from "expo-blur";
import { ChevronLeft } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUIStore } from "@/store/useUIStore";
import { useCoralColors } from "./useCoral";
import { CoralBlurTargetContext } from "./CoralBlurContext";

type CoralTopBarProps = {
  title?: string;
  onBack?: () => void;
  leftElement?: ReactNode;
  rightElement?: ReactNode;
};

export function CoralTopBar({ title = "", onBack, leftElement, rightElement }: CoralTopBarProps) {
  const insets = useSafeAreaInsets();
  const blurTarget = useContext(CoralBlurTargetContext);
  const isDark = useUIStore((s) => s.isDarkMode);
  const coral = useCoralColors();
  const isIOS = Platform.OS === "ios";

  const sharedStyle: ComponentProps<typeof View>["style"] = {
    minHeight: 62 + insets.top,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingTop: insets.top + 8,
    paddingBottom: 8,
    paddingHorizontal: isIOS ? 18 : 20,
    borderBottomWidth: 1,
    borderBottomColor: coral.border,
  };

  const inner = (
    <>
      {leftElement ? (
        <View
          style={{
            width: isIOS ? 44 : 48,
            minHeight: isIOS ? 44 : 48,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {leftElement}
        </View>
      ) : onBack ? (
        <Pressable
          accessibilityRole="button"
          onPress={onBack}
          style={{
            minWidth: isIOS ? 44 : 48,
            minHeight: isIOS ? 44 : 48,
            borderRadius: 9999,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ChevronLeft size={24} color={coral.foreground} strokeWidth={1.8} />
        </Pressable>
      ) : (
        <View style={{ width: isIOS ? 44 : 48 }} />
      )}
      <Text
        numberOfLines={1}
        style={{
          flex: 1,
          fontFamily: "InstrumentSans_600SemiBold",
          fontSize: 18,
          letterSpacing: -0.01 * 18,
          color: coral.foreground,
          textAlign: "center",
        }}
      >
        {title}
      </Text>
      {rightElement ? (
        <View style={{ minWidth: isIOS ? 44 : 48, alignItems: "flex-end" }}>{rightElement}</View>
      ) : (
        <View style={{ width: isIOS ? 44 : 48 }} />
      )}
    </>
  );

  if (!isIOS) {
    return <View style={[sharedStyle, { backgroundColor: coral.bg }]}>{inner}</View>;
  }

  return (
    <BlurView
      intensity={80}
      tint={isDark ? "dark" : "light"}
      blurTarget={blurTarget ?? undefined}
      blurReductionFactor={2}
      style={[sharedStyle, { backgroundColor: "transparent" }]}
    >
      {inner}
    </BlurView>
  );
}
