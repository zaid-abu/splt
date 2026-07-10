import DateTimePicker from "react-native-ui-datepicker";
import dayjs from "dayjs";
import type { JSX, ReactNode } from "react";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Typography } from "heroui-native";
import * as Haptics from "expo-haptics";
import * as icons from "lucide-react-native";

import { formatAmount } from "@/components/ui/AmountDisplay";
import { CategoryIconBadge } from "@/components/ui/CategoryIconBadge";
import { GroupIconBadge } from "@/components/ui/GroupIconBadge";
import { AppUserAvatar, AvatarStack } from "@/components/ui/MemberAvatar";
import { useAuth } from "@/context/AppContext";
import { useExpenseForm } from "@/features/expenses/hooks/useExpenseForm";
import {
  useAddExpense,
  useExpenseDetails,
  useUpdateExpense,
  useUserExpenses,
} from "@/features/expenses/queries/useExpenses";
import { useFriends } from "@/features/friends/queries/useFriends";
import { useGroups } from "@/features/groups/queries/useGroups";
import { useAppToast } from "@/hooks/useAppToast";
import { useUIStore } from "@/store/useUIStore";
import { CURRENCIES, EXPENSE_CATEGORIES } from "@/types";
import type { Currency, ExpenseCategory, Group, SplitMethod, User } from "@/types";
import type { ExpenseNewRouteParams } from "@/types/navigation";

const BG = "#F7F6F1";
const SURFACE = "#FEFDFA";
const CONTROL = "#FFFFFF";
const TEXT = "#1A1A1A";
const MUTED = "#6E6D68";
const BORDER = "#E7E5DE";
const BORDER_SOFT = "#EDEBE4";
const PRESSED = "#FBF7F2";
const BRAND = "#8C7A6B";
const SUCCESS = "#4CAF82";
const DANGER = "#E85D5D";
const WARNING_BG = "#FFF7F5";
const SUCCESS_BG = "#F5FCF8";
const CARD_RADIUS = 16;
const INNER_RADIUS = 12;
const PILL = 999;

const SPLIT_METHODS: {
  key: SplitMethod;
  label: string;
  helper: string;
  icon: keyof typeof icons;
}[] = [
  { key: "equal", label: "Equal", helper: "Same share", icon: "Users" },
  { key: "custom", label: "Custom", helper: "Exact amounts", icon: "SlidersHorizontal" },
  { key: "percentage", label: "Percent", helper: "By percent", icon: "Percent" },
];

const QUICK_CURRENCIES = ["USD", "EUR", "GBP", "INR", "JPY"];

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
      hitSlop={10}
      onPress={onPress}
      style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}
    >
      <Icon size={19} color={TEXT} strokeWidth={1.85} />
    </Pressable>
  );
}

function Section({
  label,
  action,
  children,
}: {
  label: string;
  action?: ReactNode;
  children: ReactNode;
}): JSX.Element {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Typography style={styles.sectionLabel}>{label}</Typography>
        {action}
      </View>
      {children}
    </View>
  );
}

function SurfaceCard({ children, style }: { children: ReactNode; style?: object }): JSX.Element {
  return <View style={[styles.surfaceCard, style]}>{children}</View>;
}

function SearchField({
  value,
  onChangeText,
}: {
  value: string;
  onChangeText: (value: string) => void;
}): JSX.Element {
  return (
    <View style={styles.searchField}>
      <icons.Search size={18} color={MUTED} strokeWidth={1.8} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Search friends or groups"
        placeholderTextColor={MUTED}
        returnKeyType="search"
        style={styles.searchInput}
      />
      {value.length > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          hitSlop={8}
          onPress={() => onChangeText("")}
        >
          <icons.XCircle size={18} color={MUTED} strokeWidth={1.8} />
        </Pressable>
      ) : null}
    </View>
  );
}

function SegmentedTabs({
  value,
  onChange,
}: {
  value: "friends" | "groups";
  onChange: (value: "friends" | "groups") => void;
}): JSX.Element {
  return (
    <View style={styles.segmented}>
      {(["friends", "groups"] as const).map((tab) => {
        const active = value === tab;
        return (
          <Pressable
            key={tab}
            accessibilityRole="button"
            onPress={() => {
              Haptics.selectionAsync();
              onChange(tab);
            }}
            style={({ pressed }) => [
              styles.segment,
              active && styles.segmentActive,
              pressed && styles.pressed,
            ]}
          >
            <Typography style={[styles.segmentText, active && styles.segmentTextActive]}>
              {tab === "friends" ? "Friends" : "Groups"}
            </Typography>
          </Pressable>
        );
      })}
    </View>
  );
}

