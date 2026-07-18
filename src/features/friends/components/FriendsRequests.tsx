import { View, Pressable, Text } from "react-native";
import { useRouter } from "expo-router";
import * as icons from "lucide-react-native";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { formatAmount } from "@/components/ui/AmountDisplay";
import { MoneyRow, Eyebrow, useCoralColors } from "@/components/coral";
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
  const { color, space } = useUI();
  const coral = useCoralColors();
  const router = useRouter();

  const itemCount = pendingRequests.length + (topBalanceAction ? 1 : 0);

  return (
    <View style={{ paddingHorizontal: space.page, marginBottom: 18 }}>
      <View style={{ marginBottom: 28 }}>
        <Eyebrow style={{ marginTop: 0 }}>
          {pendingRequests.length > 0
            ? `${pendingRequests.length} ${pendingRequests.length === 1 ? "person" : "people"} want to connect`
            : "Needs attention"}
        </Eyebrow>
        <View
          style={{
            backgroundColor: coral.surface,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: coral.border,
            overflow: "hidden",
          }}
        >
          {(() => {
            const visibleRequests =
              pendingRequests.length > 3 ? pendingRequests.slice(0, 3) : pendingRequests;
            const remainingCount = pendingRequests.length - visibleRequests.length;

            return (
              <>
                {visibleRequests.map((request, idx) => {
                  const requester = request.friendUser!;
                  const hasDivider =
                    idx < visibleRequests.length - 1 || remainingCount > 0 || !!topBalanceAction;

                  return (
                    <View key={request.id}>
                      <MoneyRow
                        avatar={<AppUserAvatar user={requester} size="sm" />}
                        title={requester.name}
                        subtitle="Wants to connect"
                        amount=""
                        rightElement={
                          <View style={{ flexDirection: "row", gap: 8 }}>
                            <Pressable
                              accessibilityRole="button"
                              accessibilityLabel={`Reject ${requester.name}'s request`}
                              onPress={() => onRequestAction(request.id, "reject")}
                              hitSlop={8}
                              style={({ pressed }) => ({
                                width: 36,
                                height: 36,
                                borderRadius: 999,
                                borderWidth: 1,
                                borderColor: color.border,
                                alignItems: "center",
                                justifyContent: "center",
                                opacity: pressed ? 0.62 : 1,
                              })}
                            >
                              <icons.X size={16} color={color.muted} strokeWidth={2} />
                            </Pressable>
                            <Pressable
                              accessibilityRole="button"
                              accessibilityLabel={`Accept ${requester.name}'s request`}
                              onPress={() => onRequestAction(request.id, "accept")}
                              style={({ pressed }) => ({
                                width: 36,
                                height: 36,
                                borderRadius: 999,
                                backgroundColor: color.text,
                                alignItems: "center",
                                justifyContent: "center",
                                opacity: pressed ? 0.72 : 1,
                              })}
                            >
                              <icons.Check size={16} color={color.textInverse} strokeWidth={2} />
                            </Pressable>
                          </View>
                        }
                      />
                      {hasDivider ? (
                        <View
                          style={{
                            height: 1,
                            backgroundColor: color.borderSoft,
                            marginHorizontal: 14,
                          }}
                        />
                      ) : null}
                    </View>
                  );
                })}

                {remainingCount > 0 && (
                  <>
                    <View
                      style={{
                        height: 1,
                        backgroundColor: color.borderSoft,
                        marginHorizontal: 14,
                      }}
                    />
                    <MoneyRow
                      title={`View all ${pendingRequests.length} requests`}
                      amount=""
                      rightElement={<icons.ChevronRight size={18} color={color.muted} />}
                      onPress={() => router.push("/notifications")}
                    />
                  </>
                )}

                {topBalanceAction && (
                  <>
                    {pendingRequests.length > 0 ? (
                      <View
                        style={{
                          height: 1,
                          backgroundColor: color.borderSoft,
                          marginHorizontal: 14,
                        }}
                      />
                    ) : null}
                    <MoneyRow
                      avatar={
                        <AppUserAvatar
                          user={topBalanceAction.friend}
                          size="sm"
                          balance={topBalanceAction.balance}
                        />
                      }
                      title={topBalanceAction.friend.name}
                      subtitle={`${topBalanceAction.balance > 0 ? "Remind about " : "Settle "}${formatAmount(Math.abs(topBalanceAction.balance), currencyCode)}`}
                      amount=""
                      rightElement={
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => onPrimaryAction(topBalanceAction)}
                          style={({ pressed }) => ({
                            minHeight: 32,
                            paddingHorizontal: 12,
                            borderRadius: 999,
                            backgroundColor: color.text,
                            alignItems: "center",
                            justifyContent: "center",
                            opacity: pressed ? 0.72 : 1,
                          })}
                        >
                          <Text
                            style={{
                              fontSize: 12,
                              color: color.textInverse,
                              fontFamily: "InstrumentSans_600SemiBold",
                            }}
                          >
                            {topBalanceAction.balance > 0 ? "Remind" : "Settle"}
                          </Text>
                        </Pressable>
                      }
                    />
                  </>
                )}
              </>
            );
          })()}
        </View>
      </View>
    </View>
  );
}
