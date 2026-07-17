import type { JSX } from "react";
import { Pressable, View } from "react-native";
import { Typography } from "heroui-native";
import * as icons from "lucide-react-native";
import { Card } from "@/components/ui/Card";
import { GroupIconBadge } from "@/components/ui/GroupIconBadge";
import { AvatarStack } from "@/components/ui/MemberAvatar";
import { useUI } from "@/components/ui/native-ui";
import { styles } from "@/features/expenses/utils/styles";
import type { Group, User } from "@/types";

export function ContextSummary({
  selectedGroup,
  selectedFriends,
  participants,
  currency,
  canChange,
  onChange,
}: {
  selectedGroup?: Group;
  selectedFriends: User[];
  participants: User[];
  currency: string;
  canChange: boolean;
  onChange: () => void;
}): JSX.Element {
  const { color, radius, space, shadow } = useUI();
  const title = selectedGroup
    ? selectedGroup.name
    : selectedFriends.map((friend) => friend.name.split(" ")[0]).join(", ");
  const Icon = selectedGroup ? icons.Users : icons.UserRound;

  return (
    <Card>
      <View style={styles.summaryRow}>
        {selectedGroup ? (
          <GroupIconBadge group={selectedGroup} size="md" />
        ) : (
          <View style={styles.contextAvatarStack}>
            <AvatarStack users={participants} max={3} />
          </View>
        )}
        <View style={styles.summaryText}>
          <View style={styles.contextTypeRow}>
            <Icon size={14} color={color.muted} strokeWidth={1.8} />
            <Typography style={styles.contextTypeText}>
              {selectedGroup ? "Group expense" : "Friend expense"}
            </Typography>
          </View>
          <Typography numberOfLines={1} style={styles.summaryTitle}>
            {title}
          </Typography>
          <Typography style={styles.summaryMeta}>
            {participants.length} people · {currency}
          </Typography>
        </View>
        {canChange ? (
          <Pressable
            accessibilityRole="button"
            onPress={onChange}
            style={({ pressed }) => [styles.changeButton, pressed && styles.pressed]}
          >
            <Typography style={styles.changeButtonText}>Change</Typography>
          </Pressable>
        ) : null}
      </View>
    </Card>
  );
}
