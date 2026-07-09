import DateTimePicker from "react-native-ui-datepicker";
import dayjs from "dayjs";
import type { JSX, ReactNode } from "react";
import { useCallback, useMemo, useRef, useState } from "react";
import { Keyboard, Pressable, View } from "react-native";
import { ScrollView, GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
  BottomSheetTextInput,
  BottomSheetView,
  BottomSheetFooter,
} from "@gorhom/bottom-sheet";
import { Popover, Spinner, Typography } from "heroui-native";
import * as Haptics from "expo-haptics";
import * as icons from "lucide-react-native";

import { CurrencySelector } from "@/components/forms/CurrencySelector";
import { formatAmount } from "@/components/ui/AmountDisplay";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { useAuth } from "@/context/AppContext";
import {
  ExpenseFormParticipants,
  ExpenseSelectionTabs,
} from "@/features/expenses/components/ExpenseFormParticipants";
import { useExpenseForm } from "@/features/expenses/hooks/useExpenseForm";
import {
  useAddExpense,
  useUpdateExpense,
  useUserExpenses,
  useExpenseDetails,
} from "@/features/expenses/queries/useExpenses";
import { useFriends } from "@/features/friends/queries/useFriends";
import { useGroups } from "@/features/groups/queries/useGroups";
import { useAppToast } from "@/hooks/useAppToast";
import { useUIStore } from "@/store/useUIStore";
import { EXPENSE_CATEGORIES } from "@/types";
import type { ExpenseCategory, SplitMethod, User } from "@/types";
import type { ExpenseNewRouteParams } from "@/types/navigation";

const BG = "#F5F0EB";
const SURFACE = "#FFFCF8";
const CONTROL = "#FFFFFF";
const TEXT_PRIMARY = "#000000";
const TEXT_SECONDARY = "#8A8782";
const TEXT_SUCCESS = "#4CAF82";
const TEXT_DANGER = "#E85D5D";
const SEPARATOR = "#E8E4DF";
const BRAND = "#8C7A6B";
const CARD_RADIUS = 18;
const PILL_RADIUS = 999;

const SPLIT_METHODS: { key: SplitMethod; label: string; icon: keyof typeof icons }[] = [
  { key: "equal", label: "Equal", icon: "Users" },
  { key: "custom", label: "Custom", icon: "SlidersHorizontal" },
  { key: "percentage", label: "Percent", icon: "Percent" },
];

function SectionTitle({ children }: { children: string }): JSX.Element {
  return (
    <Typography
      style={{
        fontSize: 11,
        letterSpacing: 1.2,
        color: TEXT_SECONDARY,
        textTransform: "uppercase",
        fontFamily: "IBMPlexSans_600SemiBold",
        marginBottom: 12,
      }}
    >
      {children}
    </Typography>
  );
}

function SurfaceCard({
  children,
  padded = true,
}: {
  children: ReactNode;
  padded?: boolean;
}): JSX.Element {
  return (
    <View
      style={{
        backgroundColor: SURFACE,
        borderWidth: 1,
        borderColor: SEPARATOR,
        borderRadius: CARD_RADIUS,
        padding: padded ? 16 : 0,
      }}
    >
      {children}
    </View>
  );
}

function HeaderButton({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof icons;
  label: string;
  onPress: () => void;
}): JSX.Element {
  const Icon = (icons as any)[icon] || icons.Circle;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={10}
      style={({ pressed }) => ({
        width: 40,
        height: 40,
        borderRadius: PILL_RADIUS,
        backgroundColor: CONTROL,
        borderWidth: 1,
        borderColor: SEPARATOR,
        alignItems: "center",
        justifyContent: "center",
        opacity: pressed ? 0.65 : 1,
      })}
    >
      <Icon size={18} color={TEXT_PRIMARY} strokeWidth={1.9} />
    </Pressable>
  );
}

