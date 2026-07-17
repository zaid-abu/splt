import type { JSX } from "react";
import { View, Pressable, ScrollView } from "react-native";
import { Typography } from "heroui-native";
import Animated, { FadeInDown, FadeIn, LinearTransition } from "react-native-reanimated";
import * as icons from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useUI, GlassSection } from "@/components/ui";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";

interface FriendOption {
  friendId: string;
  amount: number;
  direction: "you" | "them";
}

interface SettlementPartiesProps {
  leftUser: any;
  rightUser: any;
  leftName: string;
  rightName: string;
  direction: "you" | "them";
  isGroupRoute: boolean;
  debtOptions: FriendOption[];
  combinedFriends: any[];
  targetGroup: any;
  showRecipientSelector: boolean;
  selectedFriendId: string | undefined;
  onSwap: () => void;
  onToggleRecipientSelector: () => void;
  onSelectFriend: (friendId: string, amount: number) => void;
}

export function SettlementParties({
  leftUser,
  rightUser,
  leftName,
  rightName,
  direction,
  isGroupRoute,
  debtOptions,
  combinedFriends,
  targetGroup,
  showRecipientSelector,
  selectedFriendId,
  onSwap,
  onToggleRecipientSelector,
  onSelectFriend,
}: SettlementPartiesProps): JSX.Element {
  const { color, radius } = useUI();

  return (
    <Animated.View
      entering={FadeInDown.duration(400)}
      style={{ paddingHorizontal: 24, paddingVertical: 24 }}
    >
      <GlassSection title="Parties">
        <View style={{ padding: 20 }}>
          <View
            style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
          >
            <Animated.View
              style={{ alignItems: "center", width: 80 }}
              layout={LinearTransition.springify()}
            >
              <AppUserAvatar user={leftUser} size="lg" />
              <Typography
                style={{
                  fontSize: 13,
                  fontFamily: "IBMPlexSans_600SemiBold",
                  marginTop: 8,
                  color: color.text,
                }}
              >
                {leftName}
              </Typography>
            </Animated.View>

            <View style={{ flex: 1, alignItems: "center", paddingHorizontal: 16 }}>
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  onSwap();
                }}
                style={({ pressed }) => ({
                  backgroundColor: "transparent",
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: radius.pill,
                  borderWidth: 1,
                  borderColor: color.border,
                  opacity: pressed ? 0.7 : 1,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                })}
              >
                <icons.ArrowRightLeft size={16} color={color.text} strokeWidth={2.5} />
                <Typography
                  style={{
                    fontSize: 12,
                    color: color.text,
                    fontFamily: "IBMPlexSans_600SemiBold",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  Swap
                </Typography>
              </Pressable>
            </View>

            <Animated.View
              style={{ alignItems: "center", width: 80 }}
              layout={LinearTransition.springify()}
            >
              {isGroupRoute && debtOptions.length > 1 ? (
                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync();
                    onToggleRecipientSelector();
                  }}
                  style={{ alignItems: "center", opacity: showRecipientSelector ? 0.7 : 1 }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <AppUserAvatar user={rightUser} size="lg" />
                    <icons.ChevronDown size={16} color={color.text} />
                  </View>
                  <Typography
                    style={{
                      fontSize: 13,
                      fontFamily: "IBMPlexSans_600SemiBold",
                      marginTop: 8,
                      color: color.text,
                    }}
                  >
                    {rightName}
                  </Typography>
                </Pressable>
              ) : (
                <View style={{ alignItems: "center" }}>
                  <AppUserAvatar user={rightUser} size="lg" />
                  <Typography
                    style={{
                      fontSize: 13,
                      fontFamily: "IBMPlexSans_600SemiBold",
                      marginTop: 8,
                      color: color.text,
                    }}
                  >
                    {rightName}
                  </Typography>
                </View>
              )}
            </Animated.View>
          </View>

          {showRecipientSelector && debtOptions.length > 1 && (
            <Animated.View
              entering={FadeInDown.duration(300)}
              exiting={FadeIn.duration(200)}
              style={{ marginTop: 20 }}
            >
              <Typography
                style={{
                  fontSize: 12,
                  color: color.muted,
                  fontFamily: "IBMPlexSans_500Medium",
                  marginBottom: 8,
                }}
              >
                Select who you are settling with
              </Typography>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 12 }}
              >
                {debtOptions.map((opt) => {
                  const optFriend =
                    combinedFriends.find((f) => f.id === opt.friendId) ||
                    targetGroup?.members.find((m: any) => m.userId === opt.friendId)?.user;
                  if (!optFriend) return null;
                  const isSelected = selectedFriendId === opt.friendId;
                  return (
                    <Pressable
                      key={opt.friendId}
                      onPress={() => {
                        Haptics.selectionAsync();
                        onSelectFriend(opt.friendId, opt.amount);
                      }}
                      style={{
                        alignItems: "center",
                        padding: 12,
                        borderWidth: 1,
                        borderRadius: radius.lg,
                        borderColor: isSelected ? color.brand : color.border,
                        backgroundColor: isSelected ? color.brand : "transparent",
                        opacity: isSelected ? 1 : 0.7,
                        width: 80,
                      }}
                    >
                      <AppUserAvatar user={optFriend} size="sm" />
                      <Typography
                        style={{
                          fontSize: 11,
                          fontFamily: "IBMPlexSans_600SemiBold",
                          marginTop: 8,
                          color: isSelected ? color.textInverse : color.text,
                        }}
                        numberOfLines={1}
                      >
                        {optFriend.name.split(" ")[0]}
                      </Typography>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </Animated.View>
          )}
        </View>
      </GlassSection>
    </Animated.View>
  );
}
