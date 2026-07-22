import { useCoralColors } from "@/components/coral";
import React, { useRef, useCallback } from "react";
import {  View, StyleSheet, Animated, Pressable , Text } from "react-native";
import Swipeable from "react-native-gesture-handler/Swipeable";
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView } from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as icons from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useUI } from "@/components/ui";

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
  const { color } = useUI();

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
              { backgroundColor: color.text, transform: [{ scale }], opacity },
            ]}
          >
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                swipeableRef.current?.close();
                onRemind();
              }}
              style={styles.actionInner}
            >
              <icons.Bell size={24} color={color.textInverse} />
              <Text className="text-white font-bold mt-1" style={{ fontSize: 12 }}>
                Remind
              </Text>
            </Pressable>
          </Animated.View>
        )}

        {onSettle && (
          <Animated.View
            style={[
              styles.actionButton,
              { backgroundColor: color.success, transform: [{ scale }], opacity },
            ]}
          >
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                swipeableRef.current?.close();
                onSettle();
              }}
              style={styles.actionInner}
            >
              <icons.CheckCircle size={24} color={color.textInverse} />
              <Text className="text-white font-bold mt-1" style={{ fontSize: 12 }}>
                Settle
              </Text>
            </Pressable>
          </Animated.View>
        )}

        {onDelete && (
          <Animated.View
            style={[
              styles.actionButton,
              { backgroundColor: color.danger, transform: [{ scale }], opacity },
            ]}
          >
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                swipeableRef.current?.close();
                deleteSheetRef.current?.present();
              }}
              style={styles.actionInner}
            >
              <icons.Trash2 size={24} color={color.textInverse} />
              <Text className="text-white font-bold mt-1" style={{ fontSize: 12 }}>
                Delete
              </Text>
            </Pressable>
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
        backgroundStyle={{ backgroundColor: color.bg, borderRadius: 0 }}
        handleIndicatorStyle={{ backgroundColor: color.muted, width: 40 }}
      >
        <BottomSheetView
          style={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: insets.bottom + 24 }}
        >
          <Text
            style={{
              fontSize: 22,
              fontFamily: "InstrumentSans_600SemiBold",
              color: color.textStrong,
              marginBottom: 8,
            }}
          >
            Delete Item?
          </Text>
          <Text
            style={{
              fontSize: 16,
              fontFamily: "InstrumentSans_500Medium",
              color: color.muted,
              marginBottom: 24,
            }}
          >
            Are you sure you want to delete this? This cannot be undone.
          </Text>

          <View style={{ flexDirection: "row", gap: 12 }}>
            <Pressable
              onPress={() => deleteSheetRef.current?.dismiss()}
              style={({ pressed }) => ({
                flex: 1,
                height: 48,
                borderWidth: 1,
                borderColor: color.border,
                backgroundColor: color.control,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.5 : 1,
              })}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: "InstrumentSans_600SemiBold",
                  color: color.textStrong,
                }}
              >
                Cancel
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                deleteSheetRef.current?.dismiss();
                if (onDelete) onDelete();
              }}
              style={({ pressed }) => ({
                flex: 1,
                height: 48,
                backgroundColor: color.danger,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: "InstrumentSans_600SemiBold",
                  color: color.textInverse,
                }}
              >
                Delete
              </Text>
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
