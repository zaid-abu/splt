import { Button, Typography } from "heroui-native";
import { useRouter } from "expo-router";
import type { JSX } from "react";
import { useState, useRef } from "react";
import { StatusBar } from "expo-status-bar";
import { View, Dimensions, FlatList, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as icons from "lucide-react-native";
import Animated, {
  FadeInDown,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
  Extrapolate,
  useAnimatedScrollHandler,
  interpolateColor,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

const { width, height } = Dimensions.get("window");

const SLIDES = [
  {
    id: "1",
    title: "Save your time\nand money",
    description: "Enjoy together, happy to share and save your\ntime with transactions at home.",
    icon: icons.Wallet,
    logoText: "splt",
    color: "#3D2B82", // primary
  },
  {
    id: "2",
    title: "Split bills\neffortlessly",
    description: "No more awkward math. We handle the\ncalculations so you can enjoy the moment.",
    icon: icons.Users,
    logoText: "together",
    color: "#5B44B3",
  },
  {
    id: "3",
    title: "Track your\nexpenses",
    description: "Get insights into your spending habits\nand stay on top of your budget.",
    icon: icons.PieChart,
    logoText: "insights",
    color: "#271B54",
  },
];

const Dot = ({ index, scrollX, width }: { index: number; scrollX: any; width: number }) => {
  const dotStyle = useAnimatedStyle(() => {
    const isActive = Math.round(scrollX.value / width) === index;
    return {
      width: withSpring(isActive ? 24 : 8),
      backgroundColor: isActive ? "#3D2B82" : "#E5E5EA",
    };
  });
  return <Animated.View className="h-2 rounded-full" style={dotStyle} />;
};

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

export default function WelcomeScreen(): JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);

  const scrollX = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const scrollRange = SLIDES.map((_, i) => i * width);
  const colorRange = SLIDES.map((s) => s.color);

  const backgroundStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(scrollX.value, scrollRange, colorRange);
    return { backgroundColor };
  });

  return (
    <Animated.View style={[{ flex: 1, backgroundColor: "#3D2B82" }, backgroundStyle]}>
      <StatusBar style="light" />

      {/* Dynamic Decor Background Elements */}
      <Animated.View
        entering={FadeInDown.delay(500)}
        style={{ position: "absolute", top: "15%", left: "10%" }}
      >
        <View className="bg-white/20 p-3 rounded-2xl" style={{ transform: [{ rotate: "-15deg" }] }}>
          <Typography className="font-bold text-white text-[24px]">$</Typography>
        </View>
      </Animated.View>
      <Animated.View
        entering={FadeInDown.delay(700)}
        style={{ position: "absolute", top: "25%", right: "12%" }}
      >
        <View className="bg-white/20 p-4 rounded-3xl" style={{ transform: [{ rotate: "15deg" }] }}>
          <Typography className="font-bold text-white text-[28px]">%</Typography>
        </View>
      </Animated.View>

      <AnimatedFlatList
        data={SLIDES}
        keyExtractor={(item: any) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) => {
          const x = e.nativeEvent.contentOffset.x;
          const newIndex = Math.round(x / width);
          if (newIndex !== currentIndex) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setCurrentIndex(newIndex);
          }
        }}
        renderItem={({ item, index }: any) => {
          return (
            <View
              style={{
                width,
                flex: 1,
                paddingHorizontal: 32,
                justifyContent: "center",
                paddingBottom: 20,
              }}
            >
              {/* Top Illustration Area */}
              <View
                style={{
                  alignItems: "center",
                  justifyContent: "center",
                  paddingTop: insets.top,
                  marginBottom: 32,
                }}
              >
                <Animated.View entering={FadeIn.delay(200).duration(800)}>
                  <View
                    className="items-center justify-center w-40 h-40 rounded-[48px] bg-white/10 mb-8"
                    style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" }}
                  >
                    <item.icon size={64} color="white" strokeWidth={1.5} />
                  </View>
                </Animated.View>
                <Animated.View entering={FadeInDown.delay(300)}>
                  <Typography
                    style={{
                      fontSize: 36,
                      fontWeight: "900",
                      color: "white",
                      letterSpacing: -1.5,
                      lineHeight: 48,
                    }}
                  >
                    {item.logoText}
                  </Typography>
                </Animated.View>
              </View>

              {/* Bottom Content Area */}
              <View style={{ alignItems: "center", marginTop: 24 }}>
                <Animated.Text
                  entering={FadeInDown.delay(400).springify()}
                  className="text-white text-[34px] font-[800] text-center mb-4"
                  style={{ lineHeight: 40 }}
                >
                  {item.title}
                </Animated.Text>
                <Animated.Text
                  entering={FadeInDown.delay(500).springify()}
                  className="text-white/70 text-[16px] text-center"
                  style={{ lineHeight: 24 }}
                >
                  {item.description}
                </Animated.Text>
              </View>
            </View>
          );
        }}
      />

      {/* Bottom Controls inside a white card */}
      <Animated.View
        entering={FadeInDown.delay(600).duration(500)}
        className="bg-white rounded-t-[40px] px-8 pt-8 pb-10"
        style={{ paddingBottom: Math.max(insets.bottom + 16, 40) }}
      >
        <View className="flex-row justify-center gap-2 mb-8">
          {SLIDES.map((_, i) => (
            <Dot key={i} index={i} scrollX={scrollX} width={width} />
          ))}
        </View>

        <View className="gap-3">
          <Button
            size="lg"
            variant="primary"
            className="w-full h-14 rounded-[16px] bg-[#3D2B82]"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push("/(auth)/register");
            }}
          >
            <Typography type="body" weight="semibold" className="text-white">
              Create an account
            </Typography>
          </Button>

          <Button
            size="lg"
            variant="secondary"
            className="w-full h-14 rounded-[16px] bg-[#F2F2F6]"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/(auth)/login");
            }}
          >
            <Typography type="body" weight="semibold" className="text-foreground">
              Log in
            </Typography>
          </Button>
        </View>
      </Animated.View>
    </Animated.View>
  );
}
