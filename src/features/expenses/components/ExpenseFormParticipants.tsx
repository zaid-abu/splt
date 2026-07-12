import React from "react";
import { View, TextInput, Pressable } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { Typography, Checkbox } from "heroui-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as icons from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { formatAmount } from "@/components/ui/AmountDisplay";
import { SectionLabel, UI } from "@/components/ui/native-ui";
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
    <Animated.View entering={FadeInDown.duration(300)}>
      <View style={{ marginBottom: 24 }}>
        <SectionLabel>Search</SectionLabel>
        <View
          style={{
            height: 52,
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            borderRadius: UI.radius.pill,
            borderWidth: 1,
            borderColor: UI.color.border,
            backgroundColor: UI.color.control,
            gap: 12,
          }}
        >
          <icons.Search size={18} color={UI.color.muted} strokeWidth={1.8} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search friends or groups..."
            placeholderTextColor={UI.color.muted}
            style={{
              flex: 1,
              fontFamily: "IBMPlexSans_500Medium",
              color: UI.color.text,
              fontSize: 16,
              padding: 0,
            }}
          />
          {searchQuery.length > 0 && (
            <Pressable accessibilityRole="button" onPress={() => setSearchQuery("")} hitSlop={8}>
              <icons.XCircle size={18} color={UI.color.muted} strokeWidth={1.8} />
            </Pressable>
          )}
        </View>
      </View>

      <View style={{ marginBottom: 24 }}>
        <SectionLabel>Type</SectionLabel>
        <View
          style={{
            flexDirection: "row",
            backgroundColor: UI.color.control,
            borderWidth: 1,
            borderColor: UI.color.border,
            borderRadius: UI.radius.pill,
            padding: 4,
            gap: 4,
          }}
        >
          {(["friends", "groups"] as const).map((tab) => {
            const active = selectionTab === tab;
            return (
              <Pressable
                key={tab}
                accessibilityRole="button"
                onPress={() => setSelectionTab(tab)}
                style={({ pressed }) => ({
                  flex: 1,
                  height: 40,
                  borderRadius: UI.radius.pill,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: active ? UI.color.text : "transparent",
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Typography
                  style={{
                    color: active ? UI.color.textInverse : UI.color.text,
                    fontSize: 14,
                    textTransform: "capitalize",
                    fontFamily: "IBMPlexSans_600SemiBold",
                  }}
                >
                  {tab}
                </Typography>
              </Pressable>
            );
          })}
        </View>
      </View>

      {selectedFriends.length > 0 && !selectedGroupId && (
        <View style={{ marginBottom: 24 }}>
          <SectionLabel>Selected friends</SectionLabel>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={{ flexDirection: "row", gap: 8, paddingRight: 24 }}>
              {selectedFriends.map((f) => (
                <Pressable
                  key={f.id}
                  accessibilityRole="button"
                  onPress={() => setSelectedFriendIds((prev) => prev.filter((id) => id !== f.id))}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    height: 42,
                    paddingHorizontal: 14,
                    borderRadius: UI.radius.pill,
                    borderWidth: 1,
                    borderColor: UI.color.border,
                    backgroundColor: UI.color.control,
                    gap: 8,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <AppUserAvatar user={f} size="sm" />
                  <Typography
                    style={{
                      fontSize: 14,
                      color: UI.color.text,
                      fontFamily: "IBMPlexSans_600SemiBold",
                    }}
                  >
                    {f.name.split(" ")[0]}
                  </Typography>
                  <icons.X size={16} color={UI.color.muted} strokeWidth={1.8} />
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      <View style={{ marginBottom: 24 }}>
        <SectionLabel>{selectionTab === "friends" ? "Friends" : "Groups"}</SectionLabel>

        {(selectionTab === "friends" && filteredFriends.length === 0) ||
        (selectionTab === "groups" && filteredGroups.length === 0) ? (
          <View
            style={{
              padding: 24,
              borderRadius: UI.radius.lg,
              borderWidth: 1,
              borderColor: UI.color.border,
              backgroundColor: UI.color.surface,
              alignItems: "center",
            }}
          >
            <Typography style={{ color: UI.color.muted, fontFamily: "IBMPlexSans_500Medium" }}>
              No matching {selectionTab} found.
            </Typography>
          </View>
        ) : (
          <View
            style={{
              borderRadius: UI.radius.lg,
              borderWidth: 1,
              borderColor: UI.color.border,
              backgroundColor: UI.color.surface,
            }}
          >
            {selectionTab === "friends" &&
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
                    style={({ pressed }) => ({
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: 14,
                      paddingHorizontal: 16,
                      borderBottomWidth: idx < filteredFriends.length - 1 ? 1 : 0,
                      borderBottomColor: UI.color.border,
                      backgroundColor: pressed ? "#FBF7F2" : "transparent",
                    })}
                  >
                    <AppUserAvatar user={f} size="md" />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Typography
                        style={{
                          fontSize: 15,
                          color: UI.color.text,
                          fontFamily: "IBMPlexSans_600SemiBold",
                        }}
                      >
                        {f.name}
                      </Typography>
                      <Typography
                        style={{
                          fontSize: 13,
                          color: UI.color.muted,
                          fontFamily: "IBMPlexSans_500Medium",
                          marginTop: 2,
                        }}
                      >
                        Friend
                      </Typography>
                    </View>
                    <View
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 999,
                        borderWidth: isSelected ? 0 : 1,
                        borderColor: UI.color.border,
                        backgroundColor: isSelected ? UI.color.brand : "transparent",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {isSelected && (
                        <icons.Check size={13} color={UI.color.textInverse} strokeWidth={3} />
                      )}
                    </View>
                  </Pressable>
                );
              })}

            {selectionTab === "groups" &&
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
                    style={({ pressed }) => ({
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: 14,
                      paddingHorizontal: 16,
                      borderBottomWidth: idx < filteredGroups.length - 1 ? 1 : 0,
                      borderBottomColor: UI.color.border,
                      backgroundColor: pressed ? "#FBF7F2" : "transparent",
                    })}
                  >
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 14,
                        backgroundColor: UI.color.control,
                        borderWidth: 1,
                        borderColor: UI.color.border,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <GroupIcon size={18} color={UI.color.text} strokeWidth={1.8} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Typography
                        style={{
                          fontSize: 15,
                          color: UI.color.text,
                          fontFamily: "IBMPlexSans_600SemiBold",
                        }}
                      >
                        {g.name}
                      </Typography>
                      <Typography
                        style={{
                          fontSize: 13,
                          color: UI.color.muted,
                          fontFamily: "IBMPlexSans_500Medium",
                          marginTop: 2,
                        }}
                      >
                        {g.members.length} members • {g.currency}
                      </Typography>
                    </View>
                    <View
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 999,
                        borderWidth: isSelected ? 0 : 1,
                        borderColor: UI.color.border,
                        backgroundColor: isSelected ? UI.color.brand : "transparent",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {isSelected && (
                        <icons.Check size={13} color={UI.color.textInverse} strokeWidth={3} />
                      )}
                    </View>
                  </Pressable>
                );
              })}
          </View>
        )}
      </View>
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
    <View style={{ marginBottom: 32 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <Typography
          style={{
            fontSize: 11,
            letterSpacing: 1.2,
            color: UI.color.muted,
            fontFamily: "IBMPlexSans_600SemiBold",
            textTransform: "uppercase",
          }}
        >
          Participants
        </Typography>

        {splitMethod === "custom" && parsedAmount > 0 && (
          <Typography
            style={{
              fontSize: 12,
              fontFamily: "IBMPlexSans_600SemiBold",
              color: remainingCustom === 0 ? UI.color.success : UI.color.danger,
            }}
          >
            Remaining: {formatAmount(remainingCustom, expenseCurrency)}
          </Typography>
        )}
        {splitMethod === "percentage" && parsedAmount > 0 && (
          <Typography
            style={{
              fontSize: 12,
              fontFamily: "IBMPlexSans_600SemiBold",
              color: remainingPercent === 0 ? UI.color.success : UI.color.danger,
            }}
          >
            Remaining: {remainingPercent.toFixed(1)}%
          </Typography>
        )}
      </View>

      <View
        style={{
          borderRadius: UI.radius.lg,
          borderWidth: 1,
          borderColor: UI.color.border,
          backgroundColor: UI.color.surface,
        }}
      >
        {participants.map((u, idx) => {
          const isIncluded = included[u.id] ?? true;
          return (
            <View
              key={u.id}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 14,
                paddingHorizontal: 16,
                borderBottomWidth: idx < participants.length - 1 ? 1 : 0,
                borderBottomColor: UI.color.border,
                opacity: isIncluded ? 1 : 0.5,
              }}
            >
              <Checkbox
                isSelected={isIncluded}
                onSelectedChange={(v) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setIncluded((prev) => ({ ...prev, [u.id]: v }));
                }}
                style={{ marginRight: 16 }}
              >
                <Checkbox.Indicator />
              </Checkbox>

              <AppUserAvatar user={u} size="sm" />

              <Typography
                style={{
                  flex: 1,
                  marginLeft: 12,
                  fontSize: 15,
                  color: UI.color.text,
                  fontFamily: "IBMPlexSans_600SemiBold",
                }}
              >
                {u.id === currentUserId ? "You" : u.name}
              </Typography>

              {splitMethod === "equal" && isIncluded && parsedAmount > 0 && (
                <View
                  style={{
                    backgroundColor: UI.color.control,
                    borderWidth: 1,
                    borderColor: UI.color.border,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: UI.radius.pill,
                  }}
                >
                  <Typography
                    style={{
                      fontSize: 13,
                      color: UI.color.text,
                      fontFamily: "IBMPlexSans_600SemiBold",
                    }}
                  >
                    {formatAmount(equalShare, expenseCurrency)}
                  </Typography>
                </View>
              )}

              {splitMethod === "custom" && isIncluded && (
                <View style={{ width: 100 }}>
                  <TextInput
                    placeholder="0.00"
                    placeholderTextColor={UI.color.muted}
                    value={customAmounts[u.id] ?? ""}
                    onChangeText={(v) => setCustomAmounts((prev) => ({ ...prev, [u.id]: v }))}
                    keyboardType="decimal-pad"
                    style={{
                      backgroundColor: UI.color.control,
                      height: 42,
                      borderRadius: 12,
                      paddingHorizontal: 12,
                      borderWidth: 1,
                      borderColor: UI.color.border,
                      fontSize: 15,
                      color: UI.color.text,
                      fontFamily: "IBMPlexSans_600SemiBold",
                      textAlign: "right",
                    }}
                  />
                </View>
              )}

              {splitMethod === "percentage" && isIncluded && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <View style={{ width: 70 }}>
                    <TextInput
                      placeholder="0"
                      placeholderTextColor={UI.color.muted}
                      value={customPercentages[u.id] ?? ""}
                      onChangeText={(v) => setCustomPercentages((prev) => ({ ...prev, [u.id]: v }))}
                      keyboardType="decimal-pad"
                      style={{
                        backgroundColor: UI.color.control,
                        height: 42,
                        borderRadius: 12,
                        paddingHorizontal: 12,
                        borderWidth: 1,
                        borderColor: UI.color.border,
                        fontSize: 15,
                        color: UI.color.text,
                        fontFamily: "IBMPlexSans_600SemiBold",
                        textAlign: "right",
                      }}
                    />
                  </View>
                  <Typography
                    style={{
                      fontSize: 14,
                      color: UI.color.muted,
                      fontFamily: "IBMPlexSans_600SemiBold",
                    }}
                  >
                    %
                  </Typography>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}
