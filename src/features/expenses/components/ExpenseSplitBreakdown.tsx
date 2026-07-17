import type { JSX } from "react";
import { View, Pressable } from "react-native";
import { Typography } from "heroui-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { AppLoader } from "@/components/ui/AppLoader";
import { useUI, GlassSection, GlassRow } from "@/components/ui";
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

  return (
    <>
      <Animated.View
        entering={FadeInDown.duration(400).delay(100)}
        style={{ paddingHorizontal: space.page, paddingTop: 32 }}
      >
        <GlassSection title="Split Breakdown">
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
                <GlassRow
                  key={split.userId}
                  icon={<AppUserAvatar user={split.user} size="lg" />}
                  title={isMe ? "You" : split.user.name}
                  subtitle={subtitle}
                  end={
                    <Typography
                      style={{
                        fontSize: 20,
                        color: color.text,
                        fontFamily: "IBMPlexSans_600SemiBold",
                      }}
                    >
                      {formatAmt(split.amount)}
                    </Typography>
                  }
                  onPress={() => onUserPress?.(split.userId)}
                />
              );
            })
          )}
        </GlassSection>
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
            <Typography
              style={{
                fontSize: 14,
                color: color.textInverse,
                opacity: 0.7,
                fontFamily: "IBMPlexSans_600SemiBold",
                textTransform: "uppercase",
                letterSpacing: 1.4,
                marginBottom: 8,
              }}
            >
              {myShareSummaryLabel}
            </Typography>
            <Typography
              style={{
                fontSize: 28,
                color: color.textInverse,
                fontFamily: "IBMPlexSans_600SemiBold",
                marginBottom: 8,
              }}
            >
              {myShareSummaryAmount}
            </Typography>
            <Typography
              style={{
                fontSize: 14,
                color: color.textInverse,
                opacity: 0.9,
                fontFamily: "IBMPlexSans_500Medium",
                lineHeight: 20,
              }}
            >
              {settleMessage}
            </Typography>

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
                <Typography
                  style={{
                    fontSize: 15,
                    color: color.brand,
                    fontFamily: "IBMPlexSans_600SemiBold",
                  }}
                >
                  Settle Your Share
                </Typography>
              </Pressable>
            )}
          </View>
        </Animated.View>
      )}
    </>
  );
}
