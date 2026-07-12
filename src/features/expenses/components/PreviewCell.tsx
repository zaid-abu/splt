import type { JSX } from "react";
import { View } from "react-native";
import { Typography } from "heroui-native";
import { styles } from "@/features/expenses/utils/styles";

export function PreviewCell({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <View style={styles.previewCell}>
      <Typography style={styles.previewCellLabel}>{label}</Typography>
      <Typography numberOfLines={1} style={styles.previewCellValue}>
        {value}
      </Typography>
    </View>
  );
}
