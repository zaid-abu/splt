import { useEffect, useRef, useCallback, useState } from "react";
import type { ReactNode } from "react";
import { Modal, Pressable, View, ScrollView, Animated, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCoralColors } from "./useCoral";

type CoralSheetProps = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
};

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export function CoralSheet({ visible, onClose, children }: CoralSheetProps) {
  const insets = useSafeAreaInsets();
  const coral = useCoralColors();
  const [modalVisible, setModalVisible] = useState(false);
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const prevVisible = useRef(false);

  const animateOut = useCallback(
    (callback?: () => void) => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SCREEN_HEIGHT,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setModalVisible(false);
        callback?.();
      });
    },
    [translateY, backdropOpacity]
  );

  const handleClose = useCallback(() => {
    animateOut(() => onClose());
  }, [animateOut, onClose]);

  useEffect(() => {
    if (visible && !prevVisible.current) {
      setModalVisible(true);
      translateY.setValue(SCREEN_HEIGHT * 0.1);
      backdropOpacity.setValue(0);
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          damping: 28,
          stiffness: 360,
          mass: 0.85,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (!visible && prevVisible.current) {
      animateOut();
    }
    prevVisible.current = visible;
  }, [visible, animateOut, translateY, backdropOpacity]);

  if (!modalVisible) return null;

  return (
    <Modal
      visible
      transparent
      statusBarTranslucent
      onRequestClose={handleClose}
      animationType="none"
    >
      <View style={{ flex: 1 }}>
        <Animated.View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 25, 40, 0.34)",
            opacity: backdropOpacity,
          }}
        >
          <Pressable style={{ flex: 1 }} onPress={handleClose} />
        </Animated.View>

        <Animated.View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            transform: [{ translateY }],
          }}
        >
          <View
            style={{
              backgroundColor: coral.surface,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingTop: 10,
              paddingBottom: insets.bottom + 16,
              maxHeight: SCREEN_HEIGHT * 0.8,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.12,
              shadowRadius: 16,
              elevation: 12,
            }}
          >
            <View
              style={{
                width: 38,
                height: 5,
                borderRadius: 4,
                backgroundColor: coral.border,
                alignSelf: "center",
                marginBottom: 14,
              }}
            />
            <ScrollView
              showsVerticalScrollIndicator={false}
              bounces={false}
              keyboardShouldPersistTaps="handled"
            >
              {children}
            </ScrollView>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
