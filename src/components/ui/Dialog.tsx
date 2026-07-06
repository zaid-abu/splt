import type { JSX, ReactNode } from "react";
import { View, Pressable, Modal, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from "react-native-reanimated";
import { twMerge } from "tailwind-merge";
import * as Haptics from "expo-haptics";
import { Text } from "./Text";
import { Button } from "./Button";

interface DialogProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  actions?: {
    label: string;
    variant?: "primary" | "danger" | "ghost";
    onPress: () => void;
    loading?: boolean;
  }[];
}

export function Dialog({
  visible,
  onClose,
  title,
  description,
  children,
  actions,
}: DialogProps): JSX.Element {
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(150)}
        className="flex-1 items-center justify-center px-6"
        style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
      >
        <Pressable className="absolute inset-0" onPress={onClose} />
        <Animated.View
          entering={SlideInDown.duration(250).springify()}
          exiting={SlideOutDown.duration(150)}
          className="w-full max-w-sm bg-surface border border-border rounded-2xl overflow-hidden"
        >
          <View className="p-6 gap-2">
            <Text variant="h4" color="foreground">
              {title}
            </Text>
            {description && (
              <Text variant="body-sm" color="muted">
                {description}
              </Text>
            )}
            {children}
          </View>
          {actions && actions.length > 0 && (
            <View className="flex-row border-t border-divider">
              {actions.map((action, i) => (
                <Pressable
                  key={i}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    action.onPress();
                  }}
                  className={twMerge(
                    "flex-1 h-14 items-center justify-center",
                    i < actions.length - 1 && "border-r border-divider",
                    action.variant === "danger" && "bg-danger-soft",
                  )}
                >
                  <Text
                    variant="body"
                    weight="bold"
                    color={
                      action.variant === "danger"
                        ? "danger"
                        : action.variant === "primary"
                          ? "primary"
                          : "foreground"
                    }
                  >
                    {action.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
