import { Redirect } from "expo-router";
import { View, Animated } from "react-native";
import { useEffect, useMemo } from "react";
import { useAuth } from "@/context/AppContext";
import { UI } from "@/components/ui/native-ui";

function LoadingScreen(): React.JSX.Element {
  const opacity = useMemo(() => new Animated.Value(0), []);
  const scale = useMemo(() => new Animated.Value(0.95), []);
  const dotOpacity = useMemo(() => new Animated.Value(0.3), []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, damping: 14, stiffness: 100, useNativeDriver: true }),
    ]).start();

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(dotOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(dotOpacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity, scale, dotOpacity]);

  return (
    <View style={{ flex: 1, backgroundColor: UI.color.bg, alignItems: "center", justifyContent: "center" }}>
      <Animated.Text
        style={{
          fontFamily: "Sora_600SemiBold",
          fontSize: 42,
          color: UI.color.textStrong,
          letterSpacing: 4,
          opacity,
          transform: [{ scale }],
        }}
      >
        SPLT.
      </Animated.Text>
      <Animated.View
        style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: UI.color.muted,
          marginTop: 20,
          opacity: dotOpacity,
        }}
      />
    </View>
  );
}

export default function IndexScreen() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/welcome" />;
}
