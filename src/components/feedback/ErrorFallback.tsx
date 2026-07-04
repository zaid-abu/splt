import React from "react";
import type { JSX } from "react";
import { View } from "react-native";
import { Card, Button, Text } from "heroui-native";
import type { ErrorBoundaryProps } from "expo-router";

export function ErrorFallback({ error, retry }: ErrorBoundaryProps): JSX.Element {
  return (
    <View className="flex-1 items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <Card.Body>
          <Card.Title className="text-danger">Something went wrong!</Card.Title>
          <Card.Description className="mt-2 text-foreground/80">
            {error.message || "An unexpected error occurred."}
          </Card.Description>
          <View className="mt-6 flex-row justify-end space-x-2">
            <Button variant="primary" onPress={retry}>
              Try Again
            </Button>
          </View>
        </Card.Body>
      </Card>
    </View>
  );
}
