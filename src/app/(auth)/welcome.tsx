import { Button } from "heroui-native";
import { useRouter } from "expo-router";
import type { JSX } from "react";
import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { Text, View, Dimensions, FlatList } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as icons from "lucide-react-native";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

const SLIDES = [
  {
    id: "1",
    title: "Save your time\nand money",
    description: "Enjoy together, happy to share and save your\ntime with transactions at home.",
    icon: icons.Wallet,
    logoText: "splt",
  },
  {
    id: "2",
    title: "Split bills\neffortlessly",
    description: "No more awkward math. We handle the\ncalculations so you can enjoy the moment.",
    icon: icons.Users,
    logoText: "together",
  },
  {
    id: "3",
    title: "Track your\nexpenses",
    description: "Get insights into your spending habits\nand stay on top of your budget.",
    icon: icons.PieChart,
    logoText: "insights",
  },
];

export default function WelcomeScreen(): JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = Dimensions.get("window");
  const [currentIndex, setCurrentIndex] = useState(0);

  return (
    <Animated.View entering={FadeInDown.duration(300).springify()} className="flex-1 bg-background">
      <StatusBar style="light" />

      {/* Fixed Top Background with rounded bottom */}
      <View
        className="bg-primary overflow-hidden rounded-b-[40px]"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: height * 0.6,
        }}
      >
        {/* Floating decor elements */}
        <Animated.View
          entering={FadeInDown.delay(500)}
          style={{ position: "absolute", top: "20%", left: "15%" }}
        >
          <View className="bg-white p-3 rounded-xl" style={{ transform: [{ rotate: "-15deg" }] }}>
            <Text className="font-bold text-primary">$</Text>
          </View>
        </Animated.View>
        <Animated.View
          entering={FadeInDown.delay(700)}
          style={{ position: "absolute", bottom: "25%", right: "20%" }}
        >
          <View className="bg-white p-3 rounded-xl" style={{ transform: [{ rotate: "15deg" }] }}>
            <Text className="font-bold text-primary">$</Text>
          </View>
        </Animated.View>
      </View>

      {/* Swipeable Content */}
      <FlatList
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={(e) => {
          const x = e.nativeEvent.contentOffset.x;
          const newIndex = Math.round(x / width);
          if (newIndex !== currentIndex) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setCurrentIndex(newIndex);
          }
        }}
        scrollEventThrottle={16}
        renderItem={({ item }) => (
          <View style={{ width, flex: 1 }}>
            {/* Top Illustration Area */}
            <View style={{ height: height * 0.6, alignItems: "center", justifyContent: "center" }}>
              <Animated.View entering={FadeIn.delay(300).duration(800)}>
                <View className="items-center gap-6">
                  <item.icon size={80} color="white" strokeWidth={1} />
                  <Text
                    style={{ fontSize: 32, fontWeight: "900", color: "white", letterSpacing: -1 }}
                  >
                    {item.logoText}
                  </Text>
                </View>
              </Animated.View>
            </View>

            {/* Bottom Content Area */}
            <View style={{ flex: 1, paddingHorizontal: 32, paddingTop: 40, alignItems: "center" }}>
              <View style={{ alignItems: "center", gap: 16 }}>
                <Animated.Text
                  entering={FadeInDown.delay(200).springify()}
                  className="text-foreground text-[34px] font-[800] text-center"
                  style={{ lineHeight: 40 }}
                >
                  {item.title}
                </Animated.Text>

                <Animated.Text
                  entering={FadeInDown.delay(300).springify()}
                  className="text-muted-foreground text-base text-center"
                  style={{ lineHeight: 24 }}
                >
                  {item.description}
                </Animated.Text>
              </View>
            </View>
          </View>
        )}
      />

      {/* Bottom Controls */}
      <View style={{ paddingBottom: insets.bottom + 24, alignItems: "center" }}>
        {/* Navigation dots */}
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 24 }}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              className={`w-2 h-2 rounded-full ${currentIndex === i ? "bg-primary" : "bg-muted-foreground opacity-30"}`}
            />
          ))}
        </View>

        {/* Get Started Button */}
        <Animated.View
          entering={FadeInDown.delay(400).springify()}
          style={{ width: "100%", alignItems: "center" }}
        >
          <Button
            size="lg"
            variant="primary"
            className="bg-foreground"
            style={{
              width: "70%",
              borderRadius: 24,
              height: 56,
            }}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push("/(auth)/login");
            }}
          >
            <Text className="text-background font-[600] text-[16px]">Get Started</Text>
          </Button>
        </Animated.View>
      </View>
    </Animated.View>
  );
}
