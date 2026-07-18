import type { JSX } from "react";
import { View } from "react-native";
import { Typography } from "heroui-native";
import { Card } from "@/components/ui/Card";
import { formatAmount } from "@/components/ui/AmountDisplay";
import { useUI } from "@/components/ui";
import { styles } from "@/features/expenses/utils/styles";
import type { SplitMethod } from "@/types";
import { PreviewCell } from "@/features/expenses/components/PreviewCell";

export function PreviewCard({
  amount,
  currency,
  participantsCount,
  includedCount,
  equalShare,
  splitMethod,
  remainingCustom,
  remainingPercent,
}: {
  amount: number;
  currency: string;
  participantsCount: number;
  includedCount: number;
  equalShare: number;
  splitMethod: SplitMethod;
  remainingCustom: number;
  remainingPercent: number;
}): JSX.Element {
  const { color, radius, space, shadow } = useUI();
  const balanced =
    splitMethod === "equal" ||
    (splitMethod === "custom" && remainingCustom === 0) ||
    (splitMethod === "percentage" && remainingPercent === 0);
  const status = balanced ? "Balanced" : "Needs split";

  return (
    <Card>
      <View style={styles.previewHeader}>
        <View>
          <Typography style={styles.previewLabel}>Split preview</Typography>
          <Typography style={styles.previewAmount}>
            {amount > 0 ? formatAmount(amount, currency) : "No amount yet"}
          </Typography>
        </View>
        <View
          style={[styles.statusPill, balanced ? styles.statusPillSuccess : styles.statusPillDanger]}
        >
          <Typography
            style={[styles.statusPillText, { color: balanced ? color.success : color.danger }]}
          >
            {status}
          </Typography>
        </View>
      </View>
      <View style={styles.previewGrid}>
        <PreviewCell label="People" value={`${includedCount}/${participantsCount}`} />
        <PreviewCell
          label="Each"
          value={amount > 0 && splitMethod === "equal" ? formatAmount(equalShare, currency) : "-"}
        />
        <PreviewCell
          label="Method"
          value={splitMethod === "percentage" ? "Percent" : splitMethod}
        />
      </View>
    </Card>
  );
}
