import { useEffect, useMemo } from "react";
import { Text, Pressable, Animated } from "react-native";
import { useCoralColors } from "./useCoral";

type CoralSnackbarProps = {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  visible: boolean;
};

export function CoralSnackbar({ message, actionLabel, onAction, visible }: CoralSnackbarProps) {
  const coral = useCoralColors();
  const translateY = useMemo(() => new Animated.Value(110), []);

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: visible ? 0 : 110,
      useNativeDriver: true,
      tension: 120,
      friction: 14,
    }).start();
  }, [visible, translateY]);

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: 18,
        right: 18,
        bottom: 18,
        zIndex: 30,
        minHeight: 52,
        borderRadius: 14,
        paddingHorizontal: 16,
        backgroundColor: coral.balanceSurface,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        transform: [{ translateY }],
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 10,
      }}
      pointerEvents={visible ? "auto" : "none"}
    >
      <Text
        style={{
          fontFamily: "InstrumentSans_400Regular",
          fontSize: 14,
          color: coral.balanceForeground,
          flex: 1,
        }}
      >
        {message}
      </Text>
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          onPress={onAction}
          style={{ minHeight: 44, justifyContent: "center" }}
        >
          <Text
            style={{
              fontFamily: "InstrumentSans_600SemiBold",
              fontSize: 14,
              fontWeight: "600",
              color: coral.accent,
            }}
          >
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </Animated.View>
  );
}