function ContextPicker({
  selectionTab,
  setSelectionTab,
  searchQuery,
  setSearchQuery,
  filteredFriends,
  filteredGroups,
  selectedFriendIds,
  setSelectedFriendIds,
  selectedGroupId,
  setSelectedGroupId,
  selectedFriends,
}: {
  selectionTab: "friends" | "groups";
  setSelectionTab: (value: "friends" | "groups") => void;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  filteredFriends: User[];
  filteredGroups: Group[];
  selectedFriendIds: string[];
  setSelectedFriendIds: (value: string[] | ((prev: string[]) => string[])) => void;
  selectedGroupId: string;
  setSelectedGroupId: (value: string | ((prev: string) => string)) => void;
  selectedFriends: User[];
}): JSX.Element {
  const rows = selectionTab === "friends" ? filteredFriends : filteredGroups;

  return (
    <View style={styles.contextBlock}>
      <SurfaceCard style={styles.contextIntro}>
        <View style={styles.contextIntroIcon}>
          <icons.ReceiptText size={22} color={TEXT} strokeWidth={1.8} />
        </View>
        <View style={{ flex: 1 }}>
          <Typography style={styles.contextIntroTitle}>Who is this expense with?</Typography>
          <Typography style={styles.contextIntroText}>
            Choose one group or any number of friends before entering the amount.
          </Typography>
        </View>
      </SurfaceCard>

      <SearchField value={searchQuery} onChangeText={setSearchQuery} />
      <SegmentedTabs value={selectionTab} onChange={setSelectionTab} />

      {selectedFriends.length > 0 && !selectedGroupId ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.selectedChipRow}>
            {selectedFriends.map((friend) => (
              <Pressable
                key={friend.id}
                accessibilityRole="button"
                onPress={() =>
                  setSelectedFriendIds((prev) => prev.filter((friendId) => friendId !== friend.id))
                }
                style={({ pressed }) => [styles.selectedChip, pressed && styles.pressed]}
              >
                <AppUserAvatar user={friend} size="sm" />
                <Typography style={styles.selectedChipText}>{friend.name.split(" ")[0]}</Typography>
                <icons.X size={15} color={MUTED} strokeWidth={1.9} />
              </Pressable>
            ))}
          </View>
        </ScrollView>
      ) : null}

      <View style={styles.listCard}>
        {rows.length === 0 ? (
          <View style={styles.emptyList}>
            <Typography style={styles.emptyTitle}>No matches</Typography>
            <Typography style={styles.emptyText}>Try a different search term.</Typography>
          </View>
        ) : null}

        {selectionTab === "friends"
          ? filteredFriends.map((friend, index) => {
              const selected = selectedFriendIds.includes(friend.id);
              return (
                <Pressable
                  key={friend.id}
                  accessibilityRole="button"
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedGroupId("");
                    setSelectedFriendIds((prev) =>
                      prev.includes(friend.id)
                        ? prev.filter((friendId) => friendId !== friend.id)
                        : [...prev, friend.id]
                    );
                  }}
                  style={({ pressed }) => [
                    styles.contextRow,
                    index < filteredFriends.length - 1 && styles.rowDivider,
                    pressed && styles.rowPressed,
                  ]}
                >
                  <AppUserAvatar user={friend} size="md" />
                  <View style={styles.rowText}>
                    <Typography numberOfLines={1} style={styles.rowTitle}>
                      {friend.name}
                    </Typography>
                    <Typography style={styles.rowMeta}>Friend</Typography>
                  </View>
                  <SelectionMark selected={selected} />
                </Pressable>
              );
            })
          : filteredGroups.map((group, index) => {
              const selected = selectedGroupId === group.id;
              return (
                <Pressable
                  key={group.id}
                  accessibilityRole="button"
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedFriendIds([]);
                    setSelectedGroupId((prev) => (prev === group.id ? "" : group.id));
                  }}
                  style={({ pressed }) => [
                    styles.contextRow,
                    index < filteredGroups.length - 1 && styles.rowDivider,
                    pressed && styles.rowPressed,
                  ]}
                >
                  <GroupIconBadge group={group} size="md" />
                  <View style={styles.rowText}>
                    <Typography numberOfLines={1} style={styles.rowTitle}>
                      {group.name}
                    </Typography>
                    <Typography style={styles.rowMeta}>
                      {group.members.length} members · {group.currency}
                    </Typography>
                  </View>
                  <SelectionMark selected={selected} />
                </Pressable>
              );
            })}
      </View>
    </View>
  );
}

function SelectionMark({ selected }: { selected: boolean }): JSX.Element {
  return (
    <View style={[styles.selectionMark, selected && styles.selectionMarkActive]}>
      {selected ? <icons.Check size={14} color="#FFFFFF" strokeWidth={2.6} /> : null}
    </View>
  );
}

function ContextSummary({
  selectedGroup,
  selectedFriends,
  participants,
  currency,
  canChange,
  onChange,
}: {
  selectedGroup?: Group;
  selectedFriends: User[];
  participants: User[];
  currency: string;
  canChange: boolean;
  onChange: () => void;
}): JSX.Element {
  const title = selectedGroup
    ? selectedGroup.name
    : selectedFriends.map((friend) => friend.name.split(" ")[0]).join(", ");
  const Icon = selectedGroup ? icons.Users : icons.UserRound;

  return (
    <SurfaceCard>
      <View style={styles.summaryRow}>
        {selectedGroup ? (
          <GroupIconBadge group={selectedGroup} size="md" />
        ) : (
          <View style={styles.contextAvatarStack}>
            <AvatarStack users={participants} max={3} />
          </View>
        )}
        <View style={styles.summaryText}>
          <View style={styles.contextTypeRow}>
            <Icon size={14} color={MUTED} strokeWidth={1.8} />
            <Typography style={styles.contextTypeText}>
              {selectedGroup ? "Group expense" : "Friend expense"}
            </Typography>
          </View>
          <Typography numberOfLines={1} style={styles.summaryTitle}>
            {title}
          </Typography>
          <Typography style={styles.summaryMeta}>
            {participants.length} people · {currency}
          </Typography>
        </View>
        {canChange ? (
          <Pressable
            accessibilityRole="button"
            onPress={onChange}
            style={({ pressed }) => [styles.changeButton, pressed && styles.pressed]}
          >
            <Typography style={styles.changeButtonText}>Change</Typography>
          </Pressable>
        ) : null}
      </View>
    </SurfaceCard>
  );
}