function Chip({
  active,
  label,
  icon,
  onPress,
}: {
  active: boolean;
  label: string;
  icon?: keyof typeof icons;
  onPress: () => void;
}): JSX.Element {
  const Icon = icon ? ((icons as any)[icon] || icons.Circle) : null;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        height: 42,
        paddingHorizontal: 14,
        borderRadius: PILL_RADIUS,
        borderWidth: 1,
        borderColor: active ? TEXT_PRIMARY : SEPARATOR,
        backgroundColor: active ? TEXT_PRIMARY : CONTROL,
        opacity: pressed ? 0.72 : 1,
      })}
    >
      {Icon ? <Icon size={16} color={active ? "#FFFFFF" : TEXT_PRIMARY} strokeWidth={1.8} /> : null}
      <Typography
        style={{
          fontSize: 14,
          color: active ? "#FFFFFF" : TEXT_PRIMARY,
          fontFamily: "IBMPlexSans_600SemiBold",
        }}
      >
        {label}
      </Typography>
    </Pressable>
  );
}

function SummaryCard({
  amount,
  currency,
  participantsCount,
  includedCount,
  equalShare,
  splitMethod,
  remainingCustom,
  remainingPercent,
}: {
  amount: number;
  currency: string;
  participantsCount: number;
  includedCount: number;
  equalShare: number;
  splitMethod: SplitMethod;
  remainingCustom: number;
  remainingPercent: number;
}): JSX.Element {
  const balanced =
    splitMethod === "equal" ||
    (splitMethod === "custom" && remainingCustom === 0) ||
    (splitMethod === "percentage" && remainingPercent === 0);

  return (
    <SurfaceCard>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View style={{ flex: 1 }}>
          <Typography
            style={{
              fontSize: 11,
              color: TEXT_SECONDARY,
              letterSpacing: 1.1,
              textTransform: "uppercase",
              fontFamily: "IBMPlexSans_600SemiBold",
            }}
          >
            Split preview
          </Typography>
          <Typography
            style={{
              marginTop: 4,
              fontSize: 22,
              color: TEXT_PRIMARY,
              fontFamily: "Sora_600SemiBold",
            }}
          >
            {amount > 0 ? formatAmount(amount, currency) : "Enter an amount"}
          </Typography>
        </View>
        <View
          style={{
            height: 32,
            paddingHorizontal: 12,
            borderRadius: PILL_RADIUS,
            borderWidth: 1,
            borderColor: SEPARATOR,
            backgroundColor: balanced ? "#F5FCF8" : "#FFF7F5",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography
            style={{
              fontSize: 12,
              color: balanced ? TEXT_SUCCESS : TEXT_DANGER,
              fontFamily: "IBMPlexSans_600SemiBold",
            }}
          >
            {balanced ? "Balanced" : "Needs split"}
          </Typography>
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
        <View style={{ flex: 1 }}>
          <Typography
            style={{ fontSize: 12, color: TEXT_SECONDARY, fontFamily: "IBMPlexSans_500Medium" }}
          >
            People
          </Typography>
          <Typography
            style={{ marginTop: 2, fontSize: 18, color: TEXT_PRIMARY, fontFamily: "IBMPlexSans_600SemiBold" }}
          >
            {includedCount}/{participantsCount}
          </Typography>
        </View>
        <View style={{ flex: 1 }}>
          <Typography
            style={{ fontSize: 12, color: TEXT_SECONDARY, fontFamily: "IBMPlexSans_500Medium" }}
          >
            Each
          </Typography>
          <Typography
            style={{ marginTop: 2, fontSize: 18, color: TEXT_PRIMARY, fontFamily: "IBMPlexSans_600SemiBold" }}
          >
            {amount > 0 && splitMethod === "equal" ? formatAmount(equalShare, currency) : "-"}
          </Typography>
        </View>
        <View style={{ flex: 1 }}>
          <Typography
            style={{ fontSize: 12, color: TEXT_SECONDARY, fontFamily: "IBMPlexSans_500Medium" }}
          >
            Method
          </Typography>
          <Typography
            style={{
              marginTop: 2,
              fontSize: 18,
              color: TEXT_PRIMARY,
              fontFamily: "IBMPlexSans_600SemiBold",
              textTransform: "capitalize",
            }}
          >
            {splitMethod}
          </Typography>
        </View>
      </View>
    </SurfaceCard>
  );
}

export default function NewExpenseScreen(): JSX.Element {
  const {
    groupId: initialGroupId,
    friendId: initialFriendId,
    expenseId,
  } = useLocalSearchParams<ExpenseNewRouteParams>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();
  const { data: groups = [] } = useGroups(currentUser?.id);
  const { data: friends = [] } = useFriends(currentUser?.id);
  const { data: expenses = [] } = useUserExpenses(currentUser?.id);
  const { data: expenseDetail } = useExpenseDetails(expenseId);
  const { mutateAsync: addExpense } = useAddExpense();
  const { mutateAsync: updateExpense } = useUpdateExpense();
  const preferredCurrency = useUIStore((s) => s.preferredCurrency);
  const setCurrency = useUIStore((s) => s.setCurrency);
  const { toast } = useAppToast();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { state, actions } = useExpenseForm({
    currentUser,
    groups,
    friends,
    expenses,
    expenseDetail,
    initialGroupId,
    initialFriendId,
    expenseId,
    preferredCurrency,
    setCurrency,
    addExpense,
    updateExpense,
    router,
    toast,
  });

  const snapPoints = useMemo(() => ["92%"], []);
  const hasSelection = !!state.selectedGroup || state.selectedFriends.length > 0;
  const hasContext = hasSelection && state.selectionConfirmed;
  const canChangeContext = !initialGroupId && !initialFriendId && !state.existingExpense;
  const selectedContextName = state.selectedGroup
    ? state.selectedGroup.name
    : state.selectedFriends.map((friend) => friend.name.split(" ")[0]).join(", ");
  const category = EXPENSE_CATEGORIES.find((item) => item.key === state.category);
  const CategoryIcon = category ? ((icons as any)[category.icon] || icons.ReceiptText) : icons.ReceiptText;

  const handleDismiss = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)");
    }
  }, [router]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.42}
        pressBehavior="close"
      />
    ),
    []
  );

  const closeSheet = useCallback(() => {
    Keyboard.dismiss();
    bottomSheetRef.current?.close();
  }, []);

  const handlePrimaryPress = useCallback(async () => {
    if (!hasSelection) return;

    if (!hasContext) {
      actions.setSelectionConfirmed(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    }

    setIsSubmitting(true);
    await actions.handleSubmit();
    setIsSubmitting(false);
  }, [actions, hasContext, hasSelection]);

  const renderFooter = useCallback(
    (props: any) => (
      <BottomSheetFooter {...props} bottomInset={0}>
        <View
          style={{
            paddingHorizontal: 24,
            paddingTop: 12,
            paddingBottom: Math.max(insets.bottom, 16),
            borderTopWidth: 1,
            borderTopColor: SEPARATOR,
            backgroundColor: BG,
          }}
        >
          <Pressable
            accessibilityRole="button"
            onPress={handlePrimaryPress}
            disabled={!hasSelection || state.loading || isSubmitting}
            style={({ pressed }) => ({
              height: 56,
              borderRadius: PILL_RADIUS,
              backgroundColor: !hasSelection ? SEPARATOR : BRAND,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              opacity: pressed || state.loading || isSubmitting ? 0.82 : 1,
            })}
          >
            {state.loading || isSubmitting ? (
              <Spinner color="white" size="sm" style={{ marginRight: 8 }} />
            ) : null}
            <Typography
              style={{
                fontSize: 16,
                color: !hasSelection ? TEXT_SECONDARY : "#FFFFFF",
                fontFamily: "IBMPlexSans_600SemiBold",
              }}
            >
              {!hasSelection
                ? "Choose friends or a group"
                : !hasContext
                  ? "Continue"
                  : state.existingExpense
                    ? "Save changes"
                    : "Add expense"}
            </Typography>
          </Pressable>
        </View>
      </BottomSheetFooter>
    ),
    [
      insets.bottom,
      handlePrimaryPress,
      hasSelection,
      state.loading,
      isSubmitting,
      hasContext,
      state.existingExpense,
    ]
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />

      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        enableDynamicSizing={false}
        enablePanDownToClose={false}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
        backdropComponent={renderBackdrop}
        onClose={handleDismiss}
        handleIndicatorStyle={{ backgroundColor: "#D6D2CD", width: 40 }}
        backgroundStyle={{ backgroundColor: BG, borderRadius: 0 }}
        footerComponent={renderFooter}
      >
        <BottomSheetView style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 24,
              paddingBottom: 16,
              borderBottomWidth: 1,
              borderBottomColor: SEPARATOR,
            }}
          >
            <View style={{ flex: 1 }}>
              <Typography
                style={{
                  fontSize: 11,
                  color: TEXT_SECONDARY,
                  letterSpacing: 1.1,
                  textTransform: "uppercase",
                  fontFamily: "IBMPlexSans_600SemiBold",
                }}
              >
                {state.existingExpense ? "Edit expense" : "New expense"}
              </Typography>
            </View>

            <Typography
              numberOfLines={1}
              style={{
                maxWidth: 180,
                fontSize: 17,
                color: TEXT_PRIMARY,
                fontFamily: "IBMPlexSans_600SemiBold",
              }}
            >
              {hasContext ? selectedContextName : "Choose people"}
            </Typography>

            <View style={{ flex: 1, alignItems: "flex-end" }}>
              <HeaderButton icon="X" label="Close expense sheet" onPress={closeSheet} />
            </View>
          </View>

          <BottomSheetScrollView
            style={{ flex: 1 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 24,
              paddingTop: 24,
              paddingBottom: 120, // ample space for the fixed footer
              gap: 24,
            }}
          >
            {!hasContext ? (
              <ExpenseSelectionTabs
                selectionTab={state.selectionTab}
                setSelectionTab={actions.setSelectionTab}
                searchQuery={state.searchQuery}
                setSearchQuery={actions.setSearchQuery}
                selectedFriendIds={state.selectedFriendIds}
                setSelectedFriendIds={actions.setSelectedFriendIds}
                selectedGroupId={state.selectedGroupId}
                setSelectedGroupId={actions.setSelectedGroupId}
                filteredFriends={state.filteredFriends}
                filteredGroups={state.filteredGroups}
                selectedFriends={state.selectedFriends}
                uniqueFriends={state.uniqueFriends}
                groups={groups}
              />
            ) : (
              <>
                <SurfaceCard>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <View
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: 14,
                        borderWidth: 1,
                        borderColor: SEPARATOR,
                        backgroundColor: CONTROL,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {state.selectedGroup ? (
                        <icons.Users size={19} color={TEXT_PRIMARY} strokeWidth={1.8} />
                      ) : (
                        <icons.User size={19} color={TEXT_PRIMARY} strokeWidth={1.8} />
                      )}
                    </View>

                    <View style={{ flex: 1 }}>
                      <Typography
                        numberOfLines={1}
                        style={{
                          fontSize: 19,
                          color: TEXT_PRIMARY,
                          fontFamily: "IBMPlexSans_600SemiBold",
                        }}
                      >
                        {selectedContextName}
                      </Typography>
                      <Typography
                        style={{
                          marginTop: 3,
                          fontSize: 13,
                          color: TEXT_SECONDARY,
                          fontFamily: "IBMPlexSans_500Medium",
                        }}
                      >
                        {state.participants.length} people • {state.expenseCurrency}
                      </Typography>
                    </View>

                    {canChangeContext ? (
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => {
                          actions.setSelectedGroupId("");
                          actions.setSelectedFriendIds([]);
                          actions.setSelectionConfirmed(false);
                        }}
                        style={({ pressed }) => ({
                          height: 36,
                          paddingHorizontal: 14,
                          borderRadius: PILL_RADIUS,
                          borderWidth: 1,
                          borderColor: SEPARATOR,
                          alignItems: "center",
                          justifyContent: "center",
                          opacity: pressed ? 0.65 : 1,
                        })}
                      >
                        <Typography
                          style={{
                            fontSize: 13,
                            color: TEXT_PRIMARY,
                            fontFamily: "IBMPlexSans_600SemiBold",
                          }}
                        >
                          Change
                        </Typography>
                      </Pressable>
                    ) : null}
                  </View>
                </SurfaceCard>

                <SurfaceCard>
                  <View style={{ alignItems: "center" }}>
                    <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 8 }}>
                      <Typography
                        style={{
                          paddingBottom: 10,
                          fontSize: 24,
                          color: TEXT_SECONDARY,
                          fontFamily: "IBMPlexSans_600SemiBold",
                        }}
                      >
                        {state.expenseCurrency}
                      </Typography>
                      <BottomSheetTextInput
                        value={state.amount}
                        onChangeText={actions.setAmount}
                        placeholder="0.00"
                        placeholderTextColor={TEXT_SECONDARY}
                        keyboardType="decimal-pad"
                        style={{
                          minWidth: 140,
                          maxWidth: 240,
                          fontSize: 58,
                          lineHeight: 64,
                          textAlign: "center",
                          color: TEXT_PRIMARY,
                          fontFamily: "Sora_600SemiBold",
                        }}
                      />
                    </View>

                    <BottomSheetTextInput
                      value={state.title}
                      onChangeText={actions.setTitle}
                      placeholder="What was it for?"
                      placeholderTextColor={TEXT_SECONDARY}
                      autoCapitalize="sentences"
                      style={{
                        width: "100%",
                        height: 52,
                        marginTop: 8,
                        borderRadius: PILL_RADIUS,
                        borderWidth: 1,
                        borderColor: SEPARATOR,
                        backgroundColor: CONTROL,
                        paddingHorizontal: 18,
                        fontSize: 17,
                        color: TEXT_PRIMARY,
                        fontFamily: "IBMPlexSans_600SemiBold",
                        textAlign: "center",
                      }}
                    />
                  </View>
                </SurfaceCard>

                <SummaryCard
                  amount={state.parsedAmount}
                  currency={state.expenseCurrency}
                  participantsCount={state.participants.length}
                  includedCount={state.includedMembers.length}
                  equalShare={state.equalShare}
                  splitMethod={state.splitMethod}
                  remainingCustom={state.remainingCustom}
                  remainingPercent={state.remainingPercent}
                />

                <View>
                  <SectionTitle>Details</SectionTitle>
                  <View style={{ gap: 12 }}>
                    <CurrencySelector
                      value={state.expenseCurrency}
                      onChange={(currency) => {
                        actions.setExpenseCurrency(currency.code);
                        if (!state.selectedGroup) actions.setCurrency(currency);
                      }}
                    />

                    <Popover isOpen={state.showDatePicker} onOpenChange={actions.setShowDatePicker}>
                      <Popover.Trigger asChild>
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => actions.setShowDatePicker(true)}
                          style={({ pressed }) => ({
                            minHeight: 54,
                            borderRadius: CARD_RADIUS,
                            borderWidth: 1,
                            borderColor: SEPARATOR,
                            backgroundColor: CONTROL,
                            paddingHorizontal: 16,
                            flexDirection: "row",
                            alignItems: "center",
                            opacity: pressed ? 0.72 : 1,
                          })}
                        >
                          <icons.Calendar size={18} color={TEXT_PRIMARY} strokeWidth={1.8} />
                          <Typography
                            style={{
                              flex: 1,
                              marginLeft: 12,
                              fontSize: 15,
                              color: TEXT_PRIMARY,
                              fontFamily: "IBMPlexSans_600SemiBold",
                            }}
                          >
                            {dayjs(state.expenseDate).format("MMMM D, YYYY")}
                          </Typography>
                          <icons.ChevronDown size={18} color={TEXT_SECONDARY} strokeWidth={1.8} />
                        </Pressable>
                      </Popover.Trigger>
                      <Popover.Portal>
                        <Popover.Overlay />
                        <Popover.Content
                          presentation="popover"
                          placement="top"
                          width={340}
                          className="bg-[#F5F0EB] rounded-2xl p-2 border border-[#E8E4DF] shadow-lg"
                        >
                          <Popover.Arrow fill="#F5F0EB" />
                          <DateTimePicker
                            mode="single"
                            date={dayjs(state.expenseDate)}
                            onChange={(params: any) => {
                              if (params.date) {
                                actions.setExpenseDate(dayjs(params.date).toDate());
                                setTimeout(() => actions.setShowDatePicker(false), 200);
                              }
                            }}
                            styles={{
                              selected: { backgroundColor: TEXT_PRIMARY, borderRadius: 999 },
                              today: { backgroundColor: SEPARATOR, borderRadius: 999 },
                              day_label: { color: TEXT_PRIMARY, fontSize: 15 },
                              header: { paddingBottom: 12 },
                              month_selector_label: { color: TEXT_PRIMARY, fontSize: 16 },
                              year_selector_label: { color: TEXT_PRIMARY, fontSize: 16 },
                              weekday_label: { color: TEXT_SECONDARY },
                            }}
                          />
                        </Popover.Content>
                      </Popover.Portal>
                    </Popover>
                  </View>
                </View>

                <View>
                  <SectionTitle>Category</SectionTitle>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 16,
                        borderWidth: 1,
                        borderColor: SEPARATOR,
                        backgroundColor: CONTROL,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <CategoryIcon size={20} color={TEXT_PRIMARY} strokeWidth={1.8} />
                    </View>

                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      keyboardShouldPersistTaps="handled"
                    >
                      <View style={{ flexDirection: "row", gap: 8, paddingRight: 8 }}>
                        {EXPENSE_CATEGORIES.map((item) => (
                          <Chip
                            key={item.key}
                            active={state.category === item.key}
                            icon={(item.icon as keyof typeof icons) || "ReceiptText"}
                            label={item.label.replace(" & Drink", "")}
                            onPress={() => actions.setCategory(item.key as ExpenseCategory)}
                          />
                        ))}
                      </View>
                    </ScrollView>
                  </View>
                </View>

                <View>
                  <SectionTitle>Paid by</SectionTitle>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                  >
                    <View style={{ flexDirection: "row", gap: 8, paddingRight: 8 }}>
                      {state.participants.map((participant) => (
                        <Pressable
                          key={participant.id}
                          accessibilityRole="button"
                          onPress={() => {
                            Haptics.selectionAsync();
                            actions.setPaidBy(participant.id);
                          }}
                          style={({ pressed }) => ({
                            height: 46,
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 8,
                            paddingLeft: 5,
                            paddingRight: 14,
                            borderRadius: PILL_RADIUS,
                            borderWidth: 1,
                            borderColor: state.paidBy === participant.id ? TEXT_PRIMARY : SEPARATOR,
                            backgroundColor: state.paidBy === participant.id ? TEXT_PRIMARY : CONTROL,
                            opacity: pressed ? 0.72 : 1,
                          })}
                        >
                          <AppUserAvatar user={participant} size="sm" />
                          <Typography
                            style={{
                              fontSize: 14,
                              color: state.paidBy === participant.id ? "#FFFFFF" : TEXT_PRIMARY,
                              fontFamily: "IBMPlexSans_600SemiBold",
                            }}
                          >
                            {participant.id === currentUser.id ? "You" : participant.name.split(" ")[0]}
                          </Typography>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>
                </View>

                <View>
                  <SectionTitle>Split method</SectionTitle>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    {SPLIT_METHODS.map((method) => (
                      <View key={method.key} style={{ flex: 1 }}>
                        <Chip
                          active={state.splitMethod === method.key}
                          icon={method.icon}
                          label={method.label}
                          onPress={() => actions.setSplitMethod(method.key)}
                        />
                      </View>
                    ))}
                  </View>
                </View>

                <ExpenseFormParticipants
                  participants={state.participants}
                  included={state.included}
                  setIncluded={actions.setIncluded}
                  splitMethod={state.splitMethod}
                  parsedAmount={state.parsedAmount}
                  remainingCustom={state.remainingCustom}
                  remainingPercent={state.remainingPercent}
                  expenseCurrency={state.expenseCurrency}
                  equalShare={state.equalShare}
                  customAmounts={state.customAmounts}
                  setCustomAmounts={actions.setCustomAmounts}
                  customPercentages={state.customPercentages}
                  setCustomPercentages={actions.setCustomPercentages}
                  currentUserId={currentUser.id}
                />
              </>
            )}
          </BottomSheetScrollView>
        </BottomSheetView>
      </BottomSheet>
    </GestureHandlerRootView>
  );
}
