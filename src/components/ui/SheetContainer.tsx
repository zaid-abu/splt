import type { JSX, ReactNode } from "react";
import { Platform, View } from "react-native";
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView } from "@gorhom/bottom-sheet";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCallback, useRef, forwardRef, useImperativeHandle } from "react";
import { UI } from "@/components/ui/native-ui";

interface SheetContainerProps {
  children: ReactNode;
  snapPoints?: (string | number)[];
  enableDynamicSizing?: boolean;
}

export interface SheetContainerHandle {
  present: () => void;
  dismiss: () => void;
}

const SHEET_BACKDROP = (props: any) => (
  <BottomSheetBackdrop
    {...props}
    disappearsOnIndex={-1}
    appearsOnIndex={0}
    pressBehavior="close"
    opacity={0.4}
  />
);

export const SheetContainer = forwardRef<SheetContainerHandle, SheetContainerProps>(
  ({ children, snapPoints, enableDynamicSizing = true }, ref) => {
    const insets = useSafeAreaInsets();
    const sheetRef = useRef<BottomSheetModal>(null);

    useImperativeHandle(ref, () => ({
      present: () => sheetRef.current?.present(),
      dismiss: () => sheetRef.current?.dismiss(),
    }));

    const backgroundComponent = useCallback(
      () => (
        <BlurView
          intensity={Platform.OS === "ios" ? 90 : 80}
          tint="light"
          style={{
            flex: 1,
            backgroundColor: Platform.OS === "android" ? UI.color.bg : "transparent",
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
          }}
        />
      ),
      []
    );

    return (
      <BottomSheetModal
        ref={sheetRef}
        index={0}
        snapPoints={snapPoints}
        enableDynamicSizing={enableDynamicSizing}
        backdropComponent={SHEET_BACKDROP}
        backgroundComponent={backgroundComponent}
        handleIndicatorStyle={{ backgroundColor: UI.color.muted, width: 40 }}
      >
        <BottomSheetView
          style={{
            paddingHorizontal: UI.space.page,
            paddingTop: 24,
            paddingBottom: Math.max(insets.bottom, 24),
            gap: 20,
          }}
        >
          {children}
        </BottomSheetView>
      </BottomSheetModal>
    );
  }
);

SheetContainer.displayName = "SheetContainer";
