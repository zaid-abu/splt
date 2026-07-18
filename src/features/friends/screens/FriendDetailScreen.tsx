import { Alert, Typography } from "heroui-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { FriendRouteParams } from "@/types/navigation";
import type { JSX } from "react";
import { useMemo, useCallback } from "react";
import { ThemedStatusBar } from "@/components/ui/ThemedStatusBar";
import { View, ScrollView, Pressable, RefreshControl, StyleSheet } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView } from "@gorhom/bottom-sheet";
import * as Haptics from "expo-haptics";
import * as icons from "lucide-react-native";

import { ErrorState } from "@/components/ui/ErrorState";
import { useUI } from "@/components/ui";
import { formatAmount } from "@/components/ui/AmountDisplay";
import { Skeleton } from "@/components/ui/Skeleton";
import { BottomActionBar } from "@/components/ui/BottomActionBar";
import { FocusAwareView } from "@/components/animations/PageAnimator";

import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { useFriendDetail } from "@/features/friends/hooks/useFriendDetail";
import { FriendBalanceCard } from "@/features/friends/components/FriendBalanceCard";
import { FriendSharedGroups } from "@/features/friends/components/FriendSharedGroups";
import { FriendSpendingCategories } from "@/features/friends/components/FriendSpendingCategories";
import { FriendRecentActivity } from "@/features/friends/components/FriendRecentActivity";
import { OptionRow } from "@/features/friends/components/FriendOptionsSheet";

function LoadingState({ topInset }: { topInset: number }): JSX.Element {
  const { color, radius } = useUI();
  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      <ThemedStatusBar />
      <View
        style={{
          paddingTop: topInset + 16,
          paddingBottom: 24,
          paddingHorizontal: 24,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Skeleton width={44} height={44} radius={999} />
        <View style={{ alignItems: "center", gap: 8 }}>
          <Skeleton width={132} height={22} />
          <Skeleton width={84} height={14} />
        </View>
        <Skeleton width={44} height={44} radius={999} />
      </View>

      <View style={{ paddingHorizontal: 24, gap: 32 }}>
        <View
          style={{
            borderRadius: radius.lg,
            padding: 24,
            backgroundColor: color.surface,
            borderWidth: 1,
            borderColor: color.border,
          }}
        >
          <View style={{ alignItems: "center", gap: 14 }}>
            <Skeleton width={120} height={14} />
            <Skeleton width={188} height={42} />
            <View style={{ width: "72%" }}>
              <Skeleton height={16} />
            </View>
          </View>
        </View>
        <View style={{ gap: 12 }}>
          <Skeleton width={132} height={13} />
          <Skeleton height={72} />
          <Skeleton height={72} />
        </View>
      </View>
    </View>
  );
}

function NotFoundState({ onGoBack }: { onGoBack: () => void }): JSX.Element {
  const { color, radius } = useUI();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.bg }}>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
        <Alert status="danger" style={{ borderRadius: radius.lg, marginBottom: 16 }}>
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Friend not found</Alert.Title>
            <Alert.Description>We couldn&apos;t find this friend.</Alert.Description>
          </Alert.Content>
        </Alert>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onGoBack();
          }}
          style={{
            padding: 14,
            paddingHorizontal: 24,
            backgroundColor: color.brand,
            borderRadius: radius.pill,
          }}
        >
          <Typography style={{ color: color.textInverse, fontFamily: "IBMPlexSans_600SemiBold" }}>
            Go back
          </Typography>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