const ERROR = DANGER;

function AmountCard({
  amount,
  onAmountChange,
  currency,
  title,
  onTitleChange,
  category,
  amountError,
  titleError,
}: {
  amount: string;
  onAmountChange: (value: string) => void;
  currency: string;
  title: string;
  onTitleChange: (value: string) => void;
  category: ExpenseCategory;
  amountError?: string;
  titleError?: string;
}): JSX.Element {
  return (
    <SurfaceCard style={styles.amountCard}>
      <View style={styles.amountHeader}>
        <CategoryIconBadge category={category} size="md" />
        <View style={{ flex: 1 }}>
          <Typography style={styles.amountKicker}>Amount</Typography>
          <Typography style={styles.amountHint}>Enter the total paid before splitting.</Typography>
        </View>
      </View>

      <View style={styles.amountInputRow}>
        <Typography style={styles.currencyCode}>{currency}</Typography>
        <TextInput
          value={amount}
          onChangeText={onAmountChange}
          placeholder="0.00"
          placeholderTextColor={MUTED}
          keyboardType="decimal-pad"
          returnKeyType="done"
          style={[styles.amountInput, amountError ? { borderColor: ERROR } : undefined]}
        />
      </View>
      {amountError && (
        <Typography
          style={{
            marginTop: 4,
            color: ERROR,
            fontSize: 13,
            fontFamily: "IBMPlexSans_500Medium",
          }}
        >
          {amountError}
        </Typography>
      )}

      <TextInput
        value={title}
        onChangeText={onTitleChange}
        placeholder="What was it for?"
        placeholderTextColor={MUTED}
        autoCapitalize="sentences"
        returnKeyType="done"
        style={[styles.titleInput, titleError ? { borderColor: ERROR } : undefined]}
      />
      {titleError && (
        <Typography
          style={{
            marginTop: 4,
            color: ERROR,
            fontSize: 13,
            fontFamily: "IBMPlexSans_500Medium",
          }}
        >
          {titleError}
        </Typography>
      )}
    </SurfaceCard>
  );
}

