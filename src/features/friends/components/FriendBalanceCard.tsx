import { View } from "react-native";
import { Typography } from "heroui-native";
import * as icons from "lucide-react-native";
import { useUI } from "@/components/ui";
import { formatAmount } from "@/components/ui/AmountDisplay";
import Animated, { FadeInDown } from "react-native-reanimated";

interface FriendBalanceCardProps {
  friendName: string;
  netBalance: number;
  isPositive: boolean;
  isSettled: boolean;
  lastActivityCopy: string;
  currencyCode: string;
}

export function FriendBalanceCard({
  friendName,
  netBalance,
  isPositive,
  isSettled,
  lastActivityCopy,
  currencyCode,
}: FriendBalanceCardProps): React.JSX.Element {
  const { color, radius } = useUI();

  return (
    <Animated.View
      entering={FadeInDown.duration(400).springify()}
      style={{ paddingHorizontal: 24, marginBottom: 40 }}
    >
      <View
        style={{
          padding: 24,
          backgroundColor: color.surface,
          borderWidth: 1,
          borderColor: color.border,
          borderRadius: radius.lg,
          alignItems: "center",
        }}
      >
        {isSettled ? (
          <>
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: radius.pill,
                backgroundColor: color.control,
                borderWidth: 1,
                borderColor: color.border,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <icons.Check size={24} color={color.success} strokeWidth={1.8} />
            </View>
            <Typography
              style={{
                fontSize: 16,
                color: color.text,
                fontFamily: "IBMPlexSans_600SemiBold",
              }}
            >
              All settled up
            </Typography>
            <Typography
              style={{
                marginTop: 4,
                fontSize: 14,
                color: color.muted,
                fontFamily: "IBMPlexSans_500Medium",
              }}
            >
              No pending balances
            </Typography>
            <Typography
              numberOfLines={2}
              style={{
                marginTop: 12,
                fontSize: 14,
                lineHeight: 20,
                color: color.muted,
                fontFamily: "IBMPlexSans_500Medium",
                textAlign: "center",
              }}
            >
              {lastActivityCopy}
            </Typography>
          </>
        ) : (
          <>
            <Typography
              style={{
                fontSize: 13,
                color: color.muted,
                fontFamily: "IBMPlexSans_600SemiBold",
                textTransform: "uppercase",
                letterSpacing: 1.2,
                marginBottom: 8,
              }}
            >
              {isPositive ? `${friendName} owes you` : `You owe ${friendName}`}
            </Typography>
            <Typography
              numberOfLines={1}
              adjustsFontSizeToFit
              style={{
                fontSize: 40,
                color: isPositive ? color.success : color.danger,
                fontFamily: "Sora_600SemiBold",
              }}
            >
              {formatAmount(Math.abs(netBalance), currencyCode)}
            </Typography>
            <Typography
              numberOfLines={2}
              style={{
                marginTop: 12,
                fontSize: 14,
                lineHeight: 20,
                color: color.muted,
                fontFamily: "IBMPlexSans_500Medium",
                textAlign: "center",
              }}
            >
              {isPositive
                ? "Send a reminder or add another shared expense."
                : "Settle this balance when you are ready."}{" "}
              {lastActivityCopy}
            </Typography>
          </>
        )}
      </View>
    </Animated.View>
  );
}
