import type { ReactNode } from "react";
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView } from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRef, forwardRef, useImperativeHandle } from "react";
import { useUI } from "@/components/ui/native-ui";

interface SheetContainerProps {
  children: ReactNode;
  snapPoints?: (string | number)[];
  enableDynamicSizing?: boolean;
}

export interface SheetContainerHandle {
  present: () => void;
  dismiss: () => void;
}

const SHEET_BACKDROP = (props: Parameters<typeof BottomSheetBackdrop>[0]) => (
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
    const { color, radius, space, shadow } = useUI();

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
        backgroundStyle={{ backgroundColor: color.bg, borderRadius: 0 }}
        handleIndicatorStyle={{ backgroundColor: color.muted, width: 40 }}
      >
        <BottomSheetView
          style={{
            paddingHorizontal: space.page,
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
