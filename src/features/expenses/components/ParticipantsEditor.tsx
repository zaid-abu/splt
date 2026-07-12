import type { JSX } from "react";
import { Pressable, TextInput, View } from "react-native";
import { Typography } from "heroui-native";
import * as Haptics from "expo-haptics";
import * as icons from "lucide-react-native";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { Section } from "@/features/expenses/components/Section";
import { UI } from "@/components/ui/native-ui";
import { formatAmount } from "@/components/ui/AmountDisplay";
import { styles } from "@/features/expenses/utils/styles";
import type { User, SplitMethod } from "@/types";

export function ParticipantsEditor({
  participants,
  included,
  setIncluded,
  splitMethod,
  parsedAmount,
  remainingCustom,
  remainingPercent,
  expenseCurrency,
  equalShare,
  customAmounts,
  setCustomAmounts,
  customPercentages,
  setCustomPercentages,
  currentUserId,
}: {
  participants: User[];
  included: Record<string, boolean>;
  setIncluded: (
    value: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)
  ) => void;
  splitMethod: SplitMethod;
  parsedAmount: number;
  remainingCustom: number;
  remainingPercent: number;
  expenseCurrency: string;
  equalShare: number;
  customAmounts: Record<string, string>;
  setCustomAmounts: (
    value: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)
  ) => void;
  customPercentages: Record<string, string>;
  setCustomPercentages: (
    value: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)
  ) => void;
  currentUserId: string;
}): JSX.Element {
  const showRemaining = parsedAmount > 0 && splitMethod !== "equal";
  const remainingText =
    splitMethod === "custom"
      ? `Remaining ${formatAmount(remainingCustom, expenseCurrency)}`
      : `Remaining ${remainingPercent.toFixed(1)}%`;
  const remainingBalanced =
    splitMethod === "custom" ? remainingCustom === 0 : remainingPercent === 0;

  return (
    <Section
      label="Participants"
      action={
        showRemaining ? (
          <View
            style={[
              styles.remainingPill,
              remainingBalanced ? styles.statusPillSuccess : styles.statusPillDanger,
            ]}
          >
            <Typography
              style={[
                styles.remainingText,
                { color: remainingBalanced ? UI.color.success : UI.color.danger },
              ]}
            >
              {remainingText}
            </Typography>
          </View>
        ) : null
      }
    >
      <View style={styles.listCard}>
        {participants.map((participant, index) => {
          const isIncluded = included[participant.id] ?? true;
          return (
            <View
              key={participant.id}
              style={[
                styles.participantRow,
                index < participants.length - 1 && styles.rowDivider,
                !isIncluded && styles.participantExcluded,
              ]}
            >
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isIncluded }}
                onPress={() => {
                  Haptics.selectionAsync();
                  setIncluded((prev) => ({ ...prev, [participant.id]: !isIncluded }));
                }}
                style={({ pressed }) => [
                  styles.checkbox,
                  isIncluded && styles.checkboxActive,
                  pressed && styles.pressed,
                ]}
              >
                {isIncluded ? (
                  <icons.Check size={15} color={UI.color.textInverse} strokeWidth={2.6} />
                ) : null}
              </Pressable>
              <AppUserAvatar user={participant} size="sm" />
              <View style={styles.participantText}>
                <Typography numberOfLines={1} style={styles.rowTitle}>
                  {participant.id === currentUserId ? "You" : participant.name}
                </Typography>
                <Typography style={styles.rowMeta}>
                  {isIncluded ? "Included" : "Excluded"}
                </Typography>
              </View>

              {splitMethod === "equal" && isIncluded && parsedAmount > 0 ? (
                <View style={styles.sharePill}>
                  <Typography style={styles.shareText}>
                    {formatAmount(equalShare, expenseCurrency)}
                  </Typography>
                </View>
              ) : null}

              {splitMethod === "custom" && isIncluded ? (
                <View style={styles.shareInputWrap}>
                  <TextInput
                    value={customAmounts[participant.id] ?? ""}
                    onChangeText={(value) =>
                      setCustomAmounts((prev) => ({ ...prev, [participant.id]: value }))
                    }
                    placeholder="0.00"
                    placeholderTextColor={UI.color.muted}
                    keyboardType="decimal-pad"
                    style={styles.shareInput}
                  />
                </View>
              ) : null}

              {splitMethod === "percentage" && isIncluded ? (
                <View style={styles.percentWrap}>
                  <TextInput
                    value={customPercentages[participant.id] ?? ""}
                    onChangeText={(value) =>
                      setCustomPercentages((prev) => ({ ...prev, [participant.id]: value }))
                    }
                    placeholder="0"
                    placeholderTextColor={UI.color.muted}
                    keyboardType="decimal-pad"
                    style={styles.percentInput}
                  />
                  <Typography style={styles.percentSymbol}>%</Typography>
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
    </Section>
  );
}
