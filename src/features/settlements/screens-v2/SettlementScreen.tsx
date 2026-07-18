import { useState, type JSX } from "react";
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TextInput,
} from "react-native";
import { Typography, Spinner } from "heroui-native";
import { ThemedStatusBar } from "@/components/ui/ThemedStatusBar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import * as icons from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { useUI, ScreenHeader } from "@/components/ui";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/context/AppContext";
import { useSettlement } from "@/features/settlements/hooks/useSettlement";
import { formatAmount } from "@/components/ui/AmountDisplay";
import type { SettleRouteParams } from "@/types/navigation";

const PAYMENT_METHODS = [
  { key: "cash", label: "Record as cash payment" },
  { key: "bank", label: "Bank transfer" },
  { key: "link", label: "Payment link" },
];

export default function SettlementScreenV2(): JSX.Element {
  const params = useLocalSearchParams<SettleRouteParams>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();
  const { color, radius, space } = useUI();

  const {
    isGroupRoute,
    targetGroup,
    combinedFriends,
    isLoading,
    debtOptions,
    netBalance,
    sharedGroups,
    friend,
    settlementCurrency,
    settlementCurrencyObj,
    selectedFriendId,
    setSelectedFriendId,
    showRecipientSelector,
    setShowRecipientSelector,
    direction,
    setDirection,
    amountStr,
    setAmountStr,
    note,
    setNote,
    showOptional,
    setShowOptional,
    selectedGroupId,
    setSelectedGroupId,
    parsedAmount,
    isYouDirection,
    handleAmountChange,
    handleSubmit,
    isAddingSettlement,
  } = useSettlement(currentUser, params);

  const [payMethod, setPayMethod] = useState<string>("cash");

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleSubmitWithNavigation = async (): Promise<boolean> => {
    const success = await handleSubmit();
    if (success) setTimeout(() => router.back(), 600);
    return success ?? false;
  };

  const leftUser = isYouDirection ? currentUser! : friend!;
  const rightUser = isYouDirection ? friend! : currentUser!;
  const leftName = isYouDirection ? "You" : friend!.name.split(" ")[0];
  const rightName = isYouDirection ? friend!.name.split(" ")[0] : "You";

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: color.bg, paddingTop: insets.top }}>
        <ThemedStatusBar />
        <ScreenHeader title="Settle up" onBackPress={handleBack} />
        <View style={{ padding: 24, gap: 24, alignItems: "center" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 32 }}>
            <View style={{ alignItems: "center", gap: 8 }}>
              <Skeleton width={80} height={80} radius={999} />
              <Skeleton width={60} height={14} />
            </View>
            <Skeleton width={80} height={2} />
            <View style={{ alignItems: "center", gap: 8 }}>
              <Skeleton width={80} height={80} radius={999} />
              <Skeleton width={60} height={14} />
            </View>
          </View>
          <Skeleton width={150} height={14} />
          <Skeleton width={200} height={48} />
        </View>
      </View>
    );
  }

  if (!friend && (!isGroupRoute || debtOptions.length === 0)) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: color.bg,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: space.page,
        }}
      >
        <ThemedStatusBar />
        <ScreenHeader title="Settle up" onBackPress={handleBack} />
        <View style={{ alignItems: "center", gap: 16, flex: 1, justifyContent: "center" }}>
          <icons.CheckCircle2 size={64} color="#4CAF82" strokeWidth={1.5} />
          <Typography
            style={{
              fontSize: 22,
              fontFamily: "Sora_600SemiBold",
              color: color.text,
              letterSpacing: -0.01,
            }}
          >
            {isGroupRoute ? "All settled up!" : "Friend not found"}
          </Typography>
          <Pressable
            accessibilityRole="button"
            onPress={handleBack}
            style={({ pressed }) => ({
              marginTop: 16,
              paddingHorizontal: 24,
              paddingVertical: 14,
              backgroundColor: color.brand,
              borderRadius: radius.pill,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Typography
              style={{
                color: color.textInverse,
                fontFamily: "IBMPlexSans_600SemiBold",
                fontSize: 15,
              }}
            >
              Go Back
            </Typography>
          </Pressable>
        </View>
      </View>
    );
  }

  if (!friend) return <View />;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: color.bg }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ThemedStatusBar />
      <View style={{ paddingTop: insets.top }}>
        <ScreenHeader title="Settle up" onBackPress={handleBack} />
      </View>

      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: Math.max(insets.bottom, 16) + 120,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View
          entering={FadeInDown.duration(400)}
          style={{ alignItems: "center", paddingTop: 32, paddingHorizontal: space.page }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 16,
            }}
          >
            <View style={{ alignItems: "center", gap: 8 }}>
              <AppUserAvatar user={leftUser} size="lg" />
              <Typography
                style={{
                  fontSize: 13,
                  fontFamily: "IBMPlexSans_600SemiBold",
                  color: color.text,
                }}
              >
                {leftName}
              </Typography>
            </View>

            <View style={{ flex: 1, alignItems: "center", paddingHorizontal: 8 }}>
              <View
                style={{
                  height: 2,
                  width: "100%",
                  backgroundColor: color.border,
                }}
              />
              <View style={{ alignItems: "center", marginTop: -14 }}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    Haptics.selectionAsync();
                    setDirection((prev) => (prev === "you" ? "them" : "you"));
                  }}
                  style={({ pressed }) => ({
                    backgroundColor: color.control,
                    borderRadius: radius.pill,
                    borderWidth: 1,
                    borderColor: color.border,
                    padding: 8,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <icons.ArrowRight size={18} color={color.text} strokeWidth={2} />
                </Pressable>
              </View>
            </View>

            <View style={{ alignItems: "center", gap: 8 }}>
              {isGroupRoute && debtOptions.length > 1 ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setShowRecipientSelector(!showRecipientSelector)}
                  style={{ alignItems: "center" }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <AppUserAvatar user={rightUser} size="lg" />
                    <icons.ChevronDown size={16} color={color.text} />
                  </View>
                  <Typography
                    style={{
                      fontSize: 13,
                      fontFamily: "IBMPlexSans_600SemiBold",
                      color: color.text,
                      marginTop: 8,
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
                      color: color.text,
                      marginTop: 8,
                    }}
                  >
                    {rightName}
                  </Typography>
                </View>
              )}
            </View>
          </View>
        </Animated.View>

        {showRecipientSelector && debtOptions.length > 1 && (
          <Animated.View
            entering={FadeInDown.duration(300)}
            style={{ paddingHorizontal: space.page, marginTop: 24 }}
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
                    accessibilityRole="button"
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSelectedFriendId(opt.friendId);
                      setShowRecipientSelector(false);
                      setAmountStr(opt.amount.toFixed(2));
                    }}
                    style={({ pressed }) => ({
                      alignItems: "center",
                      padding: 12,
                      borderWidth: 1,
                      borderRadius: radius.lg,
                      borderColor: isSelected ? color.brand : color.border,
                      backgroundColor: isSelected ? color.brand : "transparent",
                      opacity: pressed ? 0.7 : isSelected ? 1 : 0.7,
                      width: 80,
                    })}
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

        <View style={{ alignItems: "center", marginTop: 32, paddingHorizontal: space.page }}>
          <Typography
            style={{
              fontSize: 16,
              fontFamily: "IBMPlexSans_500Medium",
              color: color.muted,
              textAlign: "center",
              lineHeight: 22,
            }}
          >
            {isYouDirection ? `You are paying ${rightName}` : `${leftName} is paying you`}
          </Typography>
        </View>

        <View style={{ alignItems: "center", marginTop: 24, paddingHorizontal: space.page }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              borderBottomWidth: 2,
              borderBottomColor: color.border,
              paddingBottom: 8,
              minWidth: 200,
            }}
          >
            <Typography
              style={{
                fontSize: 28,
                color: color.text,
                fontFamily: "IBMPlexSans_500Medium",
                marginRight: 8,
              }}
            >
              {settlementCurrencyObj.symbol}
            </Typography>
            <TextInput
              value={amountStr}
              onChangeText={handleAmountChange}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={color.muted}
              style={{
                fontSize: 40,
                fontFamily: "Sora_600SemiBold",
                color: amountStr ? color.text : color.muted,
                letterSpacing: -1,
                textAlign: "center",
                minWidth: 120,
                padding: 0,
              }}
              autoFocus
            />
          </View>

          {Math.abs(netBalance) > 0 && (
            <View style={{ flexDirection: "row", gap: 12, marginTop: 24 }}>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  Haptics.selectionAsync();
                  setAmountStr(Math.abs(netBalance).toFixed(2));
                }}
                style={({ pressed }) => ({
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  borderWidth: 1,
                  borderColor: color.border,
                  borderRadius: radius.pill,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Typography
                  style={{
                    fontSize: 13,
                    color: color.text,
                    fontFamily: "IBMPlexSans_600SemiBold",
                  }}
                >
                  Full: {formatAmount(Math.abs(netBalance), settlementCurrency)}
                </Typography>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  Haptics.selectionAsync();
                  setAmountStr((Math.abs(netBalance) / 2).toFixed(2));
                }}
                style={({ pressed }) => ({
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  borderWidth: 1,
                  borderColor: color.border,
                  borderRadius: radius.pill,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Typography
                  style={{
                    fontSize: 13,
                    color: color.text,
                    fontFamily: "IBMPlexSans_600SemiBold",
                  }}
                >
                  Half: {formatAmount(Math.abs(netBalance) / 2, settlementCurrency)}
                </Typography>
              </Pressable>
            </View>
          )}
        </View>

        <View style={{ paddingHorizontal: space.page, marginTop: 40, gap: 10 }}>
          <Typography
            style={{
              fontSize: 12,
              fontFamily: "IBMPlexSans_600SemiBold",
              color: color.muted,
              textTransform: "uppercase",
              letterSpacing: 0.8,
              marginBottom: 2,
            }}
          >
            Payment method
          </Typography>

          <View
            style={{
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: color.border,
              overflow: "hidden",
            }}
          >
            {PAYMENT_METHODS.map((method, idx) => {
              const isActive = payMethod === method.key;
              return (
                <Pressable
                  key={method.key}
                  accessibilityRole="button"
                  onPress={() => {
                    Haptics.selectionAsync();
                    setPayMethod(method.key);
                  }}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 16,
                    paddingVertical: 16,
                    gap: 12,
                    minHeight: 56,
                    borderBottomWidth: idx < PAYMENT_METHODS.length - 1 ? 1 : 0,
                    borderBottomColor: color.border,
                    backgroundColor: isActive ? color.subtle : "transparent",
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      borderWidth: 2,
                      borderColor: isActive ? color.ink : color.border,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {isActive && (
                      <View
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 5,
                          backgroundColor: color.ink,
                        }}
                      />
                    )}
                  </View>
                  <Typography
                    style={{
                      fontSize: 15,
                      fontFamily: "IBMPlexSans_500Medium",
                      color: isActive ? color.text : color.muted,
                      flex: 1,
                    }}
                  >
                    {method.label}
                  </Typography>
                  {isActive && <icons.Check size={16} color={color.text} strokeWidth={2} />}
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={{ paddingHorizontal: space.page, marginTop: 24 }}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setShowOptional(!showOptional)}
            style={({ pressed }) => ({
              paddingVertical: 8,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Typography
              style={{
                fontSize: 14,
                fontFamily: "IBMPlexSans_500Medium",
                color: color.brand,
              }}
            >
              {showOptional ? "Hide details" : "+ Add note or group"}
            </Typography>
          </Pressable>
        </View>

        {showOptional && (
          <Animated.View
            entering={FadeInDown.duration(300)}
            style={{ paddingHorizontal: space.page, marginTop: 16, gap: 10 }}
          >
            <Typography
              style={{
                fontSize: 12,
                fontFamily: "IBMPlexSans_600SemiBold",
                color: color.muted,
                textTransform: "uppercase",
                letterSpacing: 0.8,
              }}
            >
              Note
            </Typography>
            <TextInput
              placeholder="Add a note..."
              placeholderTextColor={color.muted}
              value={note}
              onChangeText={setNote}
              style={{
                borderWidth: 1,
                borderColor: color.border,
                padding: 16,
                borderRadius: radius.pill,
                fontSize: 15,
                fontFamily: "IBMPlexSans_500Medium",
                color: color.text,
                backgroundColor: "transparent",
              }}
            />

            {sharedGroups.length > 0 && !isGroupRoute && (
              <View style={{ marginTop: 4, gap: 8 }}>
                <Typography
                  style={{
                    fontSize: 12,
                    fontFamily: "IBMPlexSans_600SemiBold",
                    color: color.muted,
                    textTransform: "uppercase",
                    letterSpacing: 0.8,
                  }}
                >
                  Link to group
                </Typography>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8 }}
                >
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setSelectedGroupId(undefined)}
                    style={({ pressed }) => ({
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderWidth: 1,
                      borderRadius: radius.pill,
                      borderColor: !selectedGroupId ? color.brand : color.border,
                      backgroundColor: !selectedGroupId ? color.brand : "transparent",
                      opacity: pressed ? 0.7 : 1,
                    })}
                  >
                    <Typography
                      style={{
                        fontSize: 13,
                        color: !selectedGroupId ? color.textInverse : color.text,
                        fontFamily: "IBMPlexSans_600SemiBold",
                      }}
                    >
                      None
                    </Typography>
                  </Pressable>
                  {sharedGroups.map((g) => {
                    const isSelected = selectedGroupId === g.id;
                    return (
                      <Pressable
                        key={g.id}
                        accessibilityRole="button"
                        onPress={() => setSelectedGroupId(g.id)}
                        style={({ pressed }) => ({
                          paddingHorizontal: 16,
                          paddingVertical: 10,
                          borderWidth: 1,
                          borderRadius: radius.pill,
                          borderColor: isSelected ? color.brand : color.border,
                          backgroundColor: isSelected ? color.brand : "transparent",
                          opacity: pressed ? 0.7 : 1,
                        })}
                      >
                        <Typography
                          style={{
                            fontSize: 13,
                            color: isSelected ? color.textInverse : color.text,
                            fontFamily: "IBMPlexSans_600SemiBold",
                          }}
                        >
                          {g.name}
                        </Typography>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </Animated.View>
        )}
      </ScrollView>

      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: space.page,
          paddingTop: 12,
          paddingBottom: Math.max(insets.bottom, 24),
          borderTopWidth: 1,
          borderTopColor: color.border,
          backgroundColor: color.bg,
          gap: 12,
        }}
      >
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            handleSubmitWithNavigation();
          }}
          disabled={isAddingSettlement || !parsedAmount}
          style={({ pressed }) => ({
            minHeight: 56,
            borderRadius: radius.pill,
            backgroundColor: color.ink,
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: 8,
            opacity: pressed || isAddingSettlement || !parsedAmount ? 0.78 : 1,
          })}
        >
          {isAddingSettlement ? <Spinner color={color.textInverse} size="sm" /> : null}
          <Typography
            style={{
              fontSize: 16,
              fontFamily: "IBMPlexSans_600SemiBold",
              color: color.textInverse,
            }}
          >
            Confirm payment
          </Typography>
        </Pressable>

        <Typography
          style={{
            fontSize: 12,
            fontFamily: "IBMPlexSans_500Medium",
            color: color.muted,
            textAlign: "center",
            lineHeight: 16,
            paddingHorizontal: 12,
          }}
        >
          Splt won&apos;t move money for cash payments. Both people will see the record.
        </Typography>
      </View>
    </KeyboardAvoidingView>
  );
}
