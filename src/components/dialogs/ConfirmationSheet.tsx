import type { JSX, ReactNode, RefObject } from "react";
import { useCallback, useRef } from "react";
import {  View, Pressable , Text } from "react-native";
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView } from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUI } from "@/components/ui";

export function useConfirmationSheet() {
  const sheetRef = useRef<BottomSheetModal>(null);

  const present = useCallback(() => {
    sheetRef.current?.present();
  }, []);

  return { sheetRef, present };
}

interface ConfirmationSheetProps {
  sheetRef: RefObject<BottomSheetModal | null>;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmTone?: "danger" | "brand";
  onConfirm: () => void;
  onCancel?: () => void;
  children?: ReactNode;
}

export function ConfirmationSheet({
  sheetRef,
  title,
  description,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  confirmTone = "danger",
  onConfirm,
  onCancel,
  children,
}: ConfirmationSheetProps): JSX.Element {
  const insets = useSafeAreaInsets();
  const { color, radius, space, shadow } = useUI();

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

  const confirmColor = confirmTone === "danger" ? color.danger : color.brand;

  return (
    <BottomSheetModal
      ref={sheetRef}
      index={0}
      enableDynamicSizing
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: color.bg, borderRadius: 0 }}
      handleIndicatorStyle={{ backgroundColor: color.muted, width: 40 }}
    >
      <BottomSheetView
        style={{
          paddingHorizontal: space.page,
          paddingTop: 24,
          paddingBottom: insets.bottom + 24,
          gap: 20,
        }}
      >
        {children || (
          <>
            <View>
              <Text
                style={{
                  fontSize: 22,
                  fontFamily: "InstrumentSans_600SemiBold",
                  color: color.text,
                  marginBottom: 8,
                }}
              >
                {title}
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: "InstrumentSans_500Medium",
                  color: color.muted,
                }}
              >
                {description}
              </Text>
            </View>

            <View style={{ flexDirection: "row", gap: 12 }}>
              <Pressable
                onPress={() => {
                  sheetRef.current?.dismiss();
                  onCancel?.();
                }}
                style={({ pressed }) => ({
                  flex: 1,
                  height: 48,
                  borderWidth: 1,
                  borderColor: color.border,
                  borderRadius: radius.pill,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: pressed ? 0.5 : 1,
                })}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: "InstrumentSans_600SemiBold",
                    color: color.text,
                  }}
                >
                  {cancelLabel}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  sheetRef.current?.dismiss();
                  setTimeout(onConfirm, 300);
                }}
                style={({ pressed }) => ({
                  flex: 1,
                  height: 48,
                  backgroundColor: confirmColor,
                  borderRadius: radius.pill,
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
                  {confirmLabel}
                </Text>
              </Pressable>
            </View>
          </>
        )}
      </BottomSheetView>
    </BottomSheetModal>
  );
}
