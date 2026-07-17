import type { JSX } from "react";
import { View, Pressable } from "react-native";
import { Typography } from "heroui-native";
import * as icons from "lucide-react-native";
import Animated, { FadeInDown, FadeOutUp } from "react-native-reanimated";
import { useUI } from "@/components/ui/native-ui";

export function CustomToast({
  props,
  options,
}: {
  props: { id: string; hide: (id: string) => void };
  options: { label?: string; description?: string; variant?: string };
}): JSX.Element {
  const { color, radius, space, shadow } = useUI();
  const isDanger = options.variant === "danger";
  const isSuccess = options.variant === "success";

  const IconComponent = isDanger ? icons.AlertCircle : isSuccess ? icons.CheckCircle : icons.Info;
  const iconColor = isDanger ? color.danger : isSuccess ? color.success : color.text;

  return (
    <Animated.View
      entering={FadeInDown.duration(300).springify()}
      exiting={FadeOutUp.duration(200)}
      style={{
        backgroundColor: color.surface,
        borderWidth: 1,
        borderColor: color.border,
        borderRadius: radius.lg,
        paddingHorizontal: 16,
        paddingVertical: 14,
        flexDirection: "row",
        alignItems: "center",
        minHeight: 56,
        width: "90%",
        alignSelf: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        marginTop: 16,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 14,
          backgroundColor: color.control,
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
          <Typography
            numberOfLines={1}
            style={{
              fontSize: 15,
              color: color.text,
              fontFamily: "IBMPlexSans_600SemiBold",
            }}
          >
            {options.label}
          </Typography>
        )}
        {!!options.description && (
          <Typography
            numberOfLines={2}
            style={{
              fontSize: 13,
              color: color.muted,
              fontFamily: "IBMPlexSans_500Medium",
              marginTop: 2,
            }}
          >
            {options.description}
          </Typography>
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
          backgroundColor: color.control,
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
    </Animated.View>
  );
}
