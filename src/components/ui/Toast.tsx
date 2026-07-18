import type { JSX } from "react";
import { View, Pressable, Text } from "react-native";
import * as icons from "lucide-react-native";
import Animated, { FadeInDown, FadeOutUp } from "react-native-reanimated";
import { useUI } from "@/components/ui";
import { useCoralColors } from "@/components/coral";

export function CustomToast({
  props,
  options,
}: {
  props: { id: string; hide: (id: string) => void };
  options: { label?: string; description?: string; variant?: string };
}): JSX.Element {
  const { color, radius, space, shadow } = useUI();
  const coral = useCoralColors();
  const isDanger = options.variant === "danger";
  const isSuccess = options.variant === "success";

  const IconComponent = isDanger ? icons.AlertCircle : isSuccess ? icons.CheckCircle : icons.Info;
  const iconColor = isDanger ? color.danger : isSuccess ? color.success : color.text;

  return (
    <Animated.View
      entering={FadeInDown.duration(300).springify()}
      exiting={FadeOutUp.duration(200)}
      style={{
        width: "90%",
        alignSelf: "center",
        marginTop: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
      }}
    >
      <View
        style={{
          borderRadius: radius.lg,
          overflow: "hidden",
          backgroundColor: coral.surface,
          borderWidth: 1,
          borderColor: color.border,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingVertical: 14,
            minHeight: 56,
          }}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 14,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: color.border,
              marginRight: 14,
            }}
          >
            <IconComponent size={20} color={iconColor} strokeWidth={1.5} />
          </View>
          <View style={{ flex: 1 }}>
            {!!options.label && (
              <Text
                numberOfLines={1}
                style={{
                  fontSize: 15,
                  color: color.text,
                  fontFamily: "InstrumentSans_600SemiBold",
                }}
              >
                {options.label}
              </Text>
            )}
            {!!options.description && (
              <Text
                numberOfLines={2}
                style={{
                  fontSize: 13,
                  color: color.muted,
                  fontFamily: "InstrumentSans_500Medium",
                  marginTop: 2,
                }}
              >
                {options.description}
              </Text>
            )}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Dismiss"
            onPress={() => props.hide(props.id)}
            hitSlop={8}
            style={({ pressed }) => ({
              width: 32,
              height: 32,
              borderRadius: radius.pill,
              borderWidth: 1,
              borderColor: color.border,
              alignItems: "center",
              justifyContent: "center",
              marginLeft: 12,
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <icons.X size={14} color={color.muted} strokeWidth={2} />
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}
