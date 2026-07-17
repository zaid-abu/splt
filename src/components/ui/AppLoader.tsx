import type { JSX } from "react";
import { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { Typography } from "heroui-native";
import { useUI } from "@/components/ui/native-ui";

interface AppLoaderProps {
  fullScreen?: boolean;
}

export function AppLoader({ fullScreen = false }: AppLoaderProps): JSX.Element {
  const { color, radius, space, shadow } = useUI();
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 2000,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      }),
      -1,
      false
    );

    scale.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }, { scale: scale.value }],
    };
  });

  return (
    <View style={[styles.container, fullScreen && { flex: 1, backgroundColor: color.bg }]}>
      <Animated.View
        style={[
          styles.box,
          { borderColor: color.brand },
          animatedStyle,
        ]}
      />
      <Typography style={[styles.text, { color: color.brand }]}>LOADING</Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  box: {
    width: 24,
    height: 24,
    borderWidth: 1.5,
    backgroundColor: "transparent",
    marginBottom: 16,
  },
  text: {
    fontFamily: "Sora_600SemiBold",
    fontSize: 16,
    letterSpacing: 4,
    textTransform: "uppercase",
  },
});
