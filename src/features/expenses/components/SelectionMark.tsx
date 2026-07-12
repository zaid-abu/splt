import type { JSX } from "react";
import { View } from "react-native";
import * as icons from "lucide-react-native";
import { UI } from "@/components/ui/native-ui";
import { styles } from "@/features/expenses/utils/styles";

export function SelectionMark({ selected }: { selected: boolean }): JSX.Element {
  return (
    <View style={[styles.selectionMark, selected && styles.selectionMarkActive]}>
      {selected ? <icons.Check size={14} color={UI.color.textInverse} strokeWidth={2.6} /> : null}
    </View>
  );
}
