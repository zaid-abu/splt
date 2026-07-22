import type { JSX } from "react";
import {  TextInput, View , Text } from "react-native";
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
          <Text style={styles.amountKicker}>Amount</Text>
          <Text style={styles.amountHint}>Enter the total paid before splitting.</Text>
        </View>
      </View>

      <View style={styles.amountInputRow}>
        <Text style={styles.currencyCode}>{currency}</Text>
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
        <Text
          style={{
            marginTop: 4,
            color: color.danger,
            fontSize: 13,
            fontFamily: "InstrumentSans_500Medium",
          }}
        >
          {amountError}
        </Text>
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
        <Text
          style={{
            marginTop: 4,
            color: color.danger,
            fontSize: 13,
            fontFamily: "InstrumentSans_500Medium",
          }}
        >
          {titleError}
        </Text>
      )}
    </Card>
  );
}