export default function FriendDetailScreen(): JSX.Element {
  const { color, radius } = useUI();
  const { id } = useLocalSearchParams<FriendRouteParams>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const {
    friend,
    isLoading,
    isError,
    refetchAll,
    refreshing,
    onRefresh,
    netBalance,
    isPositive,
    isSettled,
    directFriendship,
    sharedActivities,
    sharedGroupsWithRecentActivity,
    categorySpending,
    lastActivityCopy,
    preferredCurrency,
    optionsSheetRef,
    handleOpenOptions,
    handleShareBalance,
    handleRemind,
    handleShowContact,
    handleRemoveFriend,
  } = useFriendDetail(id);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: { flex: 1, backgroundColor: color.bg },
      }),
    [color.bg]
  );

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        pressBehavior="close"
        opacity={0.4}
      />
    ),
    []
  );

  if (isLoading && !friend) {
    return <LoadingState topInset={insets.top} />;
  }

  if (isError) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: color.bg }}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <ErrorState onRetry={refetchAll} />
        </View>
      </SafeAreaView>
    );
  }

  if (!friend) {
    return <NotFoundState onGoBack={() => router.back()} />;
  }

  return (
    <View style={styles.screen}>
      <ThemedStatusBar />

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View
        style={{
          paddingTop: insets.top + 16,
          paddingBottom: 24,
          paddingHorizontal: 24,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/people");
            }
          }}
          style={({ pressed }) => ({
            width: 44,
            height: 44,
            borderRadius: 999,
            backgroundColor: color.control,
            borderWidth: 1,
            borderColor: color.border,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.65 : 1,
          })}
        >
          <icons.ArrowLeft size={20} color={color.text} strokeWidth={1.8} />
        </Pressable>

        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
            flex: 1,
            marginHorizontal: 16,
          }}
        >
          <AppUserAvatar user={friend} size="sm" />
          <Typography
            numberOfLines={1}
            style={{
              fontFamily: "Sora_600SemiBold",
              fontSize: 24,
              color: color.text,
              flexShrink: 1,
              textAlign: "center",
              marginTop: 4,
            }}
          >
            {friend.name}
          </Typography>
          <Typography
            numberOfLines={1}
            style={{
              fontSize: 13,
              color: color.muted,
              fontFamily: "IBMPlexSans_500Medium",
              textAlign: "center",
              marginTop: 1,
            }}
          >
            {friend.email}
          </Typography>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Friend options"
          onPress={() => {
            Haptics.selectionAsync();
            handleOpenOptions();
          }}
          style={({ pressed }) => ({
            width: 44,
            height: 44,
            borderRadius: 999,
            backgroundColor: color.control,
            borderWidth: 1,
            borderColor: color.border,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.65 : 1,
          })}
        >
          <icons.MoreHorizontal size={20} color={color.text} strokeWidth={1.8} />
        </Pressable>
      </View>

      <FocusAwareView style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={color.text} />
          }
        >
          <FriendBalanceCard
            friendName={friend.name}
            netBalance={netBalance}
            isPositive={isPositive}
            isSettled={isSettled}
            lastActivityCopy={lastActivityCopy}
            currencyCode={preferredCurrency.code}
          />

          {sharedGroupsWithRecentActivity.length > 0 && (
            <FriendSharedGroups sharedGroupsWithRecentActivity={sharedGroupsWithRecentActivity} />
          )}

          {categorySpending.length > 0 && (
            <FriendSpendingCategories
              categorySpending={categorySpending}
              currencyCode={preferredCurrency.code}
            />
          )}

          <FriendRecentActivity sharedActivities={sharedActivities} />
        </ScrollView>
      </FocusAwareView>

      {/* ── Bottom Action Bar ──────────────────────────────────────────── */}
      <View style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}>
        <BottomActionBar>
          {!isSettled && (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (isPositive) {
                  handleRemind();
                } else {
                  router.push({
                    pathname: "/settle/[id]",
                    params: { id: friend.id },
                  });
                }
              }}
              style={({ pressed }) => ({
                flex: 1,
                height: 56,
                borderRadius: radius.pill,
                backgroundColor: color.control,
                borderWidth: 1,
                borderColor: color.border,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                gap: 10,
                opacity: pressed ? 0.65 : 1,
              })}
            >
              {isPositive ? (
                <icons.Bell size={20} color={color.text} strokeWidth={1.8} />
              ) : (
                <icons.Handshake size={20} color={color.text} strokeWidth={1.8} />
              )}
              <Typography
                style={{
                  fontSize: 16,
                  color: color.text,
                  fontFamily: "IBMPlexSans_600SemiBold",
                }}
              >
                {isPositive ? "Remind" : "Settle Up"}
              </Typography>
            </Pressable>
          )}

          <Pressable
            accessibilityRole="button"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push(`/expense/new?friendId=${friend.id}`);
            }}
            style={({ pressed }) => ({
              flex: isSettled ? 1 : 1.5,
              height: 56,
              borderRadius: radius.pill,
              backgroundColor: color.brand,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: 10,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <icons.Plus size={20} color={color.textInverse} strokeWidth={2.5} />
            <Typography
              style={{
                fontSize: 16,
                color: color.textInverse,
                fontFamily: "IBMPlexSans_600SemiBold",
              }}
            >
              Add Expense
            </Typography>
          </Pressable>
        </BottomActionBar>
      </View>

      <BottomSheetModal
        ref={optionsSheetRef}
        index={0}
        enableDynamicSizing={true}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: color.bg, borderRadius: 0 }}
        handleIndicatorStyle={{ backgroundColor: color.muted, width: 40 }}
      >
        <BottomSheetView
          style={{
            paddingHorizontal: 24,
            paddingTop: 24,
            paddingBottom: insets.bottom + 24,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
            <AppUserAvatar user={friend} size="md" balance={netBalance} />
            <View style={{ flex: 1, minWidth: 0, marginLeft: 14 }}>
              <Typography
                numberOfLines={1}
                style={{
                  fontSize: 22,
                  lineHeight: 27,
                  fontFamily: "IBMPlexSans_600SemiBold",
                  color: color.text,
                }}
              >
                {friend.name}
              </Typography>
              <Typography
                numberOfLines={1}
                style={{
                  marginTop: 3,
                  fontSize: 14,
                  lineHeight: 19,
                  fontFamily: "IBMPlexSans_500Medium",
                  color: color.muted,
                }}
              >
                {friend.email}
              </Typography>
            </View>
          </View>

          {isPositive && (
            <OptionRow
              icon={icons.Bell}
              label="Send reminder"
              description={`Ask ${friend.name.split(" ")[0]} to settle ${formatAmount(Math.abs(netBalance), preferredCurrency.code)}.`}
              onPress={() => {
                optionsSheetRef.current?.dismiss();
                handleRemind();
              }}
            />
          )}
          {!isSettled && !isPositive && (
            <OptionRow
              icon={icons.Handshake}
              label="Settle up"
              description={`Record a payment to clear what you owe ${friend.name.split(" ")[0]}.`}
              onPress={() => {
                optionsSheetRef.current?.dismiss();
                router.push({
                  pathname: "/settle/[id]",
                  params: { id: friend.id },
                });
              }}
            />
          )}
          <OptionRow
            icon={icons.Share2}
            label="Share balance"
            description="Send a plain-language balance summary."
            onPress={handleShareBalance}
          />
          <OptionRow
            icon={icons.Mail}
            label="Contact info"
            description="View the email attached to this friend."
            onPress={handleShowContact}
          />
          <OptionRow
            icon={icons.UserMinus}
            label={directFriendship ? "Remove friend" : "Shared group contact"}
            description={
              directFriendship
                ? "Remove the direct friendship without deleting shared history."
                : "This person appears because you share a group."
            }
            tone={directFriendship ? "danger" : "neutral"}
            onPress={handleRemoveFriend}
          />
        </BottomSheetView>
      </BottomSheetModal>
    </View>
  );
}
