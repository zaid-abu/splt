import type { JSX } from "react";
import { TextInput, View } from "react-native";
import { Typography } from "heroui-native";
import { CategoryIconBadge } from "@/components/ui/CategoryIconBadge";
import { Card } from "@/components/ui/Card";
import { useUI } from "@/components/ui";
import { styles } from "@/features/expenses/utils/styles";
import type { ExpenseCategory } from "@/types";

export function AmountCard({
  amount,
  onAmountChange,
  currency,
  title,
  onTitleChange,
  category,
  amountError,
  titleError,
}: {
  amount: string;
  onAmountChange: (value: string) => void;
  currency: string;
  title: string;
  onTitleChange: (value: string) => void;
  category: ExpenseCategory;
  amountError?: string;
  titleError?: string;
}): JSX.Element {
  const { color, radius, space, shadow } = useUI();
  return (
    <Card style={styles.amountCard}>
      <View style={styles.amountHeader}>
        <CategoryIconBadge category={category} size="md" />
        <View style={{ flex: 1 }}>
          <Typography style={styles.amountKicker}>Amount</Typography>
          <Typography style={styles.amountHint}>Enter the total paid before splitting.</Typography>
        </View>
      </View>

      <View style={styles.amountInputRow}>
        <Typography style={styles.currencyCode}>{currency}</Typography>
        <TextInput
          value={amount}
          onChangeText={onAmountChange}
          placeholder="0.00"
          placeholderTextColor={color.muted}
          keyboardType="decimal-pad"
          returnKeyType="done"
          style={[styles.amountInput, amountError ? { borderColor: color.danger } : undefined]}
        />
      </View>
      {amountError && (
        <Typography
          style={{
            marginTop: 4,
            color: color.danger,
            fontSize: 13,
            fontFamily: "IBMPlexSans_500Medium",
          }}
        >
          {amountError}
        </Typography>
      )}

      <TextInput
        value={title}
        onChangeText={onTitleChange}
        placeholder="What was it for?"
        placeholderTextColor={color.muted}
        autoCapitalize="sentences"
        returnKeyType="done"
        style={[styles.titleInput, titleError ? { borderColor: color.danger } : undefined]}
      />
      {titleError && (
        <Typography
          style={{
            marginTop: 4,
            color: color.danger,
            fontSize: 13,
            fontFamily: "IBMPlexSans_500Medium",
          }}
        >
          {titleError}
        </Typography>
      )}
    </Card>
  );
}
