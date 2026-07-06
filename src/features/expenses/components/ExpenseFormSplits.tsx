import React from "react";
import { View, ScrollView } from "react-native";
import * as icons from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import type { ExpenseCategory, SplitMethod, User } from "@/types";
import { EXPENSE_CATEGORIES } from "@/types";

const SPLIT_METHODS: { key: SplitMethod; label: string }[] = [
  { key: "equal", label: "Equal" },
  { key: "custom", label: "Custom" },
  { key: "percentage", label: "%" },
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
      <View className="mb-10">
        <Text variant="label" className="px-6">
          Category
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, gap: 10 }}
          className="mt-4"
        >
          {EXPENSE_CATEGORIES.map((cat) => {
            const CatIcon = (icons as any)[cat.icon] || icons.Package;
            const isSelected = category === cat.key;
            return (
              <Button
                key={cat.key}
                variant={isSelected ? "primary" : "secondary"}
                size="sm"
                leftIcon={
                  <CatIcon
                    size={16}
                    color={isSelected ? "#FAFAFA" : "#FAFAFA"}
                    strokeWidth={1.5}
                  />
                }
                onPress={() => {
                  Haptics.selectionAsync();
                  setCategory(cat.key);
                }}
              >
                {cat.label}
              </Button>
            );
          })}
        </ScrollView>
      </View>

      <View className="mb-10">
        <Text variant="label" className="px-6">
          Paid By
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, gap: 10 }}
          className="mt-4"
        >
          {participants.map((u) => {
            const isSelected = paidBy === u.id;
            return (
              <Button
                key={u.id}
                variant={isSelected ? "primary" : "secondary"}
                size="sm"
                leftIcon={<AppUserAvatar user={u} size="sm" />}
                onPress={() => {
                  Haptics.selectionAsync();
                  setPaidBy(u.id);
                }}
              >
                {u.id === currentUserId ? "You" : u.name.split(" ")[0]}
              </Button>
            );
          })}
        </ScrollView>
      </View>

      <View className="px-6 mb-10">
        <Text variant="label">Split Method</Text>
        <View className="flex-row bg-surface border border-border rounded-xl mt-4 overflow-hidden">
          {SPLIT_METHODS.map((method) => {
            const isSelected = splitMethod === method.key;
            return (
              <Button
                key={method.key}
                variant={isSelected ? "primary" : "ghost"}
                size="sm"
                fullWidth
                className="rounded-none border-0 flex-1"
                onPress={() => {
                  Haptics.selectionAsync();
                  setSplitMethod(method.key);
                }}
              >
                {method.label}
              </Button>
            );
          })}
        </View>
      </View>
    </>
  );
}
