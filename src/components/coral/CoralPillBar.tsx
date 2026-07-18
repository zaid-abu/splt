import { useEffect, useRef } from "react";
import { Pressable, Animated, Platform } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { Plus } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useCoralColors } from "./useCoral";

const VISIBLE_ROUTES = new Set([
  "/home",
  "/people",
  "/groups",
  "/activity",
  "/settings",
  "/analytics",
  "/currencies",
]);

function isVisible(pathname: string): boolean {
  return (
    VISIBLE_ROUTES.has(pathname) || [...VISIBLE_ROUTES].some((r) => pathname.startsWith(`${r}/`))
  );
}

export function CoralFAB() {
  const router = useRouter();
  const pathname = usePathname();
  const coral = useCoralColors();
  const isIOS = Platform.OS === "ios";
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    scale.setValue(0);
    Animated.spring(scale, {
      toValue: 1,
      damping: 16,
      stiffness: 280,
      useNativeDriver: true,
    }).start();
  }, [pathname, scale]);

  if (!isVisible(pathname)) return null;

  return (
    <Animated.View
      style={{
        position: "absolute",
        zIndex: 11,
        right: isIOS ? 24 : 18,
        bottom: isIOS ? 88 : 76,
        transform: [{ scale }],
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add expense"
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          router.push("/expense/new" as any);
        }}
        style={({ pressed }) => ({
          width: isIOS ? 56 : 60,
          height: isIOS ? 56 : 60,
          borderRadius: isIOS ? 9999 : 16,
          backgroundColor: coral.accent,
          alignItems: "center",
          justifyContent: "center",
          opacity: pressed ? 0.85 : 1,
          shadowColor: coral.accent,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.35,
          shadowRadius: 14,
          elevation: 10,
        })}
      >
        <Plus size={26} color={coral.inkOnAccent} strokeWidth={2.2} />
      </Pressable>
    </Animated.View>
  );
}
