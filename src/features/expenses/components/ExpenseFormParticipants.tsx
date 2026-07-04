import React from "react";
import { View, ScrollView, TextInput, Pressable } from "react-native";
import { Typography, Checkbox } from "heroui-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as icons from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { formatAmount } from "@/components/ui/AmountDisplay";
import type { User, Group, SplitMethod } from "@/types";

const TEXT_PRIMARY = "#000000";
const TEXT_SECONDARY = "#8A8782";
const TEXT_DANGER = "#000000";
const TEXT_SUCCESS = "#4CAF82";
const SEPARATOR = "#E8E4DF";

function SectionLabel({ children }: { children: string }) {
  return (
    <Typography
      style={{
        fontSize: 11,
        fontWeight: "700",
        letterSpacing: 1.4,
        color: TEXT_SECONDARY,
        fontFamily: "PlusJakartaSans_700Bold",
        textTransform: "uppercase",
        marginBottom: 16,
      }}
    >
      {children}
    </Typography>
  );
}

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
    <Animated.View entering={FadeInDown.duration(300)} style={{ marginBottom: 32 }}>
      <View style={{ paddingHorizontal: 24 }}>
        <SectionLabel>Who is this with?</SectionLabel>
      </View>

      <View style={{ paddingHorizontal: 24, marginBottom: 32 }}>
        <View style={{ flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: SEPARATOR, paddingBottom: 12 }}>
          <icons.Search size={24} color={TEXT_PRIMARY} strokeWidth={1.5} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search friends or groups..."
            placeholderTextColor={TEXT_SECONDARY}
            style={{ flex: 1, marginLeft: 16, fontFamily: "PlusJakartaSans_500Medium", color: TEXT_PRIMARY, fontSize: 18 }}
          />
          {searchQuery.length > 0 && (
            <Pressable accessibilityRole="button" onPress={() => setSearchQuery("")} hitSlop={8}>
              <icons.XCircle size={20} color={TEXT_SECONDARY} strokeWidth={1.5} />
            </Pressable>
          )}
        </View>
      </View>

      {selectedFriends.length > 0 && (
        <View style={{ paddingHorizontal: 24, marginBottom: 32 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {selectedFriends.map((f) => (
              <View
                key={f.id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "transparent",
                  borderWidth: 1,
                  borderColor: SEPARATOR,
                  paddingLeft: 4,
                  paddingRight: 12,
                  paddingVertical: 4,
                  borderRadius: 0,
                  gap: 8,
                }}
              >
                <AppUserAvatar user={f} size="sm" />
                <Typography style={{ fontSize: 13, fontWeight: "700", color: TEXT_PRIMARY, fontFamily: "PlusJakartaSans_700Bold" }}>
                  {f.name.split(" ")[0]}
                </Typography>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setSelectedFriendIds((prev) => prev.filter((id) => id !== f.id))}
                  style={{ padding: 4, marginLeft: 4 }}
                >
                  <icons.X size={14} color={TEXT_PRIMARY} strokeWidth={3} />
                </Pressable>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* ── Tabs ────────────────────────── */}
      <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
        <View style={{ flexDirection: "row", backgroundColor: "transparent", borderBottomWidth: 1, borderBottomColor: SEPARATOR }}>
          {(["friends", "groups"] as const).map((tab) => {
            const isSelected = selectionTab === tab;
            return (
              <Pressable
                key={tab}
                accessibilityRole="button"
                onPress={() => setSelectionTab(tab)}
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
                    fontSize: 14,
                    fontWeight: "700",
                    fontFamily: "PlusJakartaSans_700Bold",
                    color: isSelected ? TEXT_PRIMARY : TEXT_SECONDARY,
                    textTransform: "capitalize",
                  }}
                >
                  {tab}
                </Typography>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={{ paddingHorizontal: 24 }}>
        <View>
          {selectionTab === "friends" && (
            filteredFriends.length > 0 ? (
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
                      paddingVertical: 16,
                      borderBottomWidth: idx < filteredFriends.length - 1 ? 1 : 0,
                      borderBottomColor: SEPARATOR,
                      opacity: pressed ? 0.5 : 1,
                    })}
                  >
                    <AppUserAvatar user={f} size="md" />
                    <Typography style={{ flex: 1, fontSize: 16, fontWeight: "700", color: TEXT_PRIMARY, fontFamily: "PlusJakartaSans_700Bold", marginLeft: 16 }}>
                      {f.name}
                    </Typography>
                    <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: isSelected ? 0 : 2, borderColor: SEPARATOR, backgroundColor: isSelected ? "#8C7A6B" : "transparent", alignItems: "center", justifyContent: "center" }}>
                      {isSelected && <icons.Check size={14} color="#FFFFFF" strokeWidth={3} />}
                    </View>
                  </Pressable>
                );
              })
            ) : (
              <View style={{ padding: 32, alignItems: "center" }}>
                <Typography style={{ color: TEXT_SECONDARY, fontFamily: "PlusJakartaSans_500Medium" }}>No friends found.</Typography>
              </View>
            )
          )}

          {selectionTab === "groups" && (
            filteredGroups.length > 0 ? (
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
                      paddingVertical: 16,
                      borderBottomWidth: idx < filteredGroups.length - 1 ? 1 : 0,
                      borderBottomColor: SEPARATOR,
                      opacity: pressed ? 0.5 : 1,
                    })}
                  >
                    <View style={{ width: 48, height: 48, borderRadius: 0, backgroundColor: "transparent", borderWidth: 1, borderColor: SEPARATOR, alignItems: "center", justifyContent: "center" }}>
                      <GroupIcon size={24} color={TEXT_PRIMARY} strokeWidth={1.5} />
                    </View>
                    <Typography style={{ flex: 1, fontSize: 16, fontWeight: "700", color: TEXT_PRIMARY, fontFamily: "PlusJakartaSans_700Bold", marginLeft: 16 }}>
                      {g.name}
                    </Typography>
                    <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: isSelected ? 0 : 2, borderColor: SEPARATOR, backgroundColor: isSelected ? "#8C7A6B" : "transparent", alignItems: "center", justifyContent: "center" }}>
                      {isSelected && <icons.Check size={14} color="#FFFFFF" strokeWidth={3} />}
                    </View>
                  </Pressable>
                );
              })
            ) : (
              <View style={{ padding: 32, alignItems: "center" }}>
                <Typography style={{ color: TEXT_SECONDARY, fontFamily: "PlusJakartaSans_500Medium" }}>No groups found.</Typography>
              </View>
            )
          )}
        </View>
      </View>

      {groups.length === 0 && uniqueFriends.length === 0 && (
        <View style={{ paddingHorizontal: 24, marginTop: 32 }}>
          <View style={{ padding: 24, alignItems: "center", borderTopWidth: 1, borderBottomWidth: 1, borderColor: SEPARATOR }}>
            <Typography style={{ fontSize: 16, fontWeight: "700", color: TEXT_PRIMARY, fontFamily: "PlusJakartaSans_700Bold", marginBottom: 8 }}>
              No groups or friends yet
            </Typography>
            <Typography style={{ fontSize: 14, color: TEXT_SECONDARY, fontFamily: "PlusJakartaSans_500Medium", textAlign: "center" }}>
              Create a group first to add expenses.
            </Typography>
          </View>
        </View>
      )}
    </Animated.View>
  );
}

