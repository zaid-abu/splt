import { View, Pressable, Platform } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { BlurView } from "expo-blur";
import { LayoutDashboard, Users, UsersRound, ScrollText } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUIStore } from "@/store/useUIStore";
import { useCoralColors } from "./useCoral";

const TABS = [
  { key: "home", icon: LayoutDashboard, label: "Home", route: "/home" },
  { key: "people", icon: Users, label: "People", route: "/people" },
  { key: "groups", icon: UsersRound, label: "Groups", route: "/groups" },
  { key: "activity", icon: ScrollText, label: "Activity", route: "/activity" },
];

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

function isActive(pathname: string, route: string): boolean {
  if (route === "/home") return pathname === "/home";
  return pathname === route || pathname.startsWith(`${route}/`);
}

export function CoralTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const isDark = useUIStore((s) => s.isDarkMode);
  const coral = useCoralColors();
  const isIOS = Platform.OS === "ios";

  if (!isVisible(pathname)) return null;

  return (
    <BlurView
      intensity={isIOS ? 85 : 60}
      tint={(isDark ? "dark" : "light") as "dark" | "light"}
      blurReductionFactor={2}
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-around",
        paddingTop: 6,
        paddingBottom: insets.bottom + 4,
        borderTopWidth: 1,
        borderTopColor: coral.border,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -1 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 8,
      }}
    >
      {TABS.map((tab) => {
        const active = isActive(pathname, tab.route);

        return (
          <Pressable
            key={tab.key}
            accessibilityRole="button"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected: active }}
            onPress={() => {
              if (!active) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(tab.route as any);
              }
            }}
            style={({ pressed }) => ({
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              paddingTop: 4,
              paddingBottom: 2,
              minWidth: 60,
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <tab.icon
              size={24}
              color={active ? coral.accent : coral.muted}
              strokeWidth={active ? 2.2 : 1.7}
            />
            {active && (
              <View
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: coral.accent,
                }}
              />
            )}
          </Pressable>
        );
      })}
    </BlurView>
  );
}

export const TAB_BAR_HEIGHT = 56;
