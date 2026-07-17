import { View, Pressable } from "react-native";
import { Typography } from "heroui-native";
import { useRouter } from "expo-router";
import * as icons from "lucide-react-native";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { formatAmount } from "@/components/ui/AmountDisplay";
import { useUI } from "@/components/ui";
import type { Friendship } from "@/types";
import type { FriendListItem } from "@/features/friends/hooks/useFriendsList";

interface FriendsRequestsProps {
  pendingRequests: Friendship[];
  topBalanceAction: FriendListItem | null;
  currencyCode: string;
  onRequestAction: (friendshipId: string, action: "accept" | "reject") => void;
  onPrimaryAction: (row: FriendListItem) => void;
}

export function FriendsRequests({
  pendingRequests,
  topBalanceAction,
  onRequestAction,
  onPrimaryAction,
  currencyCode,
}: FriendsRequestsProps): React.JSX.Element {
  const { color, radius, space } = useUI();
  const router = useRouter();

  return (
    <View style={{ paddingHorizontal: space.page, marginBottom: 18 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <Typography
          style={{
            fontSize: 18,
            color: color.text,
            fontFamily: "IBMPlexSans_600SemiBold",
            letterSpacing: -0.2,
          }}
        >
          {pendingRequests.length > 0
            ? `${pendingRequests.length} ${pendingRequests.length === 1 ? "person" : "people"} want to connect`
            : "Needs attention"}
        </Typography>
        <Typography
          style={{
            fontSize: 13,
            color: color.muted,
            fontFamily: "IBMPlexSans_500Medium",
          }}
        >
          {pendingRequests.length + (topBalanceAction ? 1 : 0)} item
          {pendingRequests.length + (topBalanceAction ? 1 : 0) === 1 ? "" : "s"}
        </Typography>
      </View>

      <View
        style={{
          backgroundColor: color.surface,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: color.border,
          paddingHorizontal: 14,
        }}
      >
        {(() => {
          const visibleRequests =
            pendingRequests.length > 3 ? pendingRequests.slice(0, 3) : pendingRequests;
          const remainingCount = pendingRequests.length - visibleRequests.length;

          return (
            <>
              {visibleRequests.map((request, index) => {
                const requester = request.friendUser!;
                const hasDivider =
                  index < visibleRequests.length - 1 ||
                  remainingCount > 0 ||
                  !!topBalanceAction;

                return (
                  <View
                    key={request.id}
                    style={{
                      minHeight: 68,
                      flexDirection: "row",
                      alignItems: "center",
                      borderBottomWidth: hasDivider ? 1 : 0,
                      borderBottomColor: color.border,
                      paddingVertical: 12,
                    }}
                  >
                    <AppUserAvatar user={requester} size="sm" />
                    <View style={{ flex: 1, marginLeft: 12, marginRight: 10 }}>
                      <Typography
                        numberOfLines={1}
                        style={{
                          fontSize: 15,
                          lineHeight: 20,
                          color: color.text,
                          fontFamily: "IBMPlexSans_600SemiBold",
                        }}
                      >
                        {requester.name}
                      </Typography>
                      <Typography
                        numberOfLines={1}
                        style={{
                          marginTop: 1,
                          fontSize: 13,
                          lineHeight: 17,
                          color: color.muted,
                          fontFamily: "IBMPlexSans_500Medium",
                        }}
                      >
                        Wants to connect
                      </Typography>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Reject ${requester.name}'s request`}
                      onPress={() => onRequestAction(request.id, "reject")}
                      hitSlop={8}
                      style={({ pressed }) => ({
                        width: 44,
                        height: 44,
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: color.border,
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 8,
                        opacity: pressed ? 0.62 : 1,
                      })}
                    >
                      <icons.X size={18} color={color.muted} strokeWidth={2} />
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Accept ${requester.name}'s request`}
                      onPress={() => onRequestAction(request.id, "accept")}
                      style={({ pressed }) => ({
                        width: 44,
                        height: 44,
                        borderRadius: 999,
                        backgroundColor: color.text,
                        alignItems: "center",
                        justifyContent: "center",
                        opacity: pressed ? 0.72 : 1,
                      })}
                    >
                      <icons.Check size={18} color={color.textInverse} strokeWidth={2} />
                    </Pressable>
                  </View>
                );
              })}

              {remainingCount > 0 && (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push("/notifications")}
                  style={({ pressed }) => ({
                    minHeight: 56,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingVertical: 12,
                    borderBottomWidth: !!topBalanceAction ? 1 : 0,
                    borderBottomColor: color.border,
                    opacity: pressed ? 0.62 : 1,
                  })}
                >
                  <Typography
                    style={{
                      fontSize: 14,
                      color: color.text,
                      fontFamily: "IBMPlexSans_600SemiBold",
                    }}
                  >
                    View all {pendingRequests.length} requests →
                  </Typography>
                  <icons.ChevronRight size={18} color={color.muted} strokeWidth={2} />
                </Pressable>
              )}
            </>
          );
        })()}

        {topBalanceAction && (
          <View
            style={{
              minHeight: 68,
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 12,
            }}
          >
            <AppUserAvatar
              user={topBalanceAction.friend}
              size="sm"
              balance={topBalanceAction.balance}
            />
            <View style={{ flex: 1, marginLeft: 12, marginRight: 10 }}>
              <Typography
                numberOfLines={1}
                style={{
                  fontSize: 15,
                  lineHeight: 20,
                  color: color.text,
                  fontFamily: "IBMPlexSans_600SemiBold",
                }}
              >
                {topBalanceAction.friend.name}
              </Typography>
              <Typography
                numberOfLines={1}
                style={{
                  marginTop: 1,
                  fontSize: 13,
                  lineHeight: 17,
                  color: topBalanceAction.balance > 0 ? color.success : color.danger,
                  fontFamily: "IBMPlexSans_600SemiBold",
                }}
              >
                {topBalanceAction.balance > 0 ? "Remind about " : "Settle "}
                {formatAmount(Math.abs(topBalanceAction.balance), currencyCode)}
              </Typography>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => onPrimaryAction(topBalanceAction)}
              style={({ pressed }) => ({
                minHeight: 36,
                paddingHorizontal: 14,
                borderRadius: 999,
                backgroundColor: color.text,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.72 : 1,
              })}
            >
              <Typography
                style={{
                  fontSize: 13,
                  color: color.textInverse,
                  fontFamily: "IBMPlexSans_600SemiBold",
                }}
              >
                {topBalanceAction.balance > 0 ? "Remind" : "Settle"}
              </Typography>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}
