import type { JSX, ReactNode } from "react";
import { View, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { Typography } from "heroui-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import * as icons from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useUIStore } from "@/store/useUIStore";
import { ThemedStatusBar } from "@/components/ui/ThemedStatusBar";
import { PressableScale } from "@/components/ui/PressableScale";
import GlassBackground from "@/components/glassmorphism/GlassBackground";
import GlassSurface from "@/components/glassmorphism/GlassSurface";
import GlassAuthMark from "@/components/glassmorphism/GlassAuthMark";
import { GLASS_LIGHT, GLASS_DARK, GLASS_RADIUS } from "@/constants/glassmorphism-tokens";

interface GlassAuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  onSubmit: () => void;
  isPending: boolean;
  submitLabel: string;
  submitLoadingLabel?: string;
  footer?: ReactNode;
  secondaryActions?: ReactNode;
  headerTitle?: string;
  headerElement?: ReactNode;
}

export default function GlassAuthLayout({
  title,
  subtitle,
  children,
  onSubmit,
  isPending,
  submitLabel,
  submitLoadingLabel,
  footer,
  secondaryActions,
  headerTitle,
  headerElement,
}: GlassAuthLayoutProps): JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isDarkMode = useUIStore((s) => s.isDarkMode);
  const tokens = isDarkMode ? GLASS_DARK : GLASS_LIGHT;

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bg }}>
      <ThemedStatusBar />
      <GlassBackground />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View
          style={{
            paddingTop: insets.top + 12,
            paddingHorizontal: 18,
            zIndex: 10,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              minHeight: 54,
            }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace("/");
                }
              }}
              hitSlop={8}
              style={({ pressed }) => ({
                width: 46,
                height: 46,
                borderRadius: GLASS_RADIUS.pill,
                backgroundColor: Platform.OS === "ios" ? "transparent" : tokens.surface,
                borderWidth: 1,
                borderColor: tokens.border,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <icons.ArrowLeft
                size={20}
                color={tokens.text}
                strokeWidth={1.75}
              />
            </Pressable>
            {headerTitle && (
              <Typography
                style={{
                  fontFamily: "Sora_600SemiBold",
                  fontSize: 28,
                  lineHeight: 30,
                  letterSpacing: -0.02,
                  color: tokens.text,
                  marginLeft: 12,
                  flex: 1,
                }}
              >
                {headerTitle}
              </Typography>
            )}
            {headerElement}
          </View>
        </View>

        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 18,
            paddingTop: 8,
            paddingBottom: insets.bottom + 30,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ flex: 1 }}>
            <Animated.View
              entering={FadeInDown.delay(100).duration(600).springify()}
              style={{ alignItems: "center" }}
            >
              <GlassAuthMark />
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(200).duration(600).springify()}
            >
              <Typography
                style={{
                  fontFamily: "Sora_600SemiBold",
                  fontSize: 38,
                  lineHeight: 42,
                  letterSpacing: -0.025,
                  color: tokens.text,
                  marginBottom: 12,
                }}
              >
                {title}
              </Typography>
              <Typography
                style={{
                  fontFamily: "IBMPlexSans_400Regular",
                  fontSize: 16,
                  lineHeight: 25,
                  color: tokens.muted,
                  maxWidth: "90%",
                }}
              >
                {subtitle}
              </Typography>
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(300).duration(600).springify()}
              style={{ marginTop: 24, gap: 4 }}
            >
              {children}
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(500).duration(600).springify()}
              style={{ marginTop: 20 }}
            >
              <PressableScale onPress={onSubmit}>
                <View
                  style={{
                    width: "100%",
                    minHeight: 50,
                    borderRadius: GLASS_RADIUS.md,
                    backgroundColor: tokens.accent,
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "row",
                    gap: 8,
                    opacity: isPending ? 0.7 : 1,
                    shadowColor: isDarkMode
                      ? "rgba(91, 148, 255, 0.3)"
                      : "rgba(79, 140, 255, 0.3)",
                    shadowOffset: { width: 0, height: 10 },
                    shadowOpacity: 1,
                    shadowRadius: 28,
                    elevation: 8,
                  }}
                >
                  {isPending && <ActivityIndicator color={tokens.accentOn} />}
                  <Typography
                    style={{
                      fontSize: 16,
                      fontFamily: "IBMPlexSans_600SemiBold",
                      letterSpacing: 0.02,
                      color: tokens.accentOn,
                    }}
                  >
                    {isPending ? submitLoadingLabel || submitLabel : submitLabel}
                  </Typography>
                </View>
              </PressableScale>
            </Animated.View>

            {secondaryActions && (
              <Animated.View
                entering={FadeInDown.delay(550).duration(600)}
                style={{ marginTop: 14 }}
              >
                {secondaryActions}
              </Animated.View>
            )}
          </View>

          {footer && (
            <Animated.View
              entering={FadeInDown.delay(600).duration(600)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                paddingTop: 20,
              }}
            >
              {footer}
            </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
