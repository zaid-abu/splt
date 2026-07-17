import type { JSX } from "react";
import { View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useUI } from "@/components/ui";
import { Skeleton, ListRowSkeleton } from "@/components/ui/Skeleton";

export function DashboardSkeleton(): JSX.Element {
  const { color, radius, space } = useUI();

  return (
    <View style={{ flex: 1, paddingTop: 40, paddingHorizontal: space.page }}>
      <Animated.View
        entering={FadeInDown.duration(350).springify()}
        style={{ marginBottom: 18 }}
      >
        <Skeleton height={170} radius={radius.lg} />
      </Animated.View>
      <Animated.View
        entering={FadeInDown.duration(350).delay(35).springify()}
        style={{ marginBottom: 24 }}
      >
        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Skeleton height={56} radius={999} />
          </View>
          <View style={{ flex: 1 }}>
            <Skeleton height={56} radius={999} />
          </View>
        </View>
      </Animated.View>
      <Animated.View
        entering={FadeInDown.duration(350).delay(70).springify()}
        style={{ marginBottom: 28 }}
      >
        <View style={{ marginBottom: 14 }}>
          <Skeleton height={18} width={120} radius={6} />
        </View>
        <View
          style={{
            backgroundColor: color.surface,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: color.border,
          }}
        >
          <ListRowSkeleton />
          <ListRowSkeleton />
        </View>
      </Animated.View>
      <Animated.View entering={FadeInDown.duration(350).delay(105).springify()}>
        <View style={{ marginBottom: 14 }}>
          <Skeleton height={18} width={100} radius={6} />
        </View>
        <View
          style={{
            backgroundColor: color.surface,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: color.border,
          }}
        >
          <ListRowSkeleton />
          <ListRowSkeleton />
        </View>
      </Animated.View>
    </View>
  );
}
