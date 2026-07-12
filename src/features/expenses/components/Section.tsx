import type { JSX, ReactNode } from "react";
import { View } from "react-native";
import { SectionLabel } from "@/components/ui/native-ui";
import { styles } from "@/features/expenses/utils/styles";

export function Section({
  label,
  action,
  children,
}: {
  label: string;
  action?: ReactNode;
  children: ReactNode;
}): JSX.Element {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <SectionLabel>{label}</SectionLabel>
        {action}
      </View>
      {children}
    </View>
  );
}
