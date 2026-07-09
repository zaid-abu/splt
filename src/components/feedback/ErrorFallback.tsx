import React from "react";
import type { JSX } from "react";
import { View, Text, Pressable } from "react-native";
import type { ErrorBoundaryProps } from "expo-router";

export function ErrorFallback({ error, retry }: ErrorBoundaryProps): JSX.Element {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#F5F0EB",
        padding: 24,
      }}
    >
      <View
        style={{
          width: "100%",
          maxWidth: 400,
          backgroundColor: "#FFFFFF",
          padding: 24,
          borderWidth: 1,
          borderColor: "#E8E4DF",
        }}
      >
        <Text
          style={{
            fontSize: 24,
            color: "#000000",
            fontFamily: "Sora_600SemiBold",
            marginBottom: 12,
          }}
        >
          Something went wrong!
        </Text>
        <Text
          style={{
            fontSize: 16,
            color: "#8A8782",
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
              paddingVertical: 12,
              backgroundColor: "#8C7A6B",
            }}
          >
            <Text style={{ color: "#FFFFFF", fontSize: 16, fontFamily: "IBMPlexSans_600SemiBold" }}>
              Try Again
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
