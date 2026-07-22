import React from "react";
import type { JSX } from "react";
import { View, Text, Pressable } from "react-native";
import type { ErrorBoundaryProps } from "expo-router";
import { useUI } from "@/components/ui";

export function ErrorFallback({ error, retry }: ErrorBoundaryProps): JSX.Element {
  const { color, radius, space, shadow } = useUI();
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: color.bg,
        padding: 24,
      }}
    >
      <View
        style={{
          width: "100%",
          maxWidth: 400,
          borderRadius: radius.lg,
          padding: 24,
          backgroundColor: color.surface,
          borderWidth: 1,
          borderColor: color.border,
        }}
      >
        <Text
          style={{
            fontSize: 24,
            color: color.text,
            fontFamily: "InstrumentSans_600SemiBold",
            marginBottom: 12,
          }}
        >
          Something went wrong!
        </Text>
        <Text
          style={{
            fontSize: 16,
            color: color.muted,
            fontFamily: "InstrumentSans_500Medium",
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
              borderRadius: radius.pill,
              backgroundColor: color.text,
            }}
          >
            <Text
              style={{
                color: color.textInverse,
                fontSize: 16,
                fontFamily: "InstrumentSans_600SemiBold",
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
