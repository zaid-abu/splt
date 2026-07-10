import type { JSX, ReactNode, RefObject } from "react";
import { useCallback, useRef } from "react";
import { View, Pressable } from "react-native";
import { Typography } from "heroui-native";
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView } from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { UI } from "@/components/ui/native-ui";
import { BlurredSheetBackground } from "@/components/ui/SheetBackground";

export function useConfirmationSheet() {
  const sheetRef = useRef<BottomSheetModal>(null);

  const present = useCallback(() => {
    sheetRef.current?.present();
  }, []);

  return { sheetRef, present };
}

interface ConfirmationSheetProps {
  sheetRef: RefObject<BottomSheetModal>;
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

  const confirmColor = confirmTone === "danger" ? UI.color.danger : UI.color.brand;

  return (
    <BottomSheetModal
      ref={sheetRef}
      index={0}
      enableDynamicSizing
      backdropComponent={renderBackdrop}
      backgroundComponent={BlurredSheetBackground}
      handleIndicatorStyle={{ backgroundColor: UI.color.muted, width: 40 }}
    >
      <BottomSheetView
        style={{
          paddingHorizontal: UI.space.page,
          paddingTop: 24,
          paddingBottom: insets.bottom + 24,
          gap: 20,
        }}
      >
        {children || (
          <>
            <View>
              <Typography
                style={{
                  fontSize: 22,
                  fontFamily: "IBMPlexSans_600SemiBold",
                  color: UI.color.text,
                  marginBottom: 8,
                }}
              >
                {title}
              </Typography>
              <Typography
                style={{
                  fontSize: 16,
                  fontFamily: "IBMPlexSans_500Medium",
                  color: UI.color.muted,
                }}
              >
                {description}
              </Typography>
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
                  borderColor: UI.color.border,
                  borderRadius: UI.radius.pill,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: pressed ? 0.5 : 1,
                })}
              >
                <Typography
                  style={{
                    fontSize: 16,
                    fontFamily: "IBMPlexSans_600SemiBold",
                    color: UI.color.text,
                  }}
                >
                  {cancelLabel}
                </Typography>
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
                  borderRadius: UI.radius.pill,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <Typography
                  style={{
                    fontSize: 16,
                    fontFamily: "IBMPlexSans_600SemiBold",
                    color: "#FFFFFF",
                  }}
                >
                  {confirmLabel}
                </Typography>
              </Pressable>
            </View>
          </>
        )}
      </BottomSheetView>
    </BottomSheetModal>
  );
}
