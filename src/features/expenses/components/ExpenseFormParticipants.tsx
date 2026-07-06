import React from "react";
import { View, ScrollView, Pressable } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as icons from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { Text } from "@/components/ui/Text";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { formatAmount } from "@/components/ui/AmountDisplay";
import type { User, Group, SplitMethod } from "@/types";

interface SelectionTabsProps {
  selectionTab: "friends" | "groups";
  setSelectionTab: (tab: "friends" | "groups") => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedFriendIds: string[];
  setSelectedFriendIds: (ids: string[] | ((prev: string[]) => string[])) => void;
  selectedGroupId: string;
  setSelectedGroupId: (id: string | ((prev: string) => string)) => void;
  filteredFriends: User[];
  filteredGroups: Group[];
  selectedFriends: User[];
  uniqueFriends: User[];
  groups: Group[];
}

export function ExpenseSelectionTabs({
  selectionTab,
  setSelectionTab,
  searchQuery,
  setSearchQuery,
  selectedFriendIds,
  setSelectedFriendIds,
  selectedGroupId,
  setSelectedGroupId,
  filteredFriends,
  filteredGroups,
  selectedFriends,
  uniqueFriends,
  groups,
}: SelectionTabsProps) {
  return (
    <Animated.View entering={FadeInDown.duration(300)} className="mb-8">
      <View className="px-6">
        <Text variant="label">Who is this with?</Text>
      </View>

      <View className="px-6 mt-4 mb-8">
        <Input
          leftElement={<icons.Search size={20} color="#8E8E93" strokeWidth={1.5} />}
          rightElement={
            searchQuery.length > 0 ? (
              <Pressable accessibilityRole="button" onPress={() => setSearchQuery("")} hitSlop={8}>
                <icons.XCircle size={18} color="#8E8E93" strokeWidth={1.5} />
              </Pressable>
            ) : undefined
          }
          placeholder="Search friends or groups..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {selectedFriends.length > 0 && (
        <View className="px-6 mb-8">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            {selectedFriends.map((f) => (
              <View
                key={f.id}
                className="flex-row items-center bg-surface border border-border rounded-full pl-1 pr-3 py-1 gap-2"
              >
                <AppUserAvatar user={f} size="sm" />
                <Text variant="body-sm" weight="bold">
                  {f.name.split(" ")[0]}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setSelectedFriendIds((prev) => prev.filter((id) => id !== f.id))}
                  className="p-1 -mr-1"
                >
                  <icons.X size={12} color="#8E8E93" strokeWidth={2.5} />
                </Pressable>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      <View className="px-6 mb-6">
        <View className="flex-row border-b border-border">
          {(["friends", "groups"] as const).map((tab) => {
            const isSelected = selectionTab === tab;
            return (
              <Pressable
                key={tab}
                accessibilityRole="button"
                onPress={() => setSelectionTab(tab)}
                className={`flex-1 items-center py-3 border-b-2 ${
                  isSelected ? "border-primary" : "border-transparent"
                } active:opacity-50`}
              >
                <Text
                  variant="body-sm"
                  weight="bold"
                  color={isSelected ? "foreground" : "muted"}
                  className="capitalize"
                >
                  {tab}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View className="px-6">
        {selectionTab === "friends" &&
          (filteredFriends.length > 0 ? (
            filteredFriends.map((f, idx) => {
              const isSelected = selectedFriendIds.includes(f.id);
              return (
                <Pressable
                  accessibilityRole="button"
                  key={f.id}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedGroupId("");
                    setSelectedFriendIds((prev) =>
                      prev.includes(f.id) ? prev.filter((id) => id !== f.id) : [...prev, f.id]
                    );
                  }}
                  className={`flex-row items-center py-4 ${
                    idx < filteredFriends.length - 1 ? "border-b border-divider" : ""
                  } active:opacity-50`}
                >
                  <AppUserAvatar user={f} size="md" />
                  <Text variant="body" weight="bold" className="flex-1 ml-4">
                    {f.name}
                  </Text>
                  <View
                    className={`w-6 h-6 rounded-full items-center justify-center ${
                      isSelected ? "bg-primary border-0" : "border-2 border-border bg-transparent"
                    }`}
                  >
                    {isSelected && <icons.Check size={14} color="#FAFAFA" strokeWidth={3} />}
                  </View>
                </Pressable>
              );
            })
          ) : (
            <View className="py-8 items-center">
              <Text color="muted">No friends found.</Text>
            </View>
          ))}

        {selectionTab === "groups" &&
          (filteredGroups.length > 0 ? (
            filteredGroups.map((g, idx) => {
              const GroupIcon = (icons as any)[g.icon] || icons.Users;
              const isSelected = selectedGroupId === g.id;
              return (
                <Pressable
                  accessibilityRole="button"
                  key={g.id}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedFriendIds([]);
                    setSelectedGroupId((prev) => (prev === g.id ? "" : g.id));
                  }}
                  className={`flex-row items-center py-4 ${
                    idx < filteredGroups.length - 1 ? "border-b border-divider" : ""
                  } active:opacity-50`}
                >
                  <View className="w-12 h-12 rounded-xl bg-surface-2 border border-border items-center justify-center">
                    <GroupIcon size={24} color="#FAFAFA" strokeWidth={1.5} />
                  </View>
                  <Text variant="body" weight="bold" className="flex-1 ml-4">
                    {g.name}
                  </Text>
                  <View
                    className={`w-6 h-6 rounded-full items-center justify-center ${
                      isSelected ? "bg-primary border-0" : "border-2 border-border bg-transparent"
                    }`}
                  >
                    {isSelected && <icons.Check size={14} color="#FAFAFA" strokeWidth={3} />}
                  </View>
                </Pressable>
              );
            })
          ) : (
            <View className="py-8 items-center">
              <Text color="muted">No groups found.</Text>
            </View>
          ))}
      </View>

      {groups.length === 0 && uniqueFriends.length === 0 && (
        <View className="px-6 mt-8">
          <View className="py-6 items-center border-y border-border">
            <Text variant="body" weight="bold" className="mb-2">
              No groups or friends yet
            </Text>
            <Text variant="body-sm" color="muted" className="text-center">
              Create a group first to add expenses.
            </Text>
          </View>
        </View>
      )}
    </Animated.View>
  );
}

interface ExpenseParticipantsProps {
  participants: User[];
  included: Record<string, boolean>;
  setIncluded: (
    val: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)
  ) => void;
  splitMethod: SplitMethod;
  parsedAmount: number;
  remainingCustom: number;
  remainingPercent: number;
  expenseCurrency: string;
  equalShare: number;
  customAmounts: Record<string, string>;
  setCustomAmounts: (
    val: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)
  ) => void;
  customPercentages: Record<string, string>;
  setCustomPercentages: (
    val: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)
  ) => void;
  currentUserId: string;
}

