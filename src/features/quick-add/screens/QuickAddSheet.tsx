import { useState, useCallback } from "react"
import { View, Pressable, Text } from "react-native"
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import { HapticButton } from "@/components/ui/HapticButton"
import { UI } from "@/components/ui/native-ui"
import * as Haptics from "expo-haptics"

interface QuickAddSheetProps {
  sheetRef: React.RefObject<BottomSheetModal | null>
}

const KEY_ROWS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  [".", "0", "⌫"],
]

export function QuickAddSheet({ sheetRef }: QuickAddSheetProps) {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [amount, setAmount] = useState("")

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
    [],
  )

  const handleAddExpense = useCallback(() => {
    sheetRef.current?.dismiss()
    router.push(`/expense/new?amount=${amount}`)
  }, [amount, router, sheetRef])

  return (
    <BottomSheetModal
      ref={sheetRef}
      index={0}
      enableDynamicSizing
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: UI.color.bg, borderRadius: 0 }}
      handleIndicatorStyle={{ backgroundColor: UI.color.muted, width: 40 }}
    >
      <BottomSheetView
        style={{
          paddingHorizontal: UI.space.page,
          paddingTop: 16,
          paddingBottom: Math.max(insets.bottom, 24),
        }}
      >
        <Text
          style={{
            fontFamily: "Sora_600SemiBold",
            fontSize: 32,
            color: UI.color.textStrong,
            textAlign: "center",
            marginBottom: 24,
          }}
        >
          {amount ? `$${amount}` : "$0"}
        </Text>

        <View style={{ gap: 8 }}>
          {KEY_ROWS.map((row, i) => (
            <View key={i} style={{ flexDirection: "row", justifyContent: "space-around" }}>
              {row.map((key) => (
                <Pressable
                  key={key}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                    if (key === "⌫") {
                      setAmount((a) => a.slice(0, -1))
                    } else if (key === "." && amount.includes(".")) {
                      return
                    } else {
                      setAmount((a) => a + key)
                    }
                  }}
                  style={({ pressed }) => ({
                    width: 80,
                    height: 64,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: UI.radius.md,
                    backgroundColor: UI.color.control,
                    opacity: pressed ? 0.7 : 1,
                  })}
                  accessibilityLabel={key === "⌫" ? "Delete" : `Number ${key}`}
                  accessibilityRole="button"
                >
                  <Text
                    style={{
                      fontFamily: "Sora_600SemiBold",
                      fontSize: 24,
                      color: UI.color.textStrong,
                    }}
                  >
                    {key}
                  </Text>
                </Pressable>
              ))}
            </View>
          ))}
        </View>

        <View style={{ marginTop: 24 }}>
          <HapticButton tone="ink" onPress={handleAddExpense} disabled={!amount}>
            Add Expense
          </HapticButton>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  )
}
