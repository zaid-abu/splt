import { Typography } from "heroui-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import type { JSX, ReactNode } from "react";
import { ThemedStatusBar } from "@/components/ui/ThemedStatusBar";
import { KeyboardAvoidingView, Platform, ScrollView, View, ActivityIndicator } from "react-native";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as icons from "lucide-react-native";
import { useUI, IconButton } from "@/components/ui";
import { PressableScale } from "@/components/ui/PressableScale";
import { useUIStore } from "@/store/useUIStore";
import { useRouter } from "expo-router";

interface AuthFormLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  onSubmit: () => void;
  isPending: boolean;
  submitLabel: string;
  submitLoadingLabel?: string;
  footer?: ReactNode;
  secondaryActions?: ReactNode;
}

export default function AuthFormLayout({
  title,
  subtitle,
  children,
  onSubmit,
  isPending,
  submitLabel,
  submitLoadingLabel,
  footer,
  secondaryActions,
}: AuthFormLayoutProps): JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isDarkMode = useUIStore((s) => s.isDarkMode);
  const { color, radius } = useUI();

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      <ThemedStatusBar />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View
          style={{
            paddingTop: insets.top + 16,
            paddingHorizontal: 24,
            paddingBottom: 16,
            backgroundColor: color.bg,
            zIndex: 10,
          }}
        >
          <IconButton
            icon={icons.ArrowLeft}
            accessibilityLabel="Go back"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace("/");
              }
            }}
          />
        </View>

        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 24,
            paddingTop: 8,
            paddingBottom: insets.bottom + 24,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ flex: 1 }}>
            <Animated.View
              entering={FadeInDown.delay(200).duration(600).springify()}
              style={{ marginBottom: 40 }}
            >
              <Typography
                style={{
                  fontFamily: "Sora_600SemiBold",
                  fontSize: 40,
                  color: color.textStrong,
                  lineHeight: 46,
                  letterSpacing: -0.02,
                  marginBottom: 12,
                }}
              >
                {title}
              </Typography>
              <Typography
                style={{
                  fontFamily: "IBMPlexSans_400Regular",
                  fontSize: 17,
                  color: color.muted,
                  lineHeight: 24,
                }}
              >
                {subtitle}
              </Typography>
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(300).duration(600).springify()}
              style={{
                borderRadius: radius.lg,
                overflow: "hidden",
              }}
            >
              <BlurView
                intensity={Platform.OS === "ios" ? 60 : 90}
                tint={isDarkMode ? "dark" : "light"}
                style={{
                  padding: 20,
                  gap: 20,
                  backgroundColor: Platform.OS === "android" ? color.control : "transparent",
                }}
              >
                {children}
              </BlurView>
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(500).duration(600).springify()}
              style={{ marginTop: 24 }}
            >
              <PressableScale onPress={onSubmit}>
                <View
                  style={{
                    width: "100%",
                    height: 56,
                    borderRadius: radius.pill,
                    backgroundColor: color.text,
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "row",
                    gap: 8,
                    opacity: isPending ? 0.7 : 1,
                  }}
                >
                  {isPending && <ActivityIndicator color={color.textInverse} />}
                  <Typography
                    style={{
                      fontSize: 16,
                      color: color.textInverse,
                      fontFamily: "IBMPlexSans_600SemiBold",
                    }}
                  >
                    {isPending ? submitLoadingLabel || submitLabel : submitLabel}
                  </Typography>
                </View>
              </PressableScale>
            </Animated.View>

            {secondaryActions && (
              <Animated.View
                entering={FadeInDown.delay(500).duration(600)}
                style={{ paddingTop: 12 }}
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
                paddingVertical: 16,
                marginTop: 48,
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
