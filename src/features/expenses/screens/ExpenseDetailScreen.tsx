import { Dialog, Typography, Skeleton } from "heroui-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { ExpenseRouteParams } from "@/types/navigation";
import type { JSX } from "react";
import { StatusBar } from "expo-status-bar";
import { ScrollView, View, Pressable, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import * as icons from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, LinearTransition } from "react-native-reanimated";

import { useGroups } from "@/features/groups/queries/useGroups";
import {
  useUserExpenses,
  useDeleteExpense,
} from "@/features/expenses/queries/useExpenses";

import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { getCurrencySymbol } from "@/components/ui/AmountDisplay";
import { useAuth } from "@/context/AppContext";
import { useUIStore } from "@/store/useUIStore";
import { EXPENSE_CATEGORIES } from "@/types";

const BG = "#F5F0EB";
const TEXT_PRIMARY = "#000000";
const TEXT_SECONDARY = "#8A8782";
const SEPARATOR = "#E8E4DF";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function ExpenseDetailScreen(): JSX.Element {
  const { id } = useLocalSearchParams<ExpenseRouteParams>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();
  const { data: expenses = [] } = useUserExpenses(currentUser?.id);
  const { data: groups = [] } = useGroups(currentUser?.id);
  const { mutateAsync: deleteExpense } = useDeleteExpense();

  const isAppLoading = useUIStore((s) => s.isAppLoading);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const expense = expenses.find((e) => e.id === id);
  const group = groups.find((g) => g.id === expense?.groupId);
  const category = EXPENSE_CATEGORIES.find((c) => c.key === expense?.category);

  if (!expense) {
    return (
      <View style={{ flex: 1, backgroundColor: BG, alignItems: "center", justifyContent: "center", padding: 24 }}>
        <icons.AlertCircle size={48} color={TEXT_PRIMARY} />
        <Typography style={{ fontSize: 24, fontWeight: "700", color: TEXT_PRIMARY, marginTop: 16, fontFamily: "PlusJakartaSans_700Bold" }}>
          Expense not found
        </Typography>
        <Typography style={{ fontSize: 16, color: TEXT_SECONDARY, textAlign: "center", marginTop: 8, fontFamily: "PlusJakartaSans_500Medium" }}>
          This expense may have been deleted or is unavailable.
        </Typography>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          style={({ pressed }) => ({
            marginTop: 24,
            paddingHorizontal: 24,
            paddingVertical: 12,
            backgroundColor: "#8C7A6B",
            borderRadius: 0,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Typography style={{ fontSize: 16, fontWeight: "700", color: "#FFFFFF", fontFamily: "PlusJakartaSans_700Bold" }}>
            Go back
          </Typography>
        </Pressable>
      </View>
    );
  }

  const sym = getCurrencySymbol(expense.currency);
  const isJPY = expense.currency === "JPY" || expense.currency === "KRW";
  const paidByMe = expense.paidBy === currentUser.id;
  const myShare = expense.splits.find((s: any) => s.userId === currentUser.id);

  const formatAmt = (n: number) =>
    `${sym}${n.toLocaleString("en-US", {
      minimumFractionDigits: isJPY ? 0 : 2,
      maximumFractionDigits: isJPY ? 0 : 2,
    })}`;

  const dateStr = expense.date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const CategoryIcon = (icons as any)[category?.icon ?? "Package"] || icons.Package;

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <StatusBar style="dark" />
      
      {/* ── Immersive Header ── */}
      <View
        style={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 24,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 10,
        }}
      >
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          style={({ pressed }) => ({
            width: 44,
            height: 44,
            borderRadius: 0,
            backgroundColor: "transparent",
            borderWidth: 1,
            borderColor: SEPARATOR,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.5 : 1,
          })}
        >
          <icons.ArrowLeft size={20} color={TEXT_PRIMARY} strokeWidth={1.5} />
        </Pressable>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push({ pathname: "/expense/new", params: { expenseId: expense.id } })}
            style={({ pressed }) => ({
              width: 44,
              height: 44,
              borderRadius: 0,
              backgroundColor: "transparent",
              borderWidth: 1,
              borderColor: SEPARATOR,
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.5 : 1,
            })}
          >
            <icons.Edit2 size={20} color={TEXT_PRIMARY} strokeWidth={1.5} />
          </Pressable>

          <Dialog isOpen={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <Dialog.Trigger asChild>
              <Pressable
                accessibilityRole="button"
                style={({ pressed }) => ({
                  width: 44,
                  height: 44,
                  borderRadius: 0,
                  backgroundColor: "transparent",
                  borderWidth: 1,
                  borderColor: SEPARATOR,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: pressed ? 0.5 : 1,
                })}
              >
                <icons.Trash2 size={20} color={TEXT_PRIMARY} strokeWidth={1.5} />
              </Pressable>
            </Dialog.Trigger>
            <Dialog.Portal className="absolute inset-0 justify-center p-5 z-50">
              <Dialog.Overlay className="absolute inset-0 bg-black/40" />
              <Dialog.Content className="bg-[#F5F0EB] p-6 rounded-none shadow-lg self-center w-full max-w-[400px]">
                <Dialog.Title className="text-[22px] font-bold mb-2 font-['PlusJakartaSans_700Bold'] text-[#000]">
                  Delete Expense?
                </Dialog.Title>
                <Dialog.Description className="text-[16px] text-[#8A8782] mb-6 font-['PlusJakartaSans_500Medium']">
                  Are you sure you want to delete "{expense.title}"? This cannot be undone.
                </Dialog.Description>
                <View className="flex-row gap-3">
                  <Pressable
                    className="flex-1 rounded-none h-[48px] border border-[#E8E4DF] items-center justify-center"
                    onPress={() => setIsDialogOpen(false)}
                  >
                    <Typography className="font-['PlusJakartaSans_700Bold'] text-[#000]">Cancel</Typography>
                  </Pressable>
                  <Pressable
                    className="flex-1 rounded-none h-[48px] bg-[#8C7A6B] items-center justify-center"
                    onPress={() => {
                      setIsDialogOpen(false);
                      setTimeout(() => {
                        router.back();
                        setTimeout(() => deleteExpense(expense.id), 400); 
                      }, 300); 
                    }}
                  >
                    <Typography className="font-['PlusJakartaSans_700Bold'] text-[#FFF]">Delete</Typography>
                  </Pressable>
                </View>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        
        {/* ── Bill Section ── */}
        <Animated.View entering={FadeInDown.duration(400)} style={{ paddingHorizontal: 24, paddingTop: 40, paddingBottom: 40, borderBottomWidth: 1, borderBottomColor: SEPARATOR }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
            <View style={{ flex: 1 }}>
              <Typography style={{ fontSize: 14, fontWeight: "700", color: TEXT_SECONDARY, fontFamily: "PlusJakartaSans_700Bold", textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>
                {category?.label ?? "Expense"}
              </Typography>
              <Typography style={{ fontSize: 32, fontWeight: "700", color: TEXT_PRIMARY, fontFamily: "DMSerifDisplay_400Regular", lineHeight: 40 }}>
                {expense.title}
              </Typography>
            </View>
            <View style={{ width: 64, height: 64, borderRadius: 0, backgroundColor: "transparent", borderWidth: 1, borderColor: SEPARATOR, alignItems: "center", justifyContent: "center" }}>
              <CategoryIcon size={32} color={TEXT_PRIMARY} strokeWidth={1.5} />
            </View>
          </View>

          <View style={{ marginBottom: 32 }}>
            <Typography style={{ fontSize: 72, lineHeight: 80, fontWeight: "800", color: TEXT_PRIMARY, fontFamily: "PlusJakartaSans_800ExtraBold", letterSpacing: -2 }}>
              {formatAmt(expense.amount)}
            </Typography>
          </View>

          <View style={{ gap: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Typography style={{ fontSize: 16, color: TEXT_SECONDARY, fontFamily: "PlusJakartaSans_500Medium" }}>Date</Typography>
              <Typography style={{ fontSize: 16, fontWeight: "700", color: TEXT_PRIMARY, fontFamily: "PlusJakartaSans_700Bold" }}>{dateStr}</Typography>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Typography style={{ fontSize: 16, color: TEXT_SECONDARY, fontFamily: "PlusJakartaSans_500Medium" }}>Paid by</Typography>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <AppUserAvatar user={expense.paidByUser} size="sm" />
                <Typography style={{ fontSize: 16, fontWeight: "700", color: TEXT_PRIMARY, fontFamily: "PlusJakartaSans_700Bold" }}>
                  {paidByMe ? "You" : expense.paidByUser.name}
                </Typography>
              </View>
            </View>

            {group && (
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Typography style={{ fontSize: 16, color: TEXT_SECONDARY, fontFamily: "PlusJakartaSans_500Medium" }}>Group</Typography>
                <Typography style={{ fontSize: 16, fontWeight: "700", color: TEXT_PRIMARY, fontFamily: "PlusJakartaSans_700Bold" }}>
                  {group.name}
                </Typography>
              </View>
            )}

            {expense.notes && (
              <View style={{ marginTop: 8, paddingTop: 16, borderTopWidth: 1, borderTopColor: SEPARATOR }}>
                <Typography style={{ fontSize: 14, color: TEXT_SECONDARY, fontFamily: "PlusJakartaSans_500Medium", lineHeight: 22, fontStyle: "italic" }}>
                  "{expense.notes}"
                </Typography>
              </View>
            )}
          </View>
        </Animated.View>

        {/* ── Split Breakdown ── */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)} style={{ paddingHorizontal: 24, paddingTop: 40 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <Typography style={{ fontSize: 12, fontWeight: "700", color: TEXT_SECONDARY, fontFamily: "PlusJakartaSans_700Bold", textTransform: "uppercase", letterSpacing: 2 }}>
              Split Breakdown
            </Typography>
            <View style={{ paddingHorizontal: 12, paddingVertical: 4, backgroundColor: "transparent", borderWidth: 1, borderColor: SEPARATOR, borderRadius: 12 }}>
              <Typography style={{ fontSize: 11, fontWeight: "700", color: TEXT_PRIMARY, fontFamily: "PlusJakartaSans_700Bold" }}>
                {expense.splitMethod === "equal" ? "EQUAL" : "CUSTOM"}
              </Typography>
            </View>
          </View>

          <View>
            {isAppLoading ? (
              <View style={{ gap: 16 }}>
                <Skeleton className="w-full h-[64px] rounded-none bg-[#E8E4DF]" />
                <Skeleton className="w-full h-[64px] rounded-none bg-[#E8E4DF]" />
              </View>
            ) : (
              expense.splits.map((split: any, idx: number) => {
                const isPaid = split.paid;
                const isMe = split.userId === currentUser.id;
                const isPayer = split.userId === expense.paidBy;

                return (
                  <View 
                    key={split.userId}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: 16,
                      borderBottomWidth: idx < expense.splits.length - 1 ? 1 : 0,
                      borderBottomColor: SEPARATOR,
                    }}
                  >
                    <AppUserAvatar user={split.user} size="lg" />
                    <View style={{ flex: 1, marginLeft: 16, justifyContent: "center" }}>
                      <Typography style={{ fontSize: 18, fontWeight: "700", color: TEXT_PRIMARY, fontFamily: "PlusJakartaSans_700Bold", marginBottom: 2 }}>
                        {isMe ? "You" : split.user.name}
                      </Typography>
                      <Typography style={{ fontSize: 14, color: TEXT_SECONDARY, fontFamily: "PlusJakartaSans_500Medium" }}>
                        {isPaid ? (isPayer ? "Paid the bill" : "Settled") : "Owes"}
                      </Typography>
                    </View>
                    <Typography style={{ fontSize: 20, fontWeight: "800", color: TEXT_PRIMARY, fontFamily: "PlusJakartaSans_800ExtraBold" }}>
                      {formatAmt(split.amount)}
                    </Typography>
                  </View>
                );
              })
            )}
          </View>
        </Animated.View>

        {/* ── My Share Summary ── */}
        {myShare && (
          <Animated.View entering={FadeInDown.duration(400).delay(200)} style={{ paddingHorizontal: 24, paddingTop: 40 }}>
            <View style={{ paddingVertical: 24, paddingHorizontal: 24, backgroundColor: "#8C7A6B", borderRadius: 0 }}>
              <Typography style={{ fontSize: 14, fontWeight: "700", color: "#FFFFFF", opacity: 0.7, fontFamily: "PlusJakartaSans_700Bold", textTransform: "uppercase", letterSpacing: 1.4, marginBottom: 8 }}>
                {paidByMe ? "You paid" : "Your Share"}
              </Typography>
              <Typography style={{ fontSize: 32, fontWeight: "800", color: "#FFFFFF", fontFamily: "PlusJakartaSans_800ExtraBold", marginBottom: 8 }}>
                {paidByMe ? formatAmt(expense.amount) : formatAmt(myShare.amount)}
              </Typography>
              <Typography style={{ fontSize: 14, color: "#FFFFFF", opacity: 0.9, fontFamily: "PlusJakartaSans_500Medium", lineHeight: 20 }}>
                {paidByMe
                  ? `Your share is ${formatAmt(myShare.amount)}. The rest is owed to you.`
                  : `You owe ${expense.paidByUser.name.split(" ")[0]} to settle up.`}
              </Typography>
            </View>
          </Animated.View>
        )}

      </ScrollView>
    </View>
  );
}
