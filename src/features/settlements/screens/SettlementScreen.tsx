import type { JSX } from "react";
import { View, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { Typography } from "heroui-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SettleRouteParams } from "@/types/navigation";
import { ThemedStatusBar } from "@/components/ui/ThemedStatusBar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { useAuth } from "@/context/AppContext";
import { useUI, ScreenHeader } from "@/components/ui";
import { Skeleton } from "@/components/ui/Skeleton";

import { useSettlement } from "../hooks/useSettlement";
import { SettlementParties } from "../components/SettlementParties";
import { SettlementAmount } from "../components/SettlementAmount";
import { SettlementConfirmation, SettlementStickySubmit } from "../components/SettlementConfirmation";

export default function SettleUpScreen(): JSX.Element {
  const { color, radius } = useUI();
  const params = useLocalSearchParams<SettleRouteParams>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();

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
        <ScreenHeader title="Settle Up" onBackPress={handleBack} />
        <View style={{ padding: 24, gap: 24 }}>
          <View
            style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
          >
            <View style={{ alignItems: "center", gap: 8 }}>
              <Skeleton width={80} height={80} radius={999} />
              <Skeleton width={60} height={14} />
            </View>
            <Skeleton width={100} height={36} radius={999} />
            <View style={{ alignItems: "center", gap: 8 }}>
              <Skeleton width={80} height={80} radius={999} />
              <Skeleton width={60} height={14} />
            </View>
          </View>
          <View style={{ alignItems: "center", gap: 12 }}>
            <Skeleton height={14} />
            <Skeleton width={200} height={48} />
          </View>
          <View>
            <Skeleton height={14} />
            <Skeleton height={56} />
          </View>
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
        }}
      >
        <Typography
          style={{ fontSize: 18, color: color.text, fontFamily: "IBMPlexSans_500Medium" }}
        >
          {isGroupRoute ? "All settled up!" : "Friend not found"}
        </Typography>
        <View
          style={{ marginTop: 16, padding: 14, paddingHorizontal: 24, backgroundColor: color.brand, borderRadius: radius.pill }}
          onTouchEnd={handleBack}
        >
          <Typography
            style={{ color: color.textInverse, fontFamily: "IBMPlexSans_600SemiBold" }}
          >
            Go Back
          </Typography>
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
        <ScreenHeader title="Settle Up" onBackPress={handleBack} />
      </View>

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <SettlementParties
          leftUser={leftUser}
          rightUser={rightUser}
          leftName={leftName}
          rightName={rightName}
          direction={direction}
          isGroupRoute={isGroupRoute}
          debtOptions={debtOptions}
          combinedFriends={combinedFriends}
          targetGroup={targetGroup}
          showRecipientSelector={showRecipientSelector}
          selectedFriendId={selectedFriendId}
          onSwap={() => setDirection((prev) => (prev === "you" ? "them" : "you"))}
          onToggleRecipientSelector={() => setShowRecipientSelector(!showRecipientSelector)}
          onSelectFriend={(friendId, amount) => {
            setSelectedFriendId(friendId);
            setShowRecipientSelector(false);
            setAmountStr(amount.toFixed(2));
          }}
        />

        <SettlementAmount
          amountStr={amountStr}
          settlementCurrency={settlementCurrency}
          settlementCurrencyObj={settlementCurrencyObj}
          netBalance={netBalance}
          preferredCurrencyCode={settlementCurrencyObj.code}
          onAmountChange={handleAmountChange}
          onSetFullBalance={() => setAmountStr(Math.abs(netBalance).toFixed(2))}
          onSetHalfBalance={() => setAmountStr((Math.abs(netBalance) / 2).toFixed(2))}
        />

        <SettlementConfirmation
          showOptional={showOptional}
          note={note}
          sharedGroups={sharedGroups}
          isGroupRoute={isGroupRoute}
          selectedGroupId={selectedGroupId}
          onToggleOptional={() => setShowOptional(!showOptional)}
          onNoteChange={setNote}
          onGroupSelect={setSelectedGroupId}
        />
      </ScrollView>

      <SettlementStickySubmit
        leftName={leftName}
        rightName={rightName}
        parsedAmount={parsedAmount}
        settlementCurrencyObj={settlementCurrencyObj}
        isAddingSettlement={isAddingSettlement}
        onSubmit={handleSubmitWithNavigation}
        bottomInset={insets.bottom}
      />
    </KeyboardAvoidingView>
  );
}
