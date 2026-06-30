import { Tabs, useRouter } from "expo-router";
import type { JSX } from "react";
import { View, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as icons from "lucide-react-native";
import { PressableFeedback, Typography } from "heroui-native";
import Animated, { useAnimatedStyle, withSpring, withTiming } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { BlurView } from "expo-blur";

type TabBarItemProps = {
  isFocused: boolean;
  icon: any;
  label: string;
  onPress: () => void;
};

function TabBarItem({ isFocused, icon: Icon, label, onPress }: TabBarItemProps): JSX.Element {
  // Animate the icon shifting up slightly when active
  const iconAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: withSpring(isFocused ? -6 : 0, { damping: 14, stiffness: 120 }) },
        { scale: withSpring(isFocused ? 1.15 : 1, { damping: 14, stiffness: 120 }) },
      ],
    };
  });

  // Animate the label fading in and sliding up
  const textAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(isFocused ? 1 : 0, { duration: 150 }),
      transform: [{ translateY: withSpring(isFocused ? 0 : 4, { damping: 14, stiffness: 120 }) }],
    };
  });

  const handlePress = () => {
    if (!isFocused) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  return (
    <PressableFeedback onPress={handlePress}>
      <View className="flex-1 items-center justify-center h-14 w-16 relative">
        <Animated.View style={iconAnimatedStyle}>
          <Icon
            size={24}
            color={isFocused ? "#3D2B82" : "#8A8798"}
            strokeWidth={isFocused ? 2.5 : 2}
          />
        </Animated.View>
        <Animated.View style={[textAnimatedStyle, { position: "absolute", bottom: 2 }]}>
          <Typography style={{ color: "#3D2B82", fontSize: 11, fontWeight: "700" }}>
            {label}
          </Typography>
        </Animated.View>
      </View>
    </PressableFeedback>
  );
}

export default function TabsLayout(): JSX.Element {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: "transparent",
          borderTopWidth: 0,
          elevation: 0,
        },
      }}
      tabBar={({ state, navigation }) => {
        return (
          <BlurView
            intensity={100}
            tint="light"
            className="flex-row items-center justify-between"
            style={{
              position: "absolute",
              bottom: Platform.OS === "ios" ? Math.max(insets.bottom, 16) + 10 : 20,
              left: 20,
              right: 20,
              backgroundColor: "rgba(255, 255, 255, 0.85)",
              borderRadius: 32,
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderWidth: 1,
              borderColor: "rgba(0,0,0,0.03)",
              overflow: "hidden",
              elevation: 10,
            }}
          >
            {/* 1. Home */}
            <TabBarItem
              isFocused={state.index === 0}
              icon={icons.Home}
              label="Home"
              onPress={() => navigation.navigate("index")}
            />

            {/* 2. Groups (index 1 in Tabs definition) */}
            <TabBarItem
              isFocused={state.index === 1}
              icon={icons.FileText}
              label="Groups"
              onPress={() => navigation.navigate("groups")}
            />

            {/* 3. Center FAB (Create Expense) */}
            <View className="flex-1 items-center justify-center h-14">
              <View
                style={{
                  elevation: 5,
                  borderRadius: 24, // for elevation to know the shape
                }}
              >
                <PressableFeedback
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    router.push("/expense/new");
                  }}
                  className="rounded-full overflow-hidden"
                >
                  <View className="w-12 h-12 bg-primary items-center justify-center">
                    <icons.Plus size={26} color="white" strokeWidth={3} />
                  </View>
                </PressableFeedback>
              </View>
            </View>

            {/* 4. Friends (index 2 in Tabs definition) */}
            <TabBarItem
              isFocused={state.index === 2}
              icon={icons.Users}
              label="Friends"
              onPress={() => navigation.navigate("friends")}
            />

            {/* 5. Activity (index 3 in Tabs definition) */}
            <TabBarItem
              isFocused={state.index === 3}
              icon={icons.TrendingUp}
              label="Activity"
              onPress={() => navigation.navigate("activity")}
            />
          </BlurView>
        );
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="groups" />
      <Tabs.Screen name="friends" />
      <Tabs.Screen name="activity" />
    </Tabs>
  );
}
