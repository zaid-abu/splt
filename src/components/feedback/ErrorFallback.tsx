import React from "react";
import type { JSX } from "react";
import { View, Text, Pressable } from "react-native";
import type { ErrorBoundaryProps } from "expo-router";
import { UI } from "@/components/ui/native-ui";

export function ErrorFallback({ error, retry }: ErrorBoundaryProps): JSX.Element {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: UI.color.bg,
        padding: 24,
      }}
    >
      <View
        style={{
          width: "100%",
          maxWidth: 400,
          backgroundColor: UI.color.surface,
          padding: 24,
          borderRadius: UI.radius.lg,
          borderWidth: 1,
          borderColor: UI.color.border,
        }}
      >
        <Text
          style={{
            fontSize: 24,
            color: UI.color.text,
            fontFamily: "Sora_600SemiBold",
            marginBottom: 12,
          }}
        >
          Something went wrong!
        </Text>
        <Text
          style={{
            fontSize: 16,
            color: UI.color.muted,
            fontFamily: "IBMPlexSans_500Medium",
            marginBottom: 24,
          }}
        >
          {error.message || "An unexpected error occurred."}
        </Text>
        <View style={{ alignItems: "flex-end" }}>
          <Pressable
            onPress={retry}
            style={{
              paddingHorizontal: 24,
              paddingVertical: 14,
              borderRadius: UI.radius.pill,
              backgroundColor: UI.color.text,
            }}
          >
            <Text
              style={{
                color: UI.color.textInverse,
                fontSize: 16,
                fontFamily: "IBMPlexSans_600SemiBold",
              }}
            >
              Try Again
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
