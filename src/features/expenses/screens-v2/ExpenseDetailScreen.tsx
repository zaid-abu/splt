import type { JSX } from "react";
import { useCallback } from "react";
import { View, Text, Pressable } from "react-native";
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView } from "@gorhom/bottom-sheet";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import * as icons from "lucide-react-native";

import { useUI } from "@/components/ui";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { AppLoader } from "@/components/ui/AppLoader";
import { ErrorState } from "@/components/ui/ErrorState";
import { useAuth } from "@/context/AppContext";
import { useExpenseDetail } from "@/features/expenses/hooks/useExpenseDetail";
import { ExpenseComments } from "@/features/expenses/components/ExpenseComments";
import { formatAmount } from "@/components/ui/AmountDisplay";
import { CoralScreen } from "@/components/coral/CoralScreen";
import { CoralTopBar } from "@/components/coral/CoralTopBar";
import { Eyebrow } from "@/components/coral/Eyebrow";
import { useCoralColors } from "@/components/coral/useCoral";
import type { ExpenseRouteParams } from "@/types/navigation";

export default function ExpenseDetailScreenV2(): JSX.Element {
  const { id } = useLocalSearchParams<ExpenseRouteParams>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();
  const coral = useCoralColors();
  const { color } = useUI();

  const {
    expense,
    group,
    isExpensesLoading,
    isExpensesError,
    refetchExpenses,
    formatAmt,
    dateStr,
    paidByMe,
    myShare,
    paidByLabel,
    deleteSheetRef,
    handleDelete,
    handleEdit,
    handleDeletePress,
    handleUserPress,
  } = useExpenseDetail(id);

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

  if (!expense && isExpensesLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: coral.bg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <AppLoader />
      </View>
    );
  }

  if (isExpensesError) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: coral.bg,
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <ErrorState onRetry={() => refetchExpenses()} />
      </View>
    );
  }

  if (!expense) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: coral.bg,
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <icons.AlertCircle size={48} color={color.muted} />
        <Text
          style={{
            fontSize: 24,
            fontFamily: "InstrumentSans_600SemiBold",
            color: coral.foreground,
            marginTop: 16,
          }}
        >
          Expense not found
        </Text>
        <Text
          style={{
            fontSize: 16,
            fontFamily: "InstrumentSans_400Regular",
            color: coral.muted,
            textAlign: "center",
            marginTop: 8,
          }}
        >
          This expense may have been deleted or is unavailable.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          style={({ pressed }) => ({
            marginTop: 24,
            paddingHorizontal: 24,
            paddingVertical: 12,
            backgroundColor: coral.accent,
            borderRadius: 14,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Text
            style={{
              fontSize: 16,
              fontFamily: "InstrumentSans_600SemiBold",
              color: coral.inkOnAccent,
            }}
          >
            Go back
          </Text>
        </Pressable>
      </View>
    );
  }

  const paidByName = expense.paidByUser.name.split(" ")[0];
  const splitMethodLabel =
    expense.splitMethod === "equal"
      ? "equally"
      : expense.splitMethod === "percentage"
        ? "by percentage"
        : "custom";
  const includedCount = expense.splits.length;
  const equalShare = expense.amount / includedCount;
  const relativeDate = isToday(expense.date)
    ? "today"
    : isYesterday(expense.date)
      ? "yesterday"
      : dateStr;

  return (
    <CoralScreen contentContainerStyle={{ paddingBottom: 40 }}>
      <CoralTopBar
        title={expense.title}
        onBack={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.back();
        }}
        rightElement={
          <Pressable accessibilityRole="button" onPress={handleDeletePress} hitSlop={8}>
            <Text style={{ fontSize: 20, color: coral.muted, lineHeight: 22, letterSpacing: 2 }}>
              &#8226;&#8226;&#8226;
            </Text>
          </Pressable>
        }
      />

      <Text
        style={{
          fontFamily: "IBMPlexMono_600SemiBold",
          fontSize: 52,
          letterSpacing: -0.03 * 52,
          color: coral.foreground,
          textAlign: "center",
          marginTop: 35,
        }}
      >
        {formatAmt(expense.amount)}
      </Text>

      <Text
        style={{
          fontFamily: "InstrumentSans_400Regular",
          fontSize: 16,
          color: coral.muted,
          textAlign: "center",
          lineHeight: 24,
          marginTop: 8,
          marginBottom: 24,
        }}
      >
        Paid by {paidByLabel} · split {splitMethodLabel} · {relativeDate}
      </Text>

      <View style={{ flexDirection: "row", gap: 12, marginBottom: 22 }}>
        <View
          style={{
            flex: 1,
            backgroundColor: coral.surface,
            borderWidth: 1,
            borderColor: coral.border,
            borderRadius: 14,
            padding: 14,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontFamily: "IBMPlexMono_600SemiBold",
              fontSize: 22,
              color: coral.foreground,
              fontVariant: ["tabular-nums"],
            }}
          >
            {formatAmount(equalShare, expense.currency)}
          </Text>
          <Text
            style={{
              fontFamily: "InstrumentSans_400Regular",
              fontSize: 12,
              color: coral.muted,
              marginTop: 5,
            }}
          >
            Per person
          </Text>
        </View>
        <View
          style={{
            flex: 1,
            backgroundColor: coral.surface,
            borderWidth: 1,
            borderColor: coral.border,
            borderRadius: 14,
            padding: 14,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontFamily: "IBMPlexMono_600SemiBold",
              fontSize: 22,
              color: coral.foreground,
              fontVariant: ["tabular-nums"],
            }}
          >
            {includedCount}
          </Text>
          <Text
            style={{
              fontFamily: "InstrumentSans_400Regular",
              fontSize: 12,
              color: coral.muted,
              marginTop: 5,
            }}
          >
            People included
          </Text>
        </View>
      </View>

      {group && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: coral.border,
              backgroundColor: coral.surface,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <icons.Globe size={16} color={coral.foreground} strokeWidth={1.5} />
          </View>
          <Text
            style={{ fontFamily: "InstrumentSans_500Medium", fontSize: 14, color: coral.muted }}
          >
            {group.name}
          </Text>
        </View>
      )}

      <Eyebrow>The split</Eyebrow>

      {expense.splits.map((split, idx) => {
        const isMe = split.userId === currentUser.id;
        const isPayer = split.userId === expense.paidBy;
        let subLabel: string;
        if (isPayer) {
          subLabel = "Paid the full amount";
        } else {
          subLabel = paidByMe ? `Owes you` : `Owes ${paidByName}`;
        }
        const amountIsPositive = isPayer;
        const amountValue = isPayer
          ? `+${formatAmt(expense.amount - split.amount)}`
          : formatAmt(split.amount);

        return (
          <Pressable
            key={split.userId}
            accessibilityRole="button"
            onPress={() => handleUserPress(split.userId)}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 2,
              paddingVertical: 10,
              gap: 12,
              minHeight: 68,
              borderBottomWidth: idx < expense.splits.length - 1 ? 1 : 0,
              borderBottomColor: coral.border,
              backgroundColor: pressed ? coral.border : "transparent",
            })}
          >
            <AppUserAvatar
              user={split.user}
              size="md"
              balance={isPayer ? expense.amount - (myShare?.amount ?? 0) : split.amount}
            />
            <View style={{ flex: 1 }}>
              <Text
                numberOfLines={1}
                style={{
                  fontFamily: "InstrumentSans_600SemiBold",
                  fontSize: 16,
                  color: coral.foreground,
                  letterSpacing: -0.005 * 16,
                }}
              >
                {isMe ? "You" : split.user.name}
              </Text>
              <Text
                style={{
                  fontFamily: "InstrumentSans_400Regular",
                  fontSize: 13,
                  color: coral.muted,
                  marginTop: 3,
                  lineHeight: 18,
                }}
              >
                {subLabel}
              </Text>
            </View>
            <Text
              style={{
                fontFamily: "IBMPlexMono_600SemiBold",
                fontSize: 16,
                color: amountIsPositive ? coral.positive : coral.foreground,
                letterSpacing: -0.01 * 16,
              }}
            >
              {amountValue}
            </Text>
          </Pressable>
        );
      })}

      <Pressable
        accessibilityRole="button"
        onPress={handleEdit}
        style={({ pressed }) => ({
          minHeight: 52,
          width: "100%",
          borderRadius: 14,
          backgroundColor: coral.accentSoft,
          paddingHorizontal: 18,
          alignItems: "center",
          justifyContent: "center",
          marginTop: 18,
          opacity: pressed ? 0.82 : 1,
        })}
      >
        <Text
          style={{
            fontFamily: "InstrumentSans_600SemiBold",
            fontSize: 16,
            letterSpacing: 0.02 * 16,
            color: coral.accentInk,
          }}
        >
          Edit expense
        </Text>
      </Pressable>

      {expense.receiptUrl ? (
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => ({
            marginTop: 24,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: coral.border,
            borderStyle: "dashed",
            padding: 14,
            alignItems: "center",
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text
            style={{ fontFamily: "InstrumentSans_500Medium", fontSize: 14, color: coral.muted }}
          >
            View receipt
          </Text>
        </Pressable>
      ) : null}

      <View style={{ marginTop: 32, marginBottom: 40 }}>
        <ExpenseComments expenseId={expense.id} currentUserId={currentUser.id} />
      </View>

      <BottomSheetModal
        ref={deleteSheetRef}
        index={0}
        enableDynamicSizing={true}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: coral.surface, borderRadius: 24 }}
        handleIndicatorStyle={{ backgroundColor: coral.border, width: 38, height: 5 }}
      >
        <BottomSheetView style={{ padding: 20, paddingBottom: insets.bottom + 24 }}>
          <Text
            style={{
              fontFamily: "InstrumentSans_600SemiBold",
              fontSize: 22,
              color: coral.foreground,
              marginBottom: 8,
            }}
          >
            Delete Expense?
          </Text>
          <Text
            style={{
              fontFamily: "InstrumentSans_400Regular",
              fontSize: 16,
              color: coral.muted,
              marginBottom: 24,
            }}
          >
            Are you sure you want to delete &quot;{expense.title}&quot;? This cannot be undone.
          </Text>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                deleteSheetRef.current?.dismiss();
              }}
              style={({ pressed }) => ({
                flex: 1,
                height: 48,
                borderWidth: 1,
                borderColor: coral.border,
                borderRadius: 14,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.5 : 1,
              })}
            >
              <Text
                style={{
                  fontFamily: "InstrumentSans_600SemiBold",
                  fontSize: 16,
                  color: coral.foreground,
                }}
              >
                Cancel
              </Text>
            </Pressable>
            <Pressable
              onPress={handleDelete}
              style={({ pressed }) => ({
                flex: 1,
                height: 48,
                backgroundColor: coral.negativeSoft,
                borderRadius: 14,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Text
                style={{
                  fontFamily: "InstrumentSans_600SemiBold",
                  fontSize: 16,
                  color: coral.negative,
                }}
              >
                Delete
              </Text>
            </Pressable>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    </CoralScreen>
  );
}

function isToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}

function isYesterday(date: Date): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  );
}
