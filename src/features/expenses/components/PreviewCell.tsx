import type { JSX } from "react";
import {  View , Text } from "react-native";
import { styles } from "@/features/expenses/utils/styles";

export function PreviewCell({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <View style={styles.previewCell}>
      <Text style={styles.previewCellLabel}>{label}</Text>
      <Text numberOfLines={1} style={styles.previewCellValue}>
        {value}
      </Text>
    </View>
  );
}
