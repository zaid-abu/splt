import { useCallback, forwardRef, type JSX } from "react";
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { twMerge } from "tailwind-merge";

export { BottomSheetFlatList } from "@gorhom/bottom-sheet";

type BottomSheetHandle = BottomSheetModal;

interface BottomSheetProps {
  children: React.ReactNode;
  snapPoints?: (string | number)[];
  enableDynamicSizing?: boolean;
  onDismiss?: () => void;
  onChange?: (index: number) => void;
  className?: string;
}

export const BottomSheet = forwardRef<BottomSheetHandle, BottomSheetProps>(
  function BottomSheet(
    {
      children,
      snapPoints,
      enableDynamicSizing = true,
      onDismiss,
      onChange,
      className,
    },
    ref,
  ): JSX.Element {
    const insets = useSafeAreaInsets();

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          pressBehavior="close"
          opacity={0.5}
        />
      ),
      [],
    );

    return (
      <BottomSheetModal
        ref={ref}
        index={0}
        enableDynamicSizing={enableDynamicSizing}
        snapPoints={!enableDynamicSizing ? snapPoints : undefined}
        onChange={onChange}
        onDismiss={onDismiss}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: "#131316", borderRadius: 24 }}
        handleIndicatorStyle={{ backgroundColor: "#3F3F46", width: 40 }}
      >
        <BottomSheetView
          className={twMerge("px-6 pt-6", className)}
          style={{ paddingBottom: insets.bottom + 24 }}
        >
          {children}
        </BottomSheetView>
      </BottomSheetModal>
    );
  },
);
