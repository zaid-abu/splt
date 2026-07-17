import type { ComponentType, JSX } from "react";
import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { useUIStore } from "@/store/useUIStore";

type IconType = ComponentType<{
  size?: number;
  color?: string;
  strokeWidth?: number;
}>;

interface GlassOrbProps {
  icon: IconType;
}

export default function GlassOrb({ icon: Icon }: GlassOrbProps): JSX.Element {
  const isDarkMode = useUIStore((s) => s.isDarkMode);
  const orbBg = isDarkMode ? "rgba(91, 148, 255, 0.62)" : "rgba(79, 140, 255, 0.62)";
  const borderColor = isDarkMode ? "rgba(255, 255, 255, 0.12)" : "rgba(255, 255, 255, 0.64)";

  const rotation = useSharedValue(-8);
  const scale = useSharedValue(1);

  useEffect(() => {
    rotation.value = withRepeat(
      withSequence(
        withTiming(-12, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(-4, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
    scale.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.96, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, [rotation, scale]);

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }, { scale: scale.value }],
  }));

  return (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        width: 150,
        height: 150,
      }}
    >
      <Animated.View
        style={[
          orbStyle,
          {
            width: 150,
            height: 150,
            borderRadius: 46,
            backgroundColor: orbBg,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor,
            shadowColor: isDarkMode ? "rgba(91, 148, 255, 0.28)" : "rgba(79, 140, 255, 0.28)",
            shadowOffset: { width: 18, height: 20 },
            shadowOpacity: 1,
            shadowRadius: 55,
            elevation: 16,
          },
        ]}
      >
        <Icon size={58} color="#FFFFFF" strokeWidth={1.3} />
      </Animated.View>
    </View>
  );
}
