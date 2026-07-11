import type { JSX, ReactNode } from "react";
import { View } from "react-native";
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView } from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRef, forwardRef, useImperativeHandle } from "react";
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

    return (
      <BottomSheetModal
        ref={sheetRef}
        index={0}
        snapPoints={snapPoints}
        enableDynamicSizing={enableDynamicSizing}
        backdropComponent={SHEET_BACKDROP}
        backgroundStyle={{ backgroundColor: UI.color.bg, borderRadius: 0 }}
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
