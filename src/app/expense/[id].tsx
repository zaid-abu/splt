import {
  Button,
  Dialog,
  Typography,
  Skeleton
} from "heroui-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { JSX } from "react";
import { StatusBar } from "expo-status-bar";
import { ScrollView, Text, View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as icons from "lucide-react-native";

import { AppUserAvatar } from "@/components/MemberAvatar";
import { getCurrencySymbol } from "@/components/AmountDisplay";
import { useApp } from "@/context/AppContext";
import { EXPENSE_CATEGORIES } from "@/types";

export default function ExpenseDetailScreen(): JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getExpense, currentUser, getGroup, isAppLoading } = useApp();

  const expense = getExpense(id ?? "");
  const group = getGroup(expense?.groupId ?? "");
  const category = EXPENSE_CATEGORIES.find((c) => c.key === expense?.category);

  if (!expense) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F2F2F6' }} edges={["top"]}>
        <View className="flex-1 items-center justify-center px-5 gap-4">
          <icons.AlertCircle size={48} className="text-danger" />
          <Typography type="h3" className="font-bold">Expense not found</Typography>
          <Typography type="body" className="text-muted-foreground text-center">
            This expense may have been deleted or is unavailable.
          </Typography>
          <Button onPress={() => router.back()} className="mt-4 bg-white border border-border rounded-full" variant="outline">
            <Typography type="body" className="font-bold text-foreground">Go back</Typography>
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const sym = getCurrencySymbol(expense.currency);
  const isJPY = expense.currency === "JPY" || expense.currency === "KRW";
  const paidByMe = expense.paidBy === currentUser.id;
  const myShare = expense.splits.find((s) => s.userId === currentUser.id);

  const formatAmt = (n: number) =>
    `${sym}${n.toLocaleString("en-US", {
      minimumFractionDigits: isJPY ? 0 : 2,
      maximumFractionDigits: isJPY ? 0 : 2,
    })}`;

  const dateStr = expense.date.toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });

  const CategoryIcon = (icons as any)[category?.icon ?? "Package"] || icons.Package;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F2F2F6' }} edges={["top"]}>
      <StatusBar style="dark" />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header row ─────────────────────────────── */}
        <View className="flex-row items-center justify-between px-6 pt-4 mb-8">
          <Pressable 
            className="w-12 h-12 rounded-full bg-white items-center justify-center border border-border"
            onPress={() => router.back()}
          >
            <icons.ChevronLeft size={24} className="text-foreground" strokeWidth={2.5} />
          </Pressable>

          <Dialog>
            <Dialog.Trigger asChild>
              <Pressable className="w-12 h-12 rounded-full bg-white items-center justify-center border border-border">
                <icons.Trash2 size={20} className="text-danger" strokeWidth={2.5} />
              </Pressable>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay />
              <Dialog.Content className="rounded-[32px] p-6">
                <Dialog.Close />
                <View className="w-12 h-12 rounded-full bg-danger/10 items-center justify-center mb-4">
                  <icons.AlertTriangle size={24} className="text-danger" />
                </View>
                <Dialog.Title className="text-[22px] font-bold mb-2">Delete Expense?</Dialog.Title>
                <Dialog.Description className="text-[16px] text-muted-foreground mb-6">
                  Are you sure you want to delete &quot;{expense.title}&quot;? This cannot be undone.
                </Dialog.Description>
                <View className="flex-row gap-3">
                  <Dialog.Close asChild>
                    <Button variant="secondary" className="flex-1 rounded-full h-[56px] border border-border">Cancel</Button>
                  </Dialog.Close>
                  <Button
                    variant="danger"
                    className="flex-1 rounded-full h-[56px]"
                    onPress={() => {
                      router.back();
                    }}
                  >
                    Delete
                  </Button>
                </View>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog>
        </View>

        {/* ── Receipt Card ─────────────────────────────── */}
        <View className="mx-6 bg-white rounded-[32px] p-8 border border-border mb-6">
          
          <View className="items-center mb-6">
            <View className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 items-center justify-center mb-5">
              <CategoryIcon size={40} className="text-primary" strokeWidth={2} />
            </View>
            <Typography type="body" className="font-bold text-muted-foreground uppercase tracking-widest mb-2 text-center">
              {expense.title}
            </Typography>
            <Typography type="h1" className="text-[52px] font-black tracking-tighter text-foreground mb-4 text-center leading-tight">
              {formatAmt(expense.amount)}
            </Typography>
            <View className="px-4 py-2 bg-secondary rounded-full">
              <Typography type="body-sm" className="font-bold text-muted-foreground">
                {expense.splitMethod === 'equal' ? 'Split equally' : 'Split unequally'}
              </Typography>
            </View>
          </View>

          {/* Dashed Separator */}
          <View className="w-full border-t-[1.5px] border-dashed border-border my-6 relative">
             <View className="absolute w-6 h-6 bg-[#F2F2F6] rounded-full -left-[44px] -top-[13px] border-r border-border" />
             <View className="absolute w-6 h-6 bg-[#F2F2F6] rounded-full -right-[44px] -top-[13px] border-l border-border" />
          </View>

          {/* Meta rows */}
          <View className="gap-5 mb-2">
            <View className="flex-row justify-between items-center">
              <Typography type="body" className="text-muted-foreground font-medium">Date</Typography>
              <Typography type="body" className="font-bold text-foreground">{dateStr}</Typography>
            </View>
            <View className="flex-row justify-between items-center">
              <Typography type="body" className="text-muted-foreground font-medium">Paid by</Typography>
              <View className="flex-row items-center gap-2">
                <AppUserAvatar user={expense.paidByUser} size="sm" />
                <Typography type="body" className="font-bold text-foreground">
                  {paidByMe ? "You" : expense.paidByUser.name.split(" ")[0]}
                </Typography>
              </View>
            </View>
            {group && (
              <View className="flex-row justify-between items-center">
                <Typography type="body" className="text-muted-foreground font-medium">Group</Typography>
                <View className="flex-row items-center gap-2">
                  <View className="w-6 h-6 rounded-full bg-accent/20 items-center justify-center">
                    <icons.Users size={12} className="text-accent" />
                  </View>
                  <Typography type="body" className="font-bold text-foreground">{group.name}</Typography>
                </View>
              </View>
            )}
            {expense.notes && (
              <View className="mt-2 bg-secondary p-4 rounded-[16px]">
                <Typography type="body-sm" className="text-muted-foreground leading-5">{expense.notes}</Typography>
              </View>
            )}
          </View>
        </View>

        {/* ── Split breakdown ────────────────────────────── */}
        <View className="px-6 mb-6">
          <Typography type="body-xs" className="font-bold text-muted-foreground tracking-widest uppercase mb-4 ml-2">
            Split Breakdown
          </Typography>
          <View className="bg-white rounded-[24px] border border-border p-2">
            {isAppLoading ? (
              <View className="p-4 gap-4">
                <View className="flex-row items-center gap-4">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <View className="flex-1 gap-2">
                    <Skeleton className="w-24 h-4 rounded-full" />
                    <Skeleton className="w-16 h-3 rounded-full" />
                  </View>
                </View>
                <View className="flex-row items-center gap-4">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <View className="flex-1 gap-2">
                    <Skeleton className="w-32 h-4 rounded-full" />
                    <Skeleton className="w-20 h-3 rounded-full" />
                  </View>
                </View>
              </View>
            ) : expense.splits.map((split, idx) => {
              const isPaid = split.paid;
              const isMe = split.userId === currentUser.id;
              const isPayer = split.userId === expense.paidBy;

              return (
                <View key={split.userId}>
                  <View className="flex-row items-center p-3">
                    <AppUserAvatar user={split.user} size="md" />
                    <View className="flex-1 ml-4 justify-center">
                      <View className="flex-row items-center gap-2">
                        <Typography type="body" className="font-bold text-foreground text-[16px]">
                          {isMe ? "You" : split.user.name}
                        </Typography>
                        {isPayer && (
                          <View className="px-2 py-0.5 bg-primary/10 rounded-md">
                            <Typography type="body-xs" className="text-primary font-bold text-[10px] uppercase tracking-wider">Paid</Typography>
                          </View>
                        )}
                      </View>
                      <Typography type="body-sm" className="text-muted-foreground font-medium mt-0.5">
                        {isPaid 
                          ? (isPayer ? "Paid for group" : "Paid back ✓") 
                          : "Owes"}
                      </Typography>
                    </View>
                    <Typography
                      type="h3"
                      className={`font-black ${isPaid ? "text-foreground" : "text-danger"}`}
                    >
                      {formatAmt(split.amount)}
                    </Typography>
                  </View>
                  {idx < expense.splits.length - 1 && (
                    <View className="h-[1px] bg-border/50 mx-4 my-1" />
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* ── My share summary ──────────────────────────── */}
        {myShare && (
          <View className="px-6">
            <View className={`rounded-[24px] p-5 border ${paidByMe ? 'bg-success/10 border-success/20' : 'bg-danger/10 border-danger/20'}`}>
              <View className="flex-row items-center gap-4">
                <View className={`w-12 h-12 rounded-full items-center justify-center ${paidByMe ? 'bg-success/20' : 'bg-danger/20'}`}>
                  {paidByMe ? (
                    <icons.ArrowDownLeft size={24} className="text-success" />
                  ) : (
                    <icons.ArrowUpRight size={24} className="text-danger" />
                  )}
                </View>
                <View className="flex-1">
                  <Typography type="h3" className={`font-black mb-1 ${paidByMe ? 'text-success' : 'text-danger'}`}>
                    {paidByMe ? `You paid ${formatAmt(expense.amount)}` : `You owe ${formatAmt(myShare.amount)}`}
                  </Typography>
                  <Typography type="body-sm" className={`font-medium ${paidByMe ? 'text-success/70' : 'text-danger/70'}`}>
                    {paidByMe 
                      ? `Your share is ${formatAmt(myShare.amount)} · others owe you the rest`
                      : `Pay ${expense.paidByUser.name.split(" ")[0]} to settle up`}
                  </Typography>
                </View>
              </View>
            </View>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}
