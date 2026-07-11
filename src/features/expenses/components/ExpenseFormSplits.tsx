import React from "react";
import { View, ScrollView, Pressable } from "react-native";
import { Typography } from "heroui-native";
import * as icons from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { SectionLabel } from "@/components/ui/native-ui";
import type { ExpenseCategory, SplitMethod, User } from "@/types";
import { EXPENSE_CATEGORIES } from "@/types";

const TEXT_PRIMARY = "#000000";
const TEXT_SECONDARY = "#8A8782";
const SEPARATOR = "#E8E4DF";

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
      <View style={{ marginBottom: 40 }}>
        <View style={{ paddingHorizontal: 24 }}>
          <SectionLabel>Category</SectionLabel>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}
        >
          {EXPENSE_CATEGORIES.map((cat) => {
            const CatIcon = (icons as any)[cat.icon] || icons.Package;
            const isSelected = category === cat.key;
            return (
              <Pressable
                accessibilityRole="button"
                key={cat.key}
                onPress={() => {
                  Haptics.selectionAsync();
                  setCategory(cat.key);
                }}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  paddingHorizontal: 20,
                  height: 48,
                  borderRadius: 0,
                  backgroundColor: isSelected ? "#8C7A6B" : "transparent",
                  borderWidth: 1,
                  borderColor: isSelected ? "#8C7A6B" : SEPARATOR,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <CatIcon
                  size={18}
                  color={isSelected ? "#FFFFFF" : TEXT_PRIMARY}
                  strokeWidth={isSelected ? 2 : 1.5}
                />
                <Typography
                  style={{
                    fontSize: 15,
                    fontFamily: "IBMPlexSans_600SemiBold",
                    color: isSelected ? "#FFFFFF" : TEXT_PRIMARY,
                  }}
                >
                  {cat.label}
                </Typography>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Paid by ────────────────────────────── */}
      <View style={{ marginBottom: 40 }}>
        <View style={{ paddingHorizontal: 24 }}>
          <SectionLabel>Paid By</SectionLabel>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}
        >
          {participants.map((u) => {
            const isSelected = paidBy === u.id;
            return (
              <Pressable
                accessibilityRole="button"
                key={u.id}
                onPress={() => {
                  Haptics.selectionAsync();
                  setPaidBy(u.id);
                }}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  paddingLeft: 4,
                  paddingRight: 20,
                  height: 48,
                  borderRadius: 0,
                  backgroundColor: isSelected ? "#8C7A6B" : "transparent",
                  borderWidth: 1,
                  borderColor: isSelected ? "#8C7A6B" : SEPARATOR,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <AppUserAvatar user={u} size="md" />
                <Typography
                  style={{
                    fontSize: 15,
                    fontFamily: "IBMPlexSans_600SemiBold",
                    color: isSelected ? "#FFFFFF" : TEXT_PRIMARY,
                  }}
                >
                  {u.id === currentUserId ? "You" : u.name.split(" ")[0]}
                </Typography>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Split method ───────────────────────── */}
      <View style={{ paddingHorizontal: 24, marginBottom: 40 }}>
        <SectionLabel>Split Method</SectionLabel>
        <View
          style={{
            flexDirection: "row",
            backgroundColor: "transparent",
            borderBottomWidth: 1,
            borderBottomColor: SEPARATOR,
          }}
        >
          {SPLIT_METHODS.map((method) => {
            const isSelected = splitMethod === method.key;
            return (
              <Pressable
                key={method.key}
                accessibilityRole="button"
                onPress={() => {
                  Haptics.selectionAsync();
                  setSplitMethod(method.key);
                }}
                style={({ pressed }) => ({
                  flex: 1,
                  paddingVertical: 12,
                  alignItems: "center",
                  borderBottomWidth: 2,
                  borderBottomColor: isSelected ? "#8C7A6B" : "transparent",
                  opacity: pressed ? 0.5 : 1,
                })}
              >
                <Typography
                  style={{
                    fontSize: 15,
                    fontFamily: "IBMPlexSans_600SemiBold",
                    color: isSelected ? TEXT_PRIMARY : TEXT_SECONDARY,
                  }}
                >
                  {method.label}
                </Typography>
              </Pressable>
            );
          })}
        </View>
      </View>
    </>
  );
}
