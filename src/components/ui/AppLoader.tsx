import type { JSX } from "react";
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
import { Text } from "@/components/primitives/Text";

interface AppLoaderProps {
  fullScreen?: boolean;
}

export function AppLoader({ fullScreen = false }: AppLoaderProps): JSX.Element {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 2000,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      }),
      -1,
      false,
    );
    scale.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, [rotation, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }, { scale: scale.value }],
  }));

  return (
    <View
      className={`items-center justify-center p-6 ${fullScreen ? "flex-1 bg-background" : ""}`}
    >
      <Animated.View
        style={animatedStyle}
        className="w-6 h-6 border-[1.5px] border-primary bg-transparent mb-4"
      />
      <Text className="text-base text-primary font-heading tracking-[4px] uppercase">
        LOADING
      </Text>
    </View>
  );
}
