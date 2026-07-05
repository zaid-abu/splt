import React, { useRef, useCallback } from "react";
import { View, StyleSheet, Animated, Pressable } from "react-native";
import Swipeable from "react-native-gesture-handler/Swipeable";
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView } from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PressableFeedback, Typography, useThemeColor } from "heroui-native";
import * as icons from "lucide-react-native";
import * as Haptics from "expo-haptics";

interface SwipeableRowProps {
  children: React.ReactNode;
  onDelete?: () => void;
  onSettle?: () => void;
  onRemind?: () => void;
}

export function SwipeableRow({ children, onDelete, onSettle, onRemind }: SwipeableRowProps) {
  const swipeableRef = useRef<Swipeable>(null);
  const deleteSheetRef = useRef<BottomSheetModal>(null);
  const insets = useSafeAreaInsets();
  const successColor = useThemeColor("success" as any) as unknown as string;
  const dangerColor = useThemeColor("danger" as any) as unknown as string;
  const primaryColor = useThemeColor("primary" as any) as unknown as string;

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        pressBehavior="close"
        opacity={0.4}
      />
    ),
    []
  );

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-150, -50, 0],
      outputRange: [1, 0.9, 0],
      extrapolate: "clamp",
    });

    const opacity = dragX.interpolate({
      inputRange: [-150, -50, 0],
      outputRange: [1, 0.5, 0],
      extrapolate: "clamp",
    });

    return (
      <View style={styles.rightActionContainer}>
        {onRemind && (
          <Animated.View
            style={[
              styles.actionButton,
              { backgroundColor: primaryColor || "#000", transform: [{ scale }], opacity },
            ]}
          >
            <PressableFeedback
              accessibilityRole="button"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                swipeableRef.current?.close();
                onRemind();
              }}
              style={styles.actionInner}
            >
              <icons.Bell size={24} color="white" />
              <Typography type="body-xs" className="text-white font-bold mt-1">
                Remind
              </Typography>
            </PressableFeedback>
          </Animated.View>
        )}

        {onSettle && (
          <Animated.View
            style={[
              styles.actionButton,
              { backgroundColor: successColor, transform: [{ scale }], opacity },
            ]}
          >
            <PressableFeedback
              accessibilityRole="button"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                swipeableRef.current?.close();
                onSettle();
              }}
              style={styles.actionInner}
            >
              <icons.CheckCircle size={24} color="white" />
              <Typography type="body-xs" className="text-white font-bold mt-1">
                Settle
              </Typography>
            </PressableFeedback>
          </Animated.View>
        )}

        {onDelete && (
          <Animated.View
            style={[
              styles.actionButton,
              { backgroundColor: dangerColor, transform: [{ scale }], opacity },
            ]}
          >
            <PressableFeedback
              accessibilityRole="button"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                swipeableRef.current?.close();
                deleteSheetRef.current?.present();
              }}
              style={styles.actionInner}
            >
              <icons.Trash2 size={24} color="white" />
              <Typography type="body-xs" className="text-white font-bold mt-1">
                Delete
              </Typography>
            </PressableFeedback>
          </Animated.View>
        )}
      </View>
    );
  };

  return (
    <>
      <Swipeable
        ref={swipeableRef}
        renderRightActions={renderRightActions}
        friction={2}
        rightThreshold={40}
      >
        {children}
      </Swipeable>

      <BottomSheetModal
        ref={deleteSheetRef}
        index={0}
        enableDynamicSizing={true}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: "#F5F0EB", borderRadius: 0 }}
        handleIndicatorStyle={{ backgroundColor: "#8A8782", width: 40 }}
      >
        <BottomSheetView
          style={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: insets.bottom + 24 }}
        >
          <Typography
            style={{
              fontSize: 22,
              fontFamily: "CrimsonText_700Bold",
              color: "#000000",
              marginBottom: 8,
            }}
          >
            Delete Item?
          </Typography>
          <Typography
            style={{
              fontSize: 16,
              fontFamily: "CrimsonText_600SemiBold",
              color: "#8A8782",
              marginBottom: 24,
            }}
          >
            Are you sure you want to delete this? This cannot be undone.
          </Typography>

          <View style={{ flexDirection: "row", gap: 12 }}>
            <Pressable
              onPress={() => deleteSheetRef.current?.dismiss()}
              style={({ pressed }) => ({
                flex: 1,
                height: 48,
                borderWidth: 1,
                borderColor: "#E8E4DF",
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.5 : 1,
              })}
            >
              <Typography
                style={{ fontSize: 16, fontFamily: "CrimsonText_700Bold", color: "#000000" }}
              >
                Cancel
              </Typography>
            </Pressable>
            <Pressable
              onPress={() => {
                deleteSheetRef.current?.dismiss();
                if (onDelete) onDelete();
              }}
              style={({ pressed }) => ({
                flex: 1,
                height: 48,
                backgroundColor: "#E02424",
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Typography
                style={{ fontSize: 16, fontFamily: "CrimsonText_700Bold", color: "#FFFFFF" }}
              >
                Delete
              </Typography>
            </Pressable>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    </>
  );
}

const styles = StyleSheet.create({
  rightActionContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 8,
  },
  actionButton: {
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 0,
    marginLeft: 8,
    overflow: "hidden",
  },
  actionInner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    width: 72,
    paddingVertical: 12,
  },
});
