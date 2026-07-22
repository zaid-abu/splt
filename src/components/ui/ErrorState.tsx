import type { JSX } from "react";
import { View, Pressable, Text } from "react-native";
import * as icons from "lucide-react-native";
import { useUI } from "@/components/ui/hooks/useUI";
import { useCoralColors } from "@/components/coral";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Something went wrong",
  message = "An unexpected error occurred.",
  onRetry,
}: ErrorStateProps): JSX.Element {
  const { color, radius, space, shadow } = useUI();
  const coral = useCoralColors();

  return (
    <View
      style={{
        borderRadius: radius.lg,
        padding: 32,
        marginHorizontal: space.page,
        backgroundColor: coral.surface,
        borderWidth: 1,
        borderColor: color.border,
      }}
    >
      <View style={{ alignItems: "center" }}>
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: radius.lg,
            backgroundColor: color.dangerTint,
            borderWidth: 1,
            borderColor: color.border,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
          }}
        >
          <icons.AlertCircle size={24} color={color.danger} strokeWidth={1.5} />
        </View>
        <Text
          style={{
            fontSize: 17,
            color: color.text,
            fontFamily: "InstrumentSans_600SemiBold",
            textAlign: "center",
            marginBottom: 8,
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: color.muted,
            fontFamily: "InstrumentSans_500Medium",
            textAlign: "center",
            lineHeight: 20,
            marginBottom: onRetry ? 20 : 0,
          }}
        >
          {message}
        </Text>
        {onRetry && (
          <Pressable
            onPress={onRetry}
            style={({ pressed }) => ({
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: radius.pill,
              backgroundColor: color.text,
              opacity: pressed ? 0.75 : 1,
            })}
          >
            <Text
              style={{
                fontSize: 15,
                color: color.textInverse,
                fontFamily: "InstrumentSans_600SemiBold",
              }}
            >
              Try Again
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