export function ExpenseFormParticipants({
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
}: ExpenseParticipantsProps) {
  return (
    <View className="px-6 mb-8">
      <View className="flex-row justify-between items-center mb-2">
        <Text variant="label">Participants</Text>

        {splitMethod === "custom" && parsedAmount > 0 && (
          <Text
            variant="body-xs"
            weight="bold"
            color={remainingCustom === 0 ? "success" : "danger"}
          >
            Remaining: {formatAmount(remainingCustom, expenseCurrency)}
          </Text>
        )}
        {splitMethod === "percentage" && parsedAmount > 0 && (
          <Text
            variant="body-xs"
            weight="bold"
            color={remainingPercent === 0 ? "success" : "danger"}
          >
            Remaining: {remainingPercent.toFixed(1)}%
          </Text>
        )}
      </View>

      <View>
        {participants.map((u, idx) => {
          const isIncluded = included[u.id] ?? true;
          return (
            <View
              key={u.id}
              className={`flex-row items-center py-4 ${
                idx < participants.length - 1 ? "border-b border-divider" : ""
              } ${isIncluded ? "" : "opacity-40"}`}
            >
              <Pressable
                accessibilityRole="checkbox"
                onPress={() => setIncluded((prev) => ({ ...prev, [u.id]: !isIncluded }))}
                className={`w-6 h-6 rounded-md items-center justify-center mr-4 ${
                  isIncluded ? "bg-primary border-0" : "border-2 border-border bg-transparent"
                }`}
              >
                {isIncluded && <icons.Check size={14} color="#FAFAFA" strokeWidth={3} />}
              </Pressable>

              <AppUserAvatar user={u} size="md" />

              <Text variant="body" weight="bold" className="flex-1 ml-4">
                {u.id === currentUserId ? "You" : u.name}
              </Text>

              {splitMethod === "equal" && isIncluded && parsedAmount > 0 && (
                <View className="bg-surface-2 border border-border rounded-xl px-3 py-1.5">
                  <Text variant="body-sm" weight="bold">
                    {formatAmount(equalShare, expenseCurrency)}
                  </Text>
                </View>
              )}

              {splitMethod === "custom" && isIncluded && (
                <View className="w-28">
                  <Input
                    placeholder="0.00"
                    value={customAmounts[u.id] ?? ""}
                    onChangeText={(v) => setCustomAmounts((prev) => ({ ...prev, [u.id]: v }))}
                    keyboardType="decimal-pad"
                    className="h-12 rounded-xl text-right"
                  />
                </View>
              )}

              {splitMethod === "percentage" && isIncluded && (
                <View className="flex-row items-center gap-2">
                  <View className="w-24">
                    <Input
                      placeholder="0"
                      value={customPercentages[u.id] ?? ""}
                      onChangeText={(v) => setCustomPercentages((prev) => ({ ...prev, [u.id]: v }))}
                      keyboardType="decimal-pad"
                      className="h-12 rounded-xl text-right"
                    />
                  </View>
                  <Text variant="body" color="muted" weight="bold">
                    %
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}