function PreviewCard({
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
  const status = balanced ? "Balanced" : "Needs split";

  return (
    <SurfaceCard>
      <View style={styles.previewHeader}>
        <View>
          <Typography style={styles.previewLabel}>Split preview</Typography>
          <Typography style={styles.previewAmount}>
            {amount > 0 ? formatAmount(amount, currency) : "No amount yet"}
          </Typography>
        </View>
        <View
          style={[styles.statusPill, balanced ? styles.statusPillSuccess : styles.statusPillDanger]}
        >
          <Typography style={[styles.statusPillText, { color: balanced ? SUCCESS : DANGER }]}>
            {status}
          </Typography>
        </View>
      </View>
      <View style={styles.previewGrid}>
        <PreviewCell label="People" value={`${includedCount}/${participantsCount}`} />
        <PreviewCell
          label="Each"
          value={amount > 0 && splitMethod === "equal" ? formatAmount(equalShare, currency) : "-"}
        />
        <PreviewCell
          label="Method"
          value={splitMethod === "percentage" ? "Percent" : splitMethod}
        />
      </View>
    </SurfaceCard>
  );
}

function PreviewCell({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <View style={styles.previewCell}>
      <Typography style={styles.previewCellLabel}>{label}</Typography>
      <Typography numberOfLines={1} style={styles.previewCellValue}>
        {value}
      </Typography>
    </View>
  );
}

function CurrencyInlineSelector({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (currency: Currency) => void;
  disabled?: boolean;
}): JSX.Element {
  const selectedCurrency = CURRENCIES.find((currency) => currency.code === value) ?? CURRENCIES[0];
  const quick = CURRENCIES.filter(
    (currency) =>
      QUICK_CURRENCIES.includes(currency.code) || currency.code === selectedCurrency.code
  );

  return (
    <View style={styles.currencySelector}>
      <View style={styles.currencyCurrent}>
        <View style={styles.currencySymbol}>
          <Typography style={styles.currencySymbolText}>{selectedCurrency.symbol}</Typography>
        </View>
        <View style={{ flex: 1 }}>
          <Typography style={styles.currencyName}>{selectedCurrency.code}</Typography>
          <Typography style={styles.currencyMeta} numberOfLines={1}>
            {disabled ? "Locked to group currency" : selectedCurrency.name}
          </Typography>
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.currencyChipRow}>
          {quick.map((currency) => {
            const active = currency.code === value;
            return (
              <Pressable
                key={currency.code}
                accessibilityRole="button"
                disabled={disabled}
                onPress={() => {
                  Haptics.selectionAsync();
                  onChange(currency);
                }}
                style={({ pressed }) => [
                  styles.currencyChip,
                  active && styles.currencyChipActive,
                  disabled && styles.disabled,
                  pressed && styles.pressed,
                ]}
              >
                <Typography
                  style={[styles.currencyChipText, active && styles.currencyChipTextActive]}
                >
                  {currency.code}
                </Typography>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

function DateInlinePicker({
  value,
  visible,
  onToggle,
  onChange,
}: {
  value: Date;
  visible: boolean;
  onToggle: () => void;
  onChange: (date: Date) => void;
}): JSX.Element {
  return (
    <View style={styles.dateBlock}>
      <Pressable
        accessibilityRole="button"
        onPress={onToggle}
        style={({ pressed }) => [styles.detailRow, pressed && styles.rowPressed]}
      >
        <View style={styles.detailIcon}>
          <icons.Calendar size={18} color={TEXT} strokeWidth={1.8} />
        </View>
        <View style={{ flex: 1 }}>
          <Typography style={styles.detailTitle}>{dayjs(value).format("MMMM D, YYYY")}</Typography>
          <Typography style={styles.detailMeta}>Expense date</Typography>
        </View>
        <icons.ChevronDown
          size={18}
          color={MUTED}
          strokeWidth={1.8}
          style={{ transform: [{ rotate: visible ? "180deg" : "0deg" }] }}
        />
      </Pressable>

      {visible ? (
        <View style={styles.datePicker}>
          <DateTimePicker
            mode="single"
            date={dayjs(value)}
            onChange={(params: any) => {
              if (params.date) onChange(dayjs(params.date).toDate());
            }}
            styles={{
              selected: { backgroundColor: TEXT, borderRadius: 999 },
              today: { backgroundColor: BORDER_SOFT, borderRadius: 999 },
              day_label: { color: TEXT, fontSize: 15 },
              header: { paddingBottom: 12 },
              month_selector_label: { color: TEXT, fontSize: 16 },
              year_selector_label: { color: TEXT, fontSize: 16 },
              weekday_label: { color: MUTED },
            }}
          />
        </View>
      ) : null}
    </View>
  );
}

function CategorySelector({
  value,
  onChange,
}: {
  value: ExpenseCategory;
  onChange: (value: ExpenseCategory) => void;
}): JSX.Element {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.categoryRow}>
        {EXPENSE_CATEGORIES.map((category) => {
          const active = value === category.key;
          return (
            <Pressable
              key={category.key}
              accessibilityRole="button"
              onPress={() => {
                Haptics.selectionAsync();
                onChange(category.key);
              }}
              style={({ pressed }) => [
                styles.categoryChip,
                active && styles.categoryChipActive,
                pressed && styles.pressed,
              ]}
            >
              <CategoryIconBadge category={category.key} size="sm" />
              <Typography
                style={[styles.categoryChipText, active && styles.categoryChipTextActive]}
              >
                {category.label.replace(" & Drink", "")}
              </Typography>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

function PaidBySelector({
  participants,
  paidBy,
  currentUserId,
  onChange,
}: {
  participants: User[];
  paidBy: string;
  currentUserId: string;
  onChange: (id: string) => void;
}): JSX.Element {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.paidByRow}>
        {participants.map((participant) => {
          const active = paidBy === participant.id;
          return (
            <Pressable
              key={participant.id}
              accessibilityRole="button"
              onPress={() => {
                Haptics.selectionAsync();
                onChange(participant.id);
              }}
              style={({ pressed }) => [
                styles.paidByChip,
                active && styles.paidByChipActive,
                pressed && styles.pressed,
              ]}
            >
              <AppUserAvatar user={participant} size="sm" />
              <Typography style={[styles.paidByText, active && styles.paidByTextActive]}>
                {participant.id === currentUserId ? "You" : participant.name.split(" ")[0]}
              </Typography>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

function SplitMethodSelector({
  value,
  onChange,
}: {
  value: SplitMethod;
  onChange: (value: SplitMethod) => void;
}): JSX.Element {
  return (
    <View style={styles.methodGrid}>
      {SPLIT_METHODS.map((method) => {
        const Icon = (icons as any)[method.icon] || icons.Circle;
        const active = value === method.key;
        return (
          <Pressable
            key={method.key}
            accessibilityRole="button"
            onPress={() => {
              Haptics.selectionAsync();
              onChange(method.key);
            }}
            style={({ pressed }) => [
              styles.methodCard,
              active && styles.methodCardActive,
              pressed && styles.pressed,
            ]}
          >
            <View style={[styles.methodIcon, active && styles.methodIconActive]}>
              <Icon size={17} color={active ? "#FFFFFF" : TEXT} strokeWidth={1.8} />
            </View>
            <Typography style={styles.methodTitle}>{method.label}</Typography>
            <Typography style={styles.methodMeta}>{method.helper}</Typography>
          </Pressable>
        );
      })}
    </View>
  );
}

function ParticipantsEditor({
  participants,
  included,
  setIncluded,
  splitMethod,
  parsedAmount,
  remainingCustom,
  remainingPercent,
  expenseCurrency,
  equalShare,
  customAmounts,
  setCustomAmounts,
  customPercentages,
  setCustomPercentages,
  currentUserId,
}: {
  participants: User[];
  included: Record<string, boolean>;
  setIncluded: (
    value: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)
  ) => void;
  splitMethod: SplitMethod;
  parsedAmount: number;
  remainingCustom: number;
  remainingPercent: number;
  expenseCurrency: string;
  equalShare: number;
  customAmounts: Record<string, string>;
  setCustomAmounts: (
    value: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)
  ) => void;
  customPercentages: Record<string, string>;
  setCustomPercentages: (
    value: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)
  ) => void;
  currentUserId: string;
}): JSX.Element {
  const showRemaining = parsedAmount > 0 && splitMethod !== "equal";
  const remainingText =
    splitMethod === "custom"
      ? `Remaining ${formatAmount(remainingCustom, expenseCurrency)}`
      : `Remaining ${remainingPercent.toFixed(1)}%`;
  const remainingBalanced =
    splitMethod === "custom" ? remainingCustom === 0 : remainingPercent === 0;

  return (
    <Section
      label="Participants"
      action={
        showRemaining ? (
          <View
            style={[
              styles.remainingPill,
              remainingBalanced ? styles.statusPillSuccess : styles.statusPillDanger,
            ]}
          >
            <Typography
              style={[styles.remainingText, { color: remainingBalanced ? SUCCESS : DANGER }]}
            >
              {remainingText}
            </Typography>
          </View>
        ) : null
      }
    >
      <View style={styles.listCard}>
        {participants.map((participant, index) => {
          const isIncluded = included[participant.id] ?? true;
          return (
            <View
              key={participant.id}
              style={[
                styles.participantRow,
                index < participants.length - 1 && styles.rowDivider,
                !isIncluded && styles.participantExcluded,
              ]}
            >
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isIncluded }}
                onPress={() => {
                  Haptics.selectionAsync();
                  setIncluded((prev) => ({ ...prev, [participant.id]: !isIncluded }));
                }}
                style={({ pressed }) => [
                  styles.checkbox,
                  isIncluded && styles.checkboxActive,
                  pressed && styles.pressed,
                ]}
              >
                {isIncluded ? <icons.Check size={15} color="#FFFFFF" strokeWidth={2.6} /> : null}
              </Pressable>
              <AppUserAvatar user={participant} size="sm" />
              <View style={styles.participantText}>
                <Typography numberOfLines={1} style={styles.rowTitle}>
                  {participant.id === currentUserId ? "You" : participant.name}
                </Typography>
                <Typography style={styles.rowMeta}>
                  {isIncluded ? "Included" : "Excluded"}
                </Typography>
              </View>

              {splitMethod === "equal" && isIncluded && parsedAmount > 0 ? (
                <View style={styles.sharePill}>
                  <Typography style={styles.shareText}>
                    {formatAmount(equalShare, expenseCurrency)}
                  </Typography>
                </View>
              ) : null}

              {splitMethod === "custom" && isIncluded ? (
                <View style={styles.shareInputWrap}>
                  <TextInput
                    value={customAmounts[participant.id] ?? ""}
                    onChangeText={(value) =>
                      setCustomAmounts((prev) => ({ ...prev, [participant.id]: value }))
                    }
                    placeholder="0.00"
                    placeholderTextColor={MUTED}
                    keyboardType="decimal-pad"
                    style={styles.shareInput}
                  />
                </View>
              ) : null}

              {splitMethod === "percentage" && isIncluded ? (
                <View style={styles.percentWrap}>
                  <TextInput
                    value={customPercentages[participant.id] ?? ""}
                    onChangeText={(value) =>
                      setCustomPercentages((prev) => ({ ...prev, [participant.id]: value }))
                    }
                    placeholder="0"
                    placeholderTextColor={MUTED}
                    keyboardType="decimal-pad"
                    style={styles.percentInput}
                  />
                  <Typography style={styles.percentSymbol}>%</Typography>
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
    </Section>
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
  const preferredCurrency = useUIStore((state) => state.preferredCurrency);
  const setCurrency = useUIStore((state) => state.setCurrency);
  const { toast } = useAppToast();
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

  const hasSelection = !!state.selectedGroup || state.selectedFriends.length > 0;
  const hasContext = hasSelection && state.selectionConfirmed;
  const canChangeContext = !initialGroupId && !initialFriendId && !state.existingExpense;
  const primaryLabel = !hasSelection
    ? "Choose friends or a group"
    : !hasContext
      ? "Continue"
      : state.existingExpense
        ? "Save changes"
        : "Add expense";
  const primaryDisabled = !hasSelection || state.loading || isSubmitting;

  const closeScreen = useCallback(() => {
    Keyboard.dismiss();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)");
    }
  }, [router]);

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

  if (!currentUser) {
    return (
      <View style={styles.loadingScreen}>
        <StatusBar style="dark" />
        <ActivityIndicator color={TEXT} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
      >
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <HeaderButton icon="ChevronLeft" label="Close expense screen" onPress={closeScreen} />
          <View style={styles.headerTitleWrap}>
            <Typography style={styles.headerKicker}>
              {state.existingExpense ? "Edit expense" : "New expense"}
            </Typography>
            <Typography numberOfLines={1} style={styles.headerTitle}>
              {hasContext ? "Expense details" : "Choose people"}
            </Typography>
          </View>
          <View style={styles.headerButtonGhost} />
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(insets.bottom, 16) + 104 },
          ]}
        >
          {!hasContext ? (
            <ContextPicker
              selectionTab={state.selectionTab}
              setSelectionTab={actions.setSelectionTab}
              searchQuery={state.searchQuery}
              setSearchQuery={actions.setSearchQuery}
              filteredFriends={state.filteredFriends}
              filteredGroups={state.filteredGroups}
              selectedFriendIds={state.selectedFriendIds}
              setSelectedFriendIds={actions.setSelectedFriendIds}
              selectedGroupId={state.selectedGroupId}
              setSelectedGroupId={actions.setSelectedGroupId}
              selectedFriends={state.selectedFriends}
            />
          ) : (
            <View style={styles.formStack}>
              <ContextSummary
                selectedGroup={state.selectedGroup}
                selectedFriends={state.selectedFriends}
                participants={state.participants}
                currency={state.expenseCurrency}
                canChange={canChangeContext}
                onChange={() => {
                  actions.setSelectedGroupId("");
                  actions.setSelectedFriendIds([]);
                  actions.setSelectionConfirmed(false);
                }}
              />

              {(state.errors.members || state.errors.split) && (
                <View
                  style={{
                    backgroundColor: "#FFF7F5",
                    borderWidth: 1,
                    borderColor: "#E85D5D",
                    borderRadius: 12,
                    padding: 14,
                    marginBottom: 12,
                  }}
                >
                  <Typography
                    style={{
                      fontSize: 13,
                      color: "#E85D5D",
                      fontFamily: "IBMPlexSans_500Medium",
                      lineHeight: 18,
                    }}
                  >
                    {state.errors.members || state.errors.split}
                  </Typography>
                </View>
              )}

              <AmountCard
                amount={state.amount}
                onAmountChange={(v) => {
                  actions.setErrors((prev) => ({ ...prev, amount: "" }));
                  actions.setAmount(v);
                }}
                currency={state.expenseCurrency}
                title={state.title}
                onTitleChange={(v) => {
                  actions.setErrors((prev) => ({ ...prev, title: "" }));
                  actions.setTitle(v);
                }}
                category={state.category}
                amountError={state.errors.amount}
                titleError={state.errors.title}
              />

              <PreviewCard
                amount={state.parsedAmount}
                currency={state.expenseCurrency}
                participantsCount={state.participants.length}
                includedCount={state.includedMembers.length}
                equalShare={state.equalShare}
                splitMethod={state.splitMethod}
                remainingCustom={state.remainingCustom}
                remainingPercent={state.remainingPercent}
              />

              <Section label="Details">
                <SurfaceCard style={styles.detailCard}>
                  <CurrencyInlineSelector
                    value={state.expenseCurrency}
                    disabled={!!state.selectedGroup}
                    onChange={(currency) => {
                      actions.setExpenseCurrency(currency.code);
                      if (!state.selectedGroup) actions.setCurrency(currency);
                    }}
                  />
                  <View style={styles.detailDivider} />
                  <DateInlinePicker
                    value={state.expenseDate}
                    visible={state.showDatePicker}
                    onToggle={() => actions.setShowDatePicker(!state.showDatePicker)}
                    onChange={(date) => {
                      actions.setExpenseDate(date);
                      actions.setShowDatePicker(false);
                    }}
                  />
                </SurfaceCard>
              </Section>

              <Section label="Category">
                <CategorySelector value={state.category} onChange={actions.setCategory} />
              </Section>

              <Section label="Paid by">
                <PaidBySelector
                  participants={state.participants}
                  paidBy={state.paidBy}
                  currentUserId={currentUser.id}
                  onChange={actions.setPaidBy}
                />
              </Section>

              <Section label="Split method">
                <SplitMethodSelector value={state.splitMethod} onChange={actions.setSplitMethod} />
              </Section>

              <ParticipantsEditor
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
            </View>
          )}
        </ScrollView>

        <View
          style={[
            styles.actionBar,
            {
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            disabled={primaryDisabled}
            onPress={handlePrimaryPress}
            style={({ pressed }) => [
              styles.primaryButton,
              !hasSelection && styles.primaryButtonDisabled,
              pressed && !primaryDisabled && styles.primaryButtonPressed,
            ]}
          >
            {state.loading || isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" style={{ marginRight: 8 }} />
            ) : null}
            <Typography
              style={[styles.primaryButtonText, !hasSelection && styles.primaryButtonTextDisabled]}
            >
              {primaryLabel}
            </Typography>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BG,
  },
  keyboardView: {
    flex: 1,
  },
  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BG,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    backgroundColor: BG,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: PILL,
    backgroundColor: CONTROL,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  headerButtonGhost: {
    width: 44,
    height: 44,
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 12,
  },
  headerKicker: {
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    color: MUTED,
    fontFamily: "IBMPlexSans_600SemiBold",
  },
  headerTitle: {
    marginTop: 2,
    fontSize: 18,
    color: TEXT,
    fontFamily: "Sora_600SemiBold",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  contextBlock: {
    gap: 16,
  },
  contextIntro: {
    flexDirection: "row",
    gap: 14,
    padding: 16,
  },
  contextIntroIcon: {
    width: 48,
    height: 48,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: CONTROL,
    alignItems: "center",
    justifyContent: "center",
  },
  contextIntroTitle: {
    fontSize: 20,
    color: TEXT,
    fontFamily: "Sora_600SemiBold",
  },
  contextIntroText: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
    color: MUTED,
    fontFamily: "IBMPlexSans_500Medium",
  },
  searchField: {
    minHeight: 52,
    borderRadius: PILL,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: CONTROL,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
  },
  searchInput: {
    flex: 1,
    padding: 0,
    color: TEXT,
    fontSize: 16,
    fontFamily: "IBMPlexSans_500Medium",
  },
  segmented: {
    flexDirection: "row",
    gap: 4,
    padding: 4,
    borderRadius: PILL,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: CONTROL,
  },
  segment: {
    flex: 1,
    minHeight: 42,
    borderRadius: PILL,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentActive: {
    backgroundColor: TEXT,
  },
  segmentText: {
    fontSize: 14,
    color: TEXT,
    fontFamily: "IBMPlexSans_600SemiBold",
  },
  segmentTextActive: {
    color: "#FFFFFF",
  },
  selectedChipRow: {
    flexDirection: "row",
    gap: 8,
    paddingRight: 20,
  },
  selectedChip: {
    minHeight: 42,
    paddingLeft: 5,
    paddingRight: 12,
    borderRadius: PILL,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: CONTROL,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  selectedChipText: {
    color: TEXT,
    fontSize: 14,
    fontFamily: "IBMPlexSans_600SemiBold",
  },
  listCard: {
    overflow: "hidden",
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: SURFACE,
  },
  contextRow: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: BORDER_SOFT,
  },
  rowPressed: {
    backgroundColor: PRESSED,
  },
  rowText: {
    flex: 1,
    marginLeft: 12,
  },
  rowTitle: {
    fontSize: 15,
    color: TEXT,
    fontFamily: "IBMPlexSans_600SemiBold",
  },
  rowMeta: {
    marginTop: 2,
    fontSize: 13,
    color: MUTED,
    fontFamily: "IBMPlexSans_500Medium",
  },
  selectionMark: {
    width: 24,
    height: 24,
    borderRadius: PILL,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: CONTROL,
    alignItems: "center",
    justifyContent: "center",
  },
  selectionMarkActive: {
    borderColor: BRAND,
    backgroundColor: BRAND,
  },
  emptyList: {
    padding: 24,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 16,
    color: TEXT,
    fontFamily: "IBMPlexSans_600SemiBold",
  },
  emptyText: {
    marginTop: 4,
    fontSize: 14,
    color: MUTED,
    fontFamily: "IBMPlexSans_500Medium",
  },
  formStack: {
    gap: 20,
  },
  surfaceCard: {
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: CARD_RADIUS,
    padding: 16,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  contextAvatarStack: {
    minWidth: 58,
    justifyContent: "center",
  },
  summaryText: {
    flex: 1,
  },
  contextTypeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  contextTypeText: {
    color: MUTED,
    fontSize: 12,
    fontFamily: "IBMPlexSans_600SemiBold",
  },
  summaryTitle: {
    marginTop: 3,
    fontSize: 18,
    color: TEXT,
    fontFamily: "IBMPlexSans_600SemiBold",
  },
  summaryMeta: {
    marginTop: 2,
    fontSize: 13,
    color: MUTED,
    fontFamily: "IBMPlexSans_500Medium",
  },
  changeButton: {
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: PILL,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: CONTROL,
    alignItems: "center",
    justifyContent: "center",
  },
  changeButtonText: {
    fontSize: 13,
    color: TEXT,
    fontFamily: "IBMPlexSans_600SemiBold",
  },
  amountCard: {
    padding: 18,
  },
  amountHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  amountKicker: {
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    color: MUTED,
    fontFamily: "IBMPlexSans_600SemiBold",
  },
  amountHint: {
    marginTop: 2,
    fontSize: 13,
    color: MUTED,
    fontFamily: "IBMPlexSans_500Medium",
  },
  amountInputRow: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 8,
  },
  currencyCode: {
    paddingBottom: 12,
    fontSize: 20,
    color: MUTED,
    fontFamily: "IBMPlexSans_600SemiBold",
  },
  amountInput: {
    minWidth: 140,
    maxWidth: 230,
    padding: 0,
    color: TEXT,
    fontSize: 54,
    lineHeight: 62,
    textAlign: "center",
    fontFamily: "Sora_600SemiBold",
  },
  titleInput: {
    minHeight: 52,
    marginTop: 12,
    paddingHorizontal: 16,
    borderRadius: PILL,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: CONTROL,
    color: TEXT,
    fontSize: 16,
    textAlign: "center",
    fontFamily: "IBMPlexSans_600SemiBold",
  },
  previewHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  previewLabel: {
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    color: MUTED,
    fontFamily: "IBMPlexSans_600SemiBold",
  },
  previewAmount: {
    marginTop: 4,
    fontSize: 22,
    color: TEXT,
    fontFamily: "Sora_600SemiBold",
  },
  statusPill: {
    minHeight: 32,
    paddingHorizontal: 12,
    borderRadius: PILL,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  statusPillSuccess: {
    backgroundColor: SUCCESS_BG,
  },
  statusPillDanger: {
    backgroundColor: WARNING_BG,
  },
  statusPillText: {
    fontSize: 12,
    fontFamily: "IBMPlexSans_600SemiBold",
  },
  previewGrid: {
    marginTop: 16,
    flexDirection: "row",
    gap: 10,
  },
  previewCell: {
    flex: 1,
    minHeight: 70,
    padding: 12,
    borderRadius: INNER_RADIUS,
    borderWidth: 1,
    borderColor: BORDER_SOFT,
    backgroundColor: CONTROL,
    justifyContent: "center",
  },
  previewCellLabel: {
    fontSize: 12,
    color: MUTED,
    fontFamily: "IBMPlexSans_500Medium",
  },
  previewCellValue: {
    marginTop: 4,
    fontSize: 16,
    color: TEXT,
    textTransform: "capitalize",
    fontFamily: "IBMPlexSans_600SemiBold",
  },
  section: {
    gap: 10,
  },
  sectionHeader: {
    minHeight: 26,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionLabel: {
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    color: MUTED,
    fontFamily: "IBMPlexSans_600SemiBold",
  },
  detailCard: {
    padding: 0,
    overflow: "hidden",
  },
  currencySelector: {
    padding: 14,
    gap: 12,
  },
  currencyCurrent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  currencySymbol: {
    width: 44,
    height: 44,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: CONTROL,
    alignItems: "center",
    justifyContent: "center",
  },
  currencySymbolText: {
    fontSize: 17,
    color: TEXT,
    fontFamily: "IBMPlexSans_600SemiBold",
  },
  currencyName: {
    fontSize: 16,
    color: TEXT,
    fontFamily: "IBMPlexSans_600SemiBold",
  },
  currencyMeta: {
    marginTop: 2,
    fontSize: 13,
    color: MUTED,
    fontFamily: "IBMPlexSans_500Medium",
  },
  currencyChipRow: {
    flexDirection: "row",
    gap: 8,
    paddingRight: 14,
  },
  currencyChip: {
    minHeight: 36,
    paddingHorizontal: 13,
    borderRadius: PILL,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: CONTROL,
    alignItems: "center",
    justifyContent: "center",
  },
  currencyChipActive: {
    backgroundColor: TEXT,
    borderColor: TEXT,
  },
  currencyChipText: {
    fontSize: 13,
    color: TEXT,
    fontFamily: "IBMPlexSans_600SemiBold",
  },
  currencyChipTextActive: {
    color: "#FFFFFF",
  },
  detailDivider: {
    height: 1,
    backgroundColor: BORDER_SOFT,
  },
  dateBlock: {
    backgroundColor: SURFACE,
  },
  detailRow: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  detailIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: CONTROL,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  detailTitle: {
    fontSize: 15,
    color: TEXT,
    fontFamily: "IBMPlexSans_600SemiBold",
  },
  detailMeta: {
    marginTop: 2,
    fontSize: 13,
    color: MUTED,
    fontFamily: "IBMPlexSans_500Medium",
  },
  datePicker: {
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: BORDER_SOFT,
    backgroundColor: SURFACE,
  },
  categoryRow: {
    flexDirection: "row",
    gap: 8,
    paddingRight: 20,
  },
  categoryChip: {
    minHeight: 48,
    paddingLeft: 6,
    paddingRight: 14,
    borderRadius: PILL,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: CONTROL,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  categoryChipActive: {
    borderColor: TEXT,
    backgroundColor: "#F4F3EE",
  },
  categoryChipText: {
    fontSize: 14,
    color: TEXT,
    fontFamily: "IBMPlexSans_600SemiBold",
  },
  categoryChipTextActive: {
    color: TEXT,
  },
  paidByRow: {
    flexDirection: "row",
    gap: 8,
    paddingRight: 20,
  },
  paidByChip: {
    minHeight: 46,
    paddingLeft: 5,
    paddingRight: 14,
    borderRadius: PILL,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: CONTROL,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  paidByChipActive: {
    borderColor: TEXT,
    backgroundColor: TEXT,
  },
  paidByText: {
    fontSize: 14,
    color: TEXT,
    fontFamily: "IBMPlexSans_600SemiBold",
  },
  paidByTextActive: {
    color: "#FFFFFF",
  },
  methodGrid: {
    flexDirection: "row",
    gap: 8,
  },
  methodCard: {
    flex: 1,
    minHeight: 98,
    padding: 12,
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: SURFACE,
  },
  methodCardActive: {
    borderColor: TEXT,
    backgroundColor: "#F4F3EE",
  },
  methodIcon: {
    width: 32,
    height: 32,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: CONTROL,
    alignItems: "center",
    justifyContent: "center",
  },
  methodIconActive: {
    borderColor: TEXT,
    backgroundColor: TEXT,
  },
  methodTitle: {
    marginTop: 9,
    fontSize: 14,
    color: TEXT,
    fontFamily: "IBMPlexSans_600SemiBold",
  },
  methodMeta: {
    marginTop: 2,
    fontSize: 12,
    color: MUTED,
    fontFamily: "IBMPlexSans_500Medium",
  },
  remainingPill: {
    minHeight: 28,
    paddingHorizontal: 10,
    borderRadius: PILL,
    borderWidth: 1,
    borderColor: BORDER,
    justifyContent: "center",
  },
  remainingText: {
    fontSize: 12,
    fontFamily: "IBMPlexSans_600SemiBold",
  },
  participantRow: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  participantExcluded: {
    opacity: 0.55,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: CONTROL,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  checkboxActive: {
    borderColor: TEXT,
    backgroundColor: TEXT,
  },
  participantText: {
    flex: 1,
    marginLeft: 12,
  },
  sharePill: {
    minHeight: 34,
    paddingHorizontal: 10,
    borderRadius: PILL,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: CONTROL,
    alignItems: "center",
    justifyContent: "center",
  },
  shareText: {
    fontSize: 13,
    color: TEXT,
    fontFamily: "IBMPlexSans_600SemiBold",
  },
  shareInputWrap: {
    width: 96,
  },
  shareInput: {
    height: 42,
    borderRadius: INNER_RADIUS,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: CONTROL,
    color: TEXT,
    fontSize: 15,
    textAlign: "right",
    paddingHorizontal: 12,
    fontFamily: "IBMPlexSans_600SemiBold",
  },
  percentWrap: {
    width: 94,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  percentInput: {
    flex: 1,
    height: 42,
    borderRadius: INNER_RADIUS,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: CONTROL,
    color: TEXT,
    fontSize: 15,
    textAlign: "right",
    paddingHorizontal: 12,
    fontFamily: "IBMPlexSans_600SemiBold",
  },
  percentSymbol: {
    fontSize: 14,
    color: MUTED,
    fontFamily: "IBMPlexSans_600SemiBold",
  },
  actionBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    backgroundColor: BG,
  },
  primaryButton: {
    minHeight: 56,
    borderRadius: PILL,
    backgroundColor: BRAND,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  primaryButtonDisabled: {
    backgroundColor: BORDER,
  },
  primaryButtonPressed: {
    opacity: 0.82,
  },
  primaryButtonText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontFamily: "IBMPlexSans_600SemiBold",
  },
  primaryButtonTextDisabled: {
    color: MUTED,
  },
  pressed: {
    opacity: 0.72,
  },
  disabled: {
    opacity: 0.5,
  },
});
