import type { JSX } from "react";
import { View } from "react-native";
import { Text } from "../ui/Text";
import { Button } from "../ui/Button";

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

export function ErrorFallback({ error, resetError }: ErrorFallbackProps): JSX.Element {
  return (
    <View className="flex-1 items-center justify-center bg-background px-6 gap-4">
      <Text variant="h2" color="foreground">
        Something went wrong
      </Text>
      <Text variant="body" color="muted" className="text-center">
        {error.message}
      </Text>
      <Button variant="primary" onPress={resetError}>
        Try Again
      </Button>
    </View>
  );
}
