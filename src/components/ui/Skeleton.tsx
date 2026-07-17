import { useEffect, useMemo } from "react";
import { View, Animated } from "react-native";
import { useUI } from "@/components/ui";

export function Skeleton({
  width,
  height,
  radius: propRadius,
}: {
  width?: number;
  height: number;
  radius?: number;
}): React.JSX.Element {
  const { color, radius, space, shadow } = useUI();
  const effectiveRadius = propRadius ?? radius.md;
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
        borderRadius: effectiveRadius,
        backgroundColor: color.subtle,
        opacity,
      }}
    />
  );
}

export function CardSkeleton(): React.JSX.Element {
  const { color, radius, space, shadow } = useUI();
  return (
    <View
      style={{
        backgroundColor: color.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: color.border,
        padding: 16,
        gap: 12,
      }}
    >
      <View style={{ width: "40%" }}>
        <Skeleton height={14} />
      </View>
      <View style={{ width: "70%" }}>
        <Skeleton height={22} />
      </View>
      <Skeleton height={14} />
    </View>
  );
}

export function ListRowSkeleton(): React.JSX.Element {
  const { color, radius, space, shadow } = useUI();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        paddingHorizontal: 16,
        gap: 14,
      }}
    >
      <Skeleton width={44} height={44} radius={radius.lg} />
      <View style={{ flex: 1, gap: 6 }}>
        <View style={{ width: "60%" }}>
          <Skeleton height={16} />
        </View>
        <View style={{ width: "40%" }}>
          <Skeleton height={13} />
        </View>
      </View>
    </View>
  );
}