interface ExpenseParticipantsProps {
  participants: User[];
  included: Record<string, boolean>;
  setIncluded: (val: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => void;
  splitMethod: SplitMethod;
  parsedAmount: number;
  remainingCustom: number;
  remainingPercent: number;
  expenseCurrency: string;
  equalShare: number;
  customAmounts: Record<string, string>;
  setCustomAmounts: (val: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
  customPercentages: Record<string, string>;
  setCustomPercentages: (val: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
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
    <View style={{ paddingHorizontal: 24, marginBottom: 32 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <SectionLabel>Participants</SectionLabel>
        
        {splitMethod === "custom" && parsedAmount > 0 && (
          <Typography style={{ fontSize: 12, fontWeight: "700", fontFamily: "PlusJakartaSans_700Bold", color: remainingCustom === 0 ? TEXT_SUCCESS : TEXT_DANGER }}>
            Remaining: {formatAmount(remainingCustom, expenseCurrency)}
          </Typography>
        )}
        {splitMethod === "percentage" && parsedAmount > 0 && (
          <Typography style={{ fontSize: 12, fontWeight: "700", fontFamily: "PlusJakartaSans_700Bold", color: remainingPercent === 0 ? TEXT_SUCCESS : TEXT_DANGER }}>
            Remaining: {remainingPercent.toFixed(1)}%
          </Typography>
        )}
      </View>

      <View>
        {participants.map((u, idx) => {
          const isIncluded = included[u.id] ?? true;
          return (
            <View
              key={u.id}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 16,
                borderBottomWidth: idx < participants.length - 1 ? 1 : 0,
                borderBottomColor: SEPARATOR,
                opacity: isIncluded ? 1 : 0.5,
              }}
            >
              <Checkbox
                isSelected={isIncluded}
                onSelectedChange={(v) => setIncluded((prev) => ({ ...prev, [u.id]: v }))}
                style={{ marginRight: 16 }}
              >
                <Checkbox.Indicator />
              </Checkbox>

              <AppUserAvatar user={u} size="md" />

              <Typography style={{ flex: 1, marginLeft: 16, fontSize: 16, fontWeight: "700", color: TEXT_PRIMARY, fontFamily: "PlusJakartaSans_700Bold" }}>
                {u.id === currentUserId ? "You" : u.name}
              </Typography>

              {splitMethod === "equal" && isIncluded && parsedAmount > 0 && (
                <View style={{ backgroundColor: "transparent", borderWidth: 1, borderColor: SEPARATOR, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 0 }}>
                  <Typography style={{ fontSize: 14, fontWeight: "700", color: TEXT_PRIMARY, fontFamily: "PlusJakartaSans_700Bold" }}>
                    {formatAmount(equalShare, expenseCurrency)}
                  </Typography>
                </View>
              )}

              {splitMethod === "custom" && isIncluded && (
                <View style={{ width: 100 }}>
                  <TextInput
                    placeholder="0.00"
                    placeholderTextColor={TEXT_SECONDARY}
                    value={customAmounts[u.id] ?? ""}
                    onChangeText={(v) => setCustomAmounts((prev) => ({ ...prev, [u.id]: v }))}
                    keyboardType="decimal-pad"
                    style={{
                      backgroundColor: "transparent",
                      height: 48,
                      borderRadius: 12,
                      paddingHorizontal: 12,
                      borderWidth: 1,
                      borderColor: SEPARATOR,
                      fontSize: 18,
                      fontWeight: "700",
                      color: TEXT_PRIMARY,
                      fontFamily: "PlusJakartaSans_700Bold",
                      textAlign: "right",
                    }}
                  />
                </View>
              )}

              {splitMethod === "percentage" && isIncluded && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <View style={{ width: 80 }}>
                    <TextInput
                      placeholder="0"
                      placeholderTextColor={TEXT_SECONDARY}
                      value={customPercentages[u.id] ?? ""}
                      onChangeText={(v) => setCustomPercentages((prev) => ({ ...prev, [u.id]: v }))}
                      keyboardType="decimal-pad"
                      style={{
                        backgroundColor: "transparent",
                        height: 48,
                        borderRadius: 12,
                        paddingHorizontal: 12,
                        borderWidth: 1,
                        borderColor: SEPARATOR,
                        fontSize: 18,
                        fontWeight: "700",
                        color: TEXT_PRIMARY,
                        fontFamily: "PlusJakartaSans_700Bold",
                        textAlign: "right",
                      }}
                    />
                  </View>
                  <Typography style={{ fontSize: 16, fontWeight: "700", color: TEXT_SECONDARY, fontFamily: "PlusJakartaSans_700Bold" }}>
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
