import type { JSX } from "react";
import { View, Pressable, Text } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { AppLoader } from "@/components/ui/AppLoader";
import { useUI } from "@/components/ui";
import { MoneyRow, Eyebrow, useCoralColors } from "@/components/coral";
import type { ExpenseSplit } from "@/types";

interface ExpenseSplitBreakdownProps {
  splits: ExpenseSplit[];
  splitMethod: string;
  currentUserId: string;
  formatAmt: (n: number) => string;
  paidByMe: boolean;
  myShareAmount?: number;
  myShareSummaryLabel: string;
  myShareSummaryAmount: string;
  settleMessage?: string;
  showSettleButton: boolean;
  paidByFirstName: string;
  onSettlePress?: () => void;
  onUserPress?: (userId: string) => void;
  isAppLoading: boolean;
}

export function ExpenseSplitBreakdown({
  splits,
  splitMethod: _splitMethod,
  currentUserId,
  formatAmt,
  paidByMe,
  myShareSummaryLabel,
  myShareSummaryAmount,
  settleMessage,
  showSettleButton,
  paidByFirstName,
  onSettlePress,
  onUserPress,
  isAppLoading,
}: ExpenseSplitBreakdownProps): JSX.Element {
  const { color, radius, space } = useUI();
  const coral = useCoralColors();

  return (
    <>
      <Animated.View
        entering={FadeInDown.duration(400).delay(100)}
        style={{ paddingHorizontal: space.page, paddingTop: 32 }}
      >
        <View style={{ marginBottom: 28 }}>
          <Eyebrow style={{ marginTop: 0 }}>Split Breakdown</Eyebrow>
          <View
            style={{
              backgroundColor: coral.surface,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: coral.border,
              overflow: "hidden",
            }}
          >
            {isAppLoading ? (
              <View style={{ paddingVertical: 24 }}>
                <AppLoader />
              </View>
            ) : (
              splits.map((split) => {
                const isMe = split.userId === currentUserId;
                const isPayer = split.paid;
                const isSettled = split.paid && !isPayer;

                let subtitle: string;
                if (isPayer) {
                  subtitle = split.paid ? "Paid the bill" : "Owes";
                } else {
                  subtitle = isSettled ? "Settled" : "Owes";
                }

                return (
                  <MoneyRow
                    key={split.userId}
                    avatar={<AppUserAvatar user={split.user} size="lg" />}
                    title={isMe ? "You" : split.user.name}
                    subtitle={subtitle}
                    amount={formatAmt(split.amount)}
                    onPress={() => onUserPress?.(split.userId)}
                  />
                );
              })
            )}
          </View>
        </View>
      </Animated.View>

      {myShareSummaryAmount && (
        <Animated.View
          entering={FadeInDown.duration(400).delay(200)}
          style={{ paddingHorizontal: space.page, paddingTop: 32 }}
        >
          <View
            style={{
              paddingVertical: 24,
              paddingHorizontal: 24,
              backgroundColor: color.brand,
              borderRadius: radius.lg,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                color: color.textInverse,
                opacity: 0.7,
                fontFamily: "InstrumentSans_600SemiBold",
                textTransform: "uppercase",
                letterSpacing: 1.4,
                marginBottom: 8,
              }}
            >
              {myShareSummaryLabel}
            </Text>
            <Text
              style={{
                fontSize: 28,
                color: color.textInverse,
                fontFamily: "InstrumentSans_600SemiBold",
                marginBottom: 8,
              }}
            >
              {myShareSummaryAmount}
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: color.textInverse,
                opacity: 0.9,
                fontFamily: "InstrumentSans_500Medium",
                lineHeight: 20,
              }}
            >
              {settleMessage}
            </Text>

            {showSettleButton && (
              <Pressable
                accessibilityRole="button"
                onPress={onSettlePress}
                style={({ pressed }) => ({
                  marginTop: 24,
                  height: 48,
                  backgroundColor: color.control,
                  borderRadius: radius.pill,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <Text
                  style={{
                    fontSize: 15,
                    color: color.brand,
                    fontFamily: "InstrumentSans_600SemiBold",
                  }}
                >
                  Settle Your Share
                </Text>
              </Pressable>
            )}
          </View>
        </Animated.View>
      )}
    </>
  );
}
