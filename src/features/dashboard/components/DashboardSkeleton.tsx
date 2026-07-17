import type { JSX } from "react";
import { View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useUI } from "@/components/ui";
import { Skeleton, ListRowSkeleton } from "@/components/ui/Skeleton";

export function DashboardSkeleton(): JSX.Element {
  const { color, radius, space } = useUI();

  const sectionContainer = {
    backgroundColor: color.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.border,
    overflow: "hidden" as const,
  };

  return (
    <View style={{ flex: 1, paddingTop: 40, paddingHorizontal: space.page }}>
      <Animated.View
        entering={FadeInDown.duration(350).springify()}
        style={{ marginBottom: 18 }}
      >
        <Skeleton height={200} radius={radius.lg} />
      </Animated.View>

      <Animated.View
        entering={FadeInDown.duration(350).delay(35).springify()}
        style={{ marginBottom: 28 }}
      >
        <View style={{ marginBottom: 10 }}>
          <Skeleton height={18} width={140} radius={6} />
        </View>
        <View style={sectionContainer}>
          <ListRowSkeleton />
          <ListRowSkeleton />
        </View>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.duration(350).delay(70).springify()}
        style={{ marginBottom: 28 }}
      >
        <View style={{ marginBottom: 10 }}>
          <Skeleton height={18} width={120} radius={6} />
        </View>
        <View style={sectionContainer}>
          <ListRowSkeleton />
          <ListRowSkeleton />
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(350).delay(105).springify()}>
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 14 }}>
          <Skeleton height={30} width={60} radius={999} />
          <Skeleton height={30} width={70} radius={999} />
          <Skeleton height={30} width={70} radius={999} />
        </View>
        <View style={{ marginBottom: 10 }}>
          <Skeleton height={18} width={100} radius={6} />
        </View>
        <View style={sectionContainer}>
          <ListRowSkeleton />
          <ListRowSkeleton />
        </View>
      </Animated.View>
    </View>
  );
}
