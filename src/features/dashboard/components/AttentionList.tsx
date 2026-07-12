import type { JSX } from "react";
import { View } from "react-native";
import { Typography } from "heroui-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { formatAmount } from "@/components/ui/AmountDisplay";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { UI, TYPO } from "@/components/ui/native-ui";
import { HapticButton } from "@/components/ui/HapticButton";
import { Card } from "@/components/ui/Card";
import type { User } from "@/types";

export interface AttentionListProps {
  oweUsers: User[];
  owedUsers: User[];
  perUserBalances: Map<string, number>;
  currentUserId: string;
  preferredCurrency: { code: string };
}

export function AttentionList({
  oweUsers,
  owedUsers,
  perUserBalances,
  currentUserId,
  preferredCurrency,
}: AttentionListProps): JSX.Element {
  const router = useRouter();

  if (owedUsers.length === 0 && oweUsers.length === 0) {
    return <></>;
  }

  return (
    <Animated.View
      entering={FadeInDown.duration(350).delay(105).springify()}
      style={{ paddingHorizontal: UI.space.page, marginBottom: 24 }}
    >
      <View style={{ marginBottom: 14 }}>
        <Typography style={TYPO.semi(18)}>Need attention</Typography>
      </View>
      <Card padding={0}>
        {owedUsers.slice(0, 3).map((user) => (
          <View
            key={user.id}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 14,
              paddingHorizontal: 16,
              borderBottomWidth: 1,
              borderBottomColor: UI.color.border,
            }}
          >
            <AppUserAvatar user={user} size="sm" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Typography style={[TYPO.semi(15), { color: UI.color.textStrong }]}>
                {user.name}
              </Typography>
              <Typography style={[TYPO.medium(13), { color: UI.color.success, marginTop: 1 }]}>
                Owes you{" "}
                {formatAmount(
                  Math.abs(perUserBalances.get(user.id) ?? 0),
                  preferredCurrency.code
                )}
              </Typography>
            </View>
            <HapticButton
              tone="outlined"
              height={36}
              onPress={() => router.push(`/settle/${user.id}`)}
            >
              Remind
            </HapticButton>
          </View>
        ))}
        {oweUsers.slice(0, 3).map((user) => (
          <View
            key={user.id}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 14,
              paddingHorizontal: 16,
              borderBottomWidth: 1,
              borderBottomColor: UI.color.border,
            }}
          >
            <AppUserAvatar user={user} size="sm" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Typography style={[TYPO.semi(15), { color: UI.color.textStrong }]}>
                {user.name}
              </Typography>
              <Typography style={[TYPO.medium(13), { color: UI.color.danger, marginTop: 1 }]}>
                You owe{" "}
                {formatAmount(
                  Math.abs(perUserBalances.get(user.id) ?? 0),
                  preferredCurrency.code
                )}
              </Typography>
            </View>
            <HapticButton
              tone="ink"
              height={36}
              onPress={() => router.push(`/settle/${user.id}`)}
            >
              Settle
            </HapticButton>
          </View>
        ))}
      </Card>
    </Animated.View>
  );
}
