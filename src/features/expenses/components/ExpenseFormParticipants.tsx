import React from "react";
import { View, ScrollView, TextInput } from "react-native";
import {
  Typography,
  PressableFeedback,
  Tabs,
  Spinner,
  Alert,
  Checkbox,
  Input,
} from "heroui-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as icons from "lucide-react-native";
import * as Haptics from "expo-haptics";
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
    <Animated.View entering={FadeInDown.duration(300)} className="mb-6">
      <Typography
        type="body-xs"
        className="text-muted-foreground font-bold tracking-widest mb-3 ml-8 uppercase"
      >
        WHO IS THIS WITH?
      </Typography>

      <View className="px-6 mb-4">
        <View className="flex-row items-center bg-white rounded-[16px] border border-border/50 h-[48px] px-4">
          <icons.Search size={20} color="#8A8798" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search friends or groups..."
            placeholderTextColor="#8A8798"
            className="flex-1 ml-2 font-medium text-foreground text-[16px]"
          />
          {searchQuery.length > 0 && (
            <PressableFeedback
              accessibilityRole="button"
              onPress={() => setSearchQuery("")}
              hitSlop={8}
            >
              <icons.XCircle size={18} color="#8A8798" />
            </PressableFeedback>
          )}
        </View>
      </View>

      {selectedFriends.length > 0 && (
        <View className="px-6 mb-4">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            {selectedFriends.map((f) => (
              <View
                key={f.id}
                className="flex-row items-center bg-primary/10 pl-1.5 pr-3 py-1.5 rounded-full border border-primary/20 gap-2"
              >
                <AppUserAvatar user={f} size="sm" />
                <Typography type="body-sm" className="font-bold text-primary">
                  {f.name.split(" ")[0]}
                </Typography>
                <PressableFeedback
                  accessibilityRole="button"
                  onPress={() => setSelectedFriendIds((prev) => prev.filter((id) => id !== f.id))}
                >
                  <View className="bg-white/50 rounded-full p-1 ml-1">
                    <icons.X size={12} className="text-primary" strokeWidth={3} />
                  </View>
                </PressableFeedback>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* ── Tabs ────────────────────────── */}
      <Tabs
        value={selectionTab}
        onValueChange={setSelectionTab as any}
        variant="primary"
        className="px-6 gap-4"
      >
        <Tabs.List className="w-full bg-white rounded-[16px] p-1 border border-border">
          <Tabs.Indicator className="bg-primary rounded-[12px]" />
          <Tabs.Trigger value="friends" className="flex-1 h-[40px]">
            {({ isSelected }) => (
              <Tabs.Label
                className={`font-bold text-sm ${isSelected ? "text-white" : "text-foreground"}`}
              >
                Friends
              </Tabs.Label>
            )}
          </Tabs.Trigger>
          <Tabs.Trigger value="groups" className="flex-1 h-[40px]">
            {({ isSelected }) => (
              <Tabs.Label
                className={`font-bold text-sm ${isSelected ? "text-white" : "text-foreground"}`}
              >
                Groups
              </Tabs.Label>
            )}
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="friends">
          <View className="rounded-[24px]">
            <View className="bg-white rounded-[24px] overflow-hidden border border-border">
              {filteredFriends.length > 0 ? (
                filteredFriends.map((f, idx) => {
                  const isSelected = selectedFriendIds.includes(f.id);
                  return (
                    <PressableFeedback
                      accessibilityRole="button"
                      key={f.id}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedGroupId("");
                        setSelectedFriendIds((prev) =>
                          prev.includes(f.id) ? prev.filter((id) => id !== f.id) : [...prev, f.id]
                        );
                      }}
                    >
                      <View
                        className={`flex-row items-center p-4 ${idx < filteredFriends.length - 1 ? "border-b border-border/50" : ""}`}
                      >
                        <AppUserAvatar user={f} size="md" />
                        <Typography type="body" className="flex-1 font-bold text-foreground ml-4">
                          {f.name}
                        </Typography>
                        <View
                          className={`w-6 h-6 rounded-full border items-center justify-center ${isSelected ? "bg-primary border-primary" : "border-muted"}`}
                        >
                          {isSelected && <icons.Check size={14} color="white" strokeWidth={3} />}
                        </View>
                      </View>
                    </PressableFeedback>
                  );
                })
              ) : (
                <View className="p-8 items-center justify-center">
                  <Typography type="body" className="text-muted-foreground text-center">
                    No friends found.
                  </Typography>
                </View>
              )}
            </View>
          </View>
        </Tabs.Content>

        <Tabs.Content value="groups">
          <View className="rounded-[24px]">
            <View className="bg-white rounded-[24px] overflow-hidden border border-border">
              {filteredGroups.length > 0 ? (
                filteredGroups.map((g, idx) => {
                  const GroupIcon = (icons as any)[g.icon] || icons.Users;
                  const isSelected = selectedGroupId === g.id;
                  return (
                    <PressableFeedback
                      accessibilityRole="button"
                      key={g.id}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedFriendIds([]);
                        setSelectedGroupId((prev) => (prev === g.id ? "" : g.id));
                      }}
                    >
                      <View
                        className={`flex-row items-center p-4 ${idx < filteredGroups.length - 1 ? "border-b border-border/50" : ""}`}
                      >
                        <View className="w-12 h-12 rounded-[16px] bg-primary/10 items-center justify-center">
                          <GroupIcon size={24} className="text-primary" />
                        </View>
                        <Typography type="body" className="flex-1 font-bold text-foreground ml-4">
                          {g.name}
                        </Typography>
                        <View
                          className={`w-6 h-6 rounded-full border items-center justify-center ${isSelected ? "bg-primary border-primary" : "border-muted"}`}
                        >
                          {isSelected && <icons.Check size={14} color="white" strokeWidth={3} />}
                        </View>
                      </View>
                    </PressableFeedback>
                  );
                })
              ) : (
                <View className="p-8 items-center justify-center">
                  <Typography type="body" className="text-muted-foreground text-center">
                    No groups found.
                  </Typography>
                </View>
              )}
            </View>
          </View>
        </Tabs.Content>
      </Tabs>

      {groups.length === 0 && uniqueFriends.length === 0 && (
        <View className="px-6 mt-4">
          <Alert status="default" className="rounded-[20px]">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>No groups or friends yet</Alert.Title>
              <Alert.Description>Create a group first to add expenses.</Alert.Description>
            </Alert.Content>
          </Alert>
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
    <View className="px-6 mb-6">
      <View className="flex-row justify-between items-end mb-3 ml-2 mr-2">
        <Typography
          type="body-xs"
          className="text-muted-foreground font-bold tracking-widest uppercase"
        >
          PARTICIPANTS
        </Typography>
        {splitMethod === "custom" && parsedAmount > 0 && (
          <Typography
            type="body-xs"
            className={`font-bold ${remainingCustom === 0 ? "text-success" : "text-danger"}`}
          >
            Remaining: {formatAmount(remainingCustom, expenseCurrency)}
          </Typography>
        )}
        {splitMethod === "percentage" && parsedAmount > 0 && (
          <Typography
            type="body-xs"
            className={`font-bold ${remainingPercent === 0 ? "text-success" : "text-danger"}`}
          >
            Remaining: {remainingPercent.toFixed(1)}%
          </Typography>
        )}
      </View>
      <View className="bg-white rounded-[24px] overflow-hidden border border-border">
        {participants.map((u, idx) => {
          const isIncluded = included[u.id] ?? true;
          return (
            <View key={u.id}>
              <View
                className={`flex-row items-center gap-4 p-4 ${idx < participants.length - 1 ? "border-b border-border/50" : ""}`}
              >
                <Checkbox
                  isSelected={isIncluded}
                  onSelectedChange={(v) => setIncluded((prev) => ({ ...prev, [u.id]: v }))}
                >
                  <Checkbox.Indicator />
                </Checkbox>

                <AppUserAvatar user={u} size="sm" />

                <Typography type="body" className="flex-1 font-bold text-foreground">
                  {u.id === currentUserId ? "You" : u.name}
                </Typography>

                {splitMethod === "equal" && isIncluded && parsedAmount > 0 && (
                  <View className="bg-success/10 px-3 py-1.5 rounded-full border border-success/20">
                    <Typography type="body-sm" className="font-bold text-success">
                      {formatAmount(equalShare, expenseCurrency)}
                    </Typography>
                  </View>
                )}

                {splitMethod === "custom" && isIncluded && (
                  <View className="w-[100px]">
                    <Input
                      placeholder="0.00"
                      value={customAmounts[u.id] ?? ""}
                      onChangeText={(v) => setCustomAmounts((prev) => ({ ...prev, [u.id]: v }))}
                      keyboardType="decimal-pad"
                      className="bg-background h-[44px] rounded-[14px] px-3 border border-border font-bold text-[16px] text-right"
                    />
                  </View>
                )}

                {splitMethod === "percentage" && isIncluded && (
                  <View className="flex-row items-center gap-2">
                    <View className="w-[80px]">
                      <Input
                        placeholder="0"
                        value={customPercentages[u.id] ?? ""}
                        onChangeText={(v) =>
                          setCustomPercentages((prev) => ({ ...prev, [u.id]: v }))
                        }
                        keyboardType="decimal-pad"
                        className="bg-background h-[44px] rounded-[14px] px-3 border border-border font-bold text-[16px] text-right"
                      />
                    </View>
                    <Typography type="body-sm" className="font-bold text-muted-foreground">
                      %
                    </Typography>
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}
