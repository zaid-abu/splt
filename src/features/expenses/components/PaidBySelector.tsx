import type { JSX } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Typography } from "heroui-native";
import * as Haptics from "expo-haptics";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { styles } from "@/features/expenses/utils/styles";
import type { User } from "@/types";

export function PaidBySelector({
  participants,
  paidBy,
  currentUserId,
  onChange,
}: {
  participants: User[];
  paidBy: string;
  currentUserId: string;
  onChange: (id: string) => void;
}): JSX.Element {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.paidByRow}>
        {participants.map((participant) => {
          const active = paidBy === participant.id;
          return (
            <Pressable
              key={participant.id}
              accessibilityRole="button"
              onPress={() => {
                Haptics.selectionAsync();
                onChange(participant.id);
              }}
              style={({ pressed }) => [
                styles.paidByChip,
                active && styles.paidByChipActive,
                pressed && styles.pressed,
              ]}
            >
              <AppUserAvatar user={participant} size="sm" />
              <Typography style={[styles.paidByText, active && styles.paidByTextActive]}>
                {participant.id === currentUserId ? "You" : participant.name.split(" ")[0]}
              </Typography>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}
