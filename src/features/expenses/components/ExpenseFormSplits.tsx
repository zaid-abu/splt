import React from "react";
import { View, ScrollView } from "react-native";
import { Typography, PressableFeedback } from "heroui-native";
import * as icons from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import type { ExpenseCategory, SplitMethod, User } from "@/types";
import { EXPENSE_CATEGORIES } from "@/types";

const SPLIT_METHODS: { key: SplitMethod; label: string; desc: string }[] = [
  { key: "equal", label: "Equal", desc: "Divide equally" },
  { key: "custom", label: "Custom", desc: "Enter amounts" },
  { key: "percentage", label: "Percent", desc: "Set %" },
];

interface ExpenseFormSelectorsProps {
  category: ExpenseCategory;
  setCategory: (cat: ExpenseCategory) => void;
  paidBy: string;
  setPaidBy: (userId: string) => void;
  splitMethod: SplitMethod;
  setSplitMethod: (method: SplitMethod) => void;
  participants: User[];
  currentUserId: string;
}

export function ExpenseFormSelectors({
  category,
  setCategory,
  paidBy,
  setPaidBy,
  splitMethod,
  setSplitMethod,
  participants,
  currentUserId,
}: ExpenseFormSelectorsProps) {
  return (
    <>
      {/* ── Category ───────────────────────────── */}
      <View className="mb-6">
        <Typography
          type="body-xs"
          className="text-muted-foreground font-bold tracking-widest mb-3 ml-8 uppercase"
        >
          CATEGORY
        </Typography>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, gap: 10 }}
        >
          {EXPENSE_CATEGORIES.map((cat) => {
            const CatIcon = (icons as any)[cat.icon] || icons.Package;
            const isSelected = category === cat.key;
            return (
              <PressableFeedback
                accessibilityRole="button"
                key={cat.key}
                onPress={() => {
                  Haptics.selectionAsync();
                  setCategory(cat.key);
                }}
              >
                <View
                  className={`flex-row items-center gap-2 px-4 h-[44px] rounded-full border-2 ${isSelected ? "bg-primary border-primary" : "bg-white border-transparent"}`}
                >
                  <CatIcon
                    size={18}
                    color={isSelected ? "white" : "#8A8798"}
                    strokeWidth={isSelected ? 2.5 : 2}
                  />
                  <Typography
                    type="body-sm"
                    className={`font-bold ${isSelected ? "text-white" : "text-foreground"}`}
                  >
                    {cat.label}
                  </Typography>
                </View>
              </PressableFeedback>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Paid by ────────────────────────────── */}
      <View className="mb-6">
        <Typography
          type="body-xs"
          className="text-muted-foreground font-bold tracking-widest mb-3 ml-8 uppercase"
        >
          PAID BY
        </Typography>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, gap: 10 }}
        >
          {participants.map((u) => {
            const isSelected = paidBy === u.id;
            return (
              <PressableFeedback
                accessibilityRole="button"
                key={u.id}
                onPress={() => {
                  Haptics.selectionAsync();
                  setPaidBy(u.id);
                }}
              >
                <View
                  className={`flex-row items-center gap-2 px-2 pr-4 h-[44px] rounded-full border-2 ${isSelected ? "bg-primary border-primary" : "bg-white border-transparent"}`}
                >
                  <AppUserAvatar user={u} size="sm" />
                  <Typography
                    type="body-sm"
                    className={`font-bold ${isSelected ? "text-white" : "text-foreground"}`}
                  >
                    {u.id === currentUserId ? "You" : u.name.split(" ")[0]}
                  </Typography>
                </View>
              </PressableFeedback>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Split method ───────────────────────── */}
      <View className="px-6 mb-6">
        <Typography
          type="body-xs"
          className="text-muted-foreground font-bold tracking-widest mb-3 ml-2 uppercase"
        >
          SPLIT METHOD
        </Typography>
        <View className="flex-row gap-3">
          {SPLIT_METHODS.map((method) => {
            const isSelected = splitMethod === method.key;
            return (
              <View key={method.key} className="flex-1">
                <PressableFeedback
                  accessibilityRole="button"
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSplitMethod(method.key);
                  }}
                >
                  <View
                    className={`h-[48px] rounded-[16px] items-center justify-center border-2 ${isSelected ? "bg-primary border-primary" : "bg-white border-transparent"}`}
                  >
                    <Typography
                      type="body-sm"
                      className={`font-bold ${isSelected ? "text-white" : "text-foreground"}`}
                    >
                      {method.label}
                    </Typography>
                  </View>
                </PressableFeedback>
              </View>
            );
          })}
        </View>
      </View>
    </>
  );
}
