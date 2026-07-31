import { ActivityIndicator, Pressable, Text, View } from "react-native";
import * as icons from "lucide-react-native";

import { useCoralColors } from "@/components/coral/useCoral";
import type { ReceiptDraft } from "@/features/expenses/hooks/useExpenseComposer";

type Props = {
  receipt?: ReceiptDraft;
  receiptLabel: string;
  isUploading: boolean;
  onAdd: () => void;
  onRemove: () => void;
};

export function ExpenseReceiptControl({
  receipt,
  receiptLabel,
  isUploading,
  onAdd,
  onRemove,
}: Props) {
  const coral = useCoralColors();

  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontFamily: "InstrumentSans_500Medium", fontSize: 13, color: coral.muted }}>
        Receipt
      </Text>
      {receipt ? (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 15,
            minHeight: 54,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: coral.accent,
            backgroundColor: coral.accentSoft,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <icons.Receipt size={18} color={coral.accent} />
            <Text
              style={{
                fontFamily: "InstrumentSans_500Medium",
                fontSize: 14,
                color: coral.accentInk,
              }}
            >
              {receiptLabel}
            </Text>
          </View>
          <Pressable accessibilityRole="button" onPress={onRemove} hitSlop={8}>
            <icons.X size={18} color={coral.accentInk} />
          </Pressable>
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          onPress={onAdd}
          disabled={isUploading}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            paddingHorizontal: 15,
            minHeight: 54,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: coral.border,
            backgroundColor: coral.surface,
            borderStyle: "dashed",
            opacity: isUploading ? 0.45 : pressed ? 0.7 : 1,
          })}
        >
          {isUploading ? (
            <ActivityIndicator size="small" color={coral.muted} />
          ) : (
            <icons.Paperclip size={18} color={coral.muted} />
          )}
          <Text
            style={{ fontFamily: "InstrumentSans_500Medium", fontSize: 14, color: coral.muted }}
          >
            {receiptLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
