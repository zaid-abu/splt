import type { JSX } from "react";
import { View, Pressable } from "react-native";
import { Typography } from "heroui-native";
import * as icons from "lucide-react-native";
import { UI } from "@/components/ui/native-ui";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ title = "Something went wrong", message = "An unexpected error occurred.", onRetry }: ErrorStateProps): JSX.Element {
  return (
    <View
      style={{
        alignItems: "center",
        backgroundColor: UI.color.surface,
        borderRadius: UI.radius.lg,
        borderWidth: 1,
        borderColor: UI.color.border,
        padding: 32,
        marginHorizontal: UI.space.page,
      }}
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: UI.radius.lg,
          backgroundColor: UI.color.dangerTint,
          borderWidth: 1,
          borderColor: UI.color.border,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
        }}
      >
        <icons.AlertCircle size={24} color={UI.color.danger} strokeWidth={1.5} />
      </View>
      <Typography
        style={{
          fontSize: 17,
          color: UI.color.text,
          fontFamily: "IBMPlexSans_600SemiBold",
          textAlign: "center",
          marginBottom: 8,
        }}
      >
        {title}
      </Typography>
      <Typography
        style={{
          fontSize: 14,
          color: UI.color.muted,
          fontFamily: "IBMPlexSans_500Medium",
          textAlign: "center",
          lineHeight: 20,
          marginBottom: onRetry ? 20 : 0,
        }}
      >
        {message}
      </Typography>
      {onRetry && (
        <Pressable
          onPress={onRetry}
          style={({ pressed }) => ({
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: UI.radius.pill,
            backgroundColor: UI.color.text,
            opacity: pressed ? 0.75 : 1,
          })}
        >
          <Typography style={{ fontSize: 15, color: "#FFFFFF", fontFamily: "IBMPlexSans_600SemiBold" }}>
            Try Again
          </Typography>
        </Pressable>
      )}
    </View>
  );
}
