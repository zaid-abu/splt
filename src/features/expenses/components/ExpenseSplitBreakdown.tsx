import type { JSX } from "react";
import { View, Pressable } from "react-native";
import { Typography } from "heroui-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { AppLoader } from "@/components/ui/AppLoader";
import { useUI } from "@/components/ui";
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
  splitMethod,
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
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <Typography
            style={{
              fontSize: 12,
              color: color.muted,
              fontFamily: "IBMPlexSans_600SemiBold",
              textTransform: "uppercase",
              letterSpacing: 2,
            }}
          >
            Split Breakdown
          </Typography>
          <View
            style={{
              paddingHorizontal: 12,
              paddingVertical: 4,
              backgroundColor: "transparent",
              borderWidth: 1,
              borderColor: color.border,
              borderRadius: 12,
            }}
          >
            <Typography
              style={{
                fontSize: 11,
                color: color.text,
                fontFamily: "IBMPlexSans_600SemiBold",
              }}
            >
              {splitMethod}
            </Typography>
          </View>
        </View>

        <View>
          {isAppLoading ? (
            <View style={{ paddingTop: 24 }}>
              <AppLoader />
            </View>
          ) : (
            splits.map((split, idx) => {
              const isMe = split.userId === currentUserId;
              const isPayer = split.paid;
              const isSettled = split.paid && !isPayer;

              return (
                <Pressable
                  key={split.userId}
                  onPress={() => onUserPress?.(split.userId)}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 16,
                    borderBottomWidth: idx < splits.length - 1 ? 1 : 0,
                    borderBottomColor: color.border,
                    opacity: !isMe && pressed ? 0.5 : 1,
                  })}
                >
                  <AppUserAvatar user={split.user} size="lg" />
                  <View style={{ flex: 1, marginLeft: 16, justifyContent: "center" }}>
                    <Typography
                      style={{
                        fontSize: 18,
                        color: color.text,
                        fontFamily: "IBMPlexSans_600SemiBold",
                        marginBottom: 2,
                      }}
                    >
                      {isMe ? "You" : split.user.name}
                    </Typography>
                    <Typography
                      style={{
                        fontSize: 14,
                        color: color.muted,
                        fontFamily: "IBMPlexSans_500Medium",
                      }}
                    >
                      {isPayer ? (split.paid ? "Paid the bill" : "Owes") : isSettled ? "Settled" : "Owes"}
                    </Typography>
                  </View>
                  <Typography
                    style={{
                      fontSize: 20,
                      color: color.text,
                      fontFamily: "IBMPlexSans_600SemiBold",
                    }}
                  >
                    {formatAmt(split.amount)}
                  </Typography>
                </Pressable>
              );
            })
          )}
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
