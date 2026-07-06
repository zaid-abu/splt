import { Tabs, useRouter, Redirect } from "expo-router";
import type { JSX } from "react";
import { View, TouchableOpacity, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as icons from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/context/AppContext";

const ICON_SIZE = 22;
const ICON_STROKE_INACTIVE = 1.5;
const ICON_STROKE_ACTIVE = 2;

type TabBarItemProps = {
  isFocused: boolean;
  icon: React.ComponentType<{ size: number; color: string; strokeWidth: number }>;
  label: string;
  onPress: () => void;
};

function TabBarItem({ isFocused, icon: Icon, label, onPress }: TabBarItemProps): JSX.Element {
  const handlePress = () => {
    if (!isFocused) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  return (
    <TouchableOpacity
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: isFocused }}
      onPress={handlePress}
      activeOpacity={0.7}
      className="flex-1 items-center justify-center py-2.5"
    >
      <Icon
        size={ICON_SIZE}
        color={isFocused ? "#FB923C" : "#8E8E93"}
        strokeWidth={isFocused ? ICON_STROKE_ACTIVE : ICON_STROKE_INACTIVE}
      />
      {isFocused && (
        <View className="w-1 h-1 bg-primary rounded-full mt-1.5" />
      )}
      {!isFocused && <View className="w-1 h-1 mt-1.5" />}
    </TouchableOpacity>
  );
}

function AddTabItem({ onPress }: { onPress: () => void }): JSX.Element {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel="Add expense"
      onPress={handlePress}
      activeOpacity={0.7}
      className="flex-1 items-center justify-center py-2.5"
    >
      <icons.PlusCircle size={ICON_SIZE + 2} color="#8E8E93" strokeWidth={ICON_STROKE_INACTIVE} />
      <View className="w-1 h-1 mt-1.5 opacity-0" />
    </TouchableOpacity>
  );
}

export default function TabsLayout(): JSX.Element | null {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) return <Redirect href="/(auth)/welcome" />;

  const tabBarHeight = 52 + Math.max(insets.bottom, Platform.OS === "android" ? 8 : 0);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: "none" },
      }}
      tabBar={({ state, navigation }) => {
        const navigate = (routeName: string) => navigation.navigate(routeName);

        return (
          <View
            className="absolute left-0 right-0 bottom-0"
            style={{
              height: tabBarHeight,
              backgroundColor: "#09090B",
              borderTopWidth: 1,
              borderTopColor: "#26262D",
              flexDirection: "row",
              alignItems: "flex-start",
              paddingTop: 0,
              paddingBottom: insets.bottom,
              elevation: 0,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -1 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
            }}
          >
            <TabBarItem
              isFocused={state.index === 0}
              icon={icons.Home}
              label="Home"
              onPress={() => navigate("index")}
            />

            <TabBarItem
              isFocused={state.index === 1}
              icon={icons.BarChart2}
              label="Stats"
              onPress={() => navigate("stats")}
            />

            <AddTabItem onPress={() => router.push("/expense/new")} />

            <TabBarItem
              isFocused={state.index === 2}
              icon={icons.Users}
              label="Friends"
              onPress={() => navigate("friends")}
            />

            <TabBarItem
              isFocused={state.index === 3}
              icon={icons.User}
              label="Profile"
              onPress={() => navigate("profile")}
            />
          </View>
        );
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="stats" />
      <Tabs.Screen name="friends" />
      <Tabs.Screen name="profile" />
      <Tabs.Screen name="activity" />
    </Tabs>
  );
}
