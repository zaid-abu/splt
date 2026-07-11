import { useEffect, useMemo } from "react";
import { View, Animated } from "react-native";
import { UI } from "@/components/ui/native-ui";

export function Skeleton({ width, height, radius = UI.radius.md }: { width?: number; height: number; radius?: number }): React.JSX.Element {
  const opacity = useMemo(() => new Animated.Value(0.3), []);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.6, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={{
        width: width ?? "100%",
        height,
        borderRadius: radius,
        backgroundColor: UI.color.subtle,
        opacity,
      }}
    />
  );
}

export function CardSkeleton(): React.JSX.Element {
  return (
    <View
      style={{
        backgroundColor: UI.color.surface,
        borderRadius: UI.radius.lg,
        borderWidth: 1,
        borderColor: UI.color.border,
        padding: 16,
        gap: 12,
      }}
    >
      <View style={{ width: "40%" }}><Skeleton height={14} /></View>
      <View style={{ width: "70%" }}><Skeleton height={22} /></View>
      <Skeleton height={14} />
    </View>
  );
}

export function ListRowSkeleton(): React.JSX.Element {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 16, gap: 14 }}>
      <Skeleton width={44} height={44} radius={UI.radius.lg} />
      <View style={{ flex: 1, gap: 6 }}>
        <View style={{ width: "60%" }}><Skeleton height={16} /></View>
        <View style={{ width: "40%" }}><Skeleton height={13} /></View>
      </View>
    </View>
  );
}
