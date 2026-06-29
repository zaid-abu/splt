import { Alert, Button, Typography, PressableFeedback } from "heroui-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { JSX } from "react";
import { useState, useMemo } from "react";
import { StatusBar } from "expo-status-bar";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CurrencySelector } from "@/components/CurrencySelector";
import { AppUserAvatar } from "@/components/MemberAvatar";
import { getCurrencySymbol } from "@/components/AmountDisplay";
import * as icons from "lucide-react-native";
import { useApp } from "@/context/AppContext";
import { CURRENCIES } from "@/types";

const GROUP_ICONS = ["Home", "Plane", "Pizza", "PartyPopper", "Tent", "Gamepad2", "Briefcase", "Music", "Dumbbell", "Coffee", "Car", "Film", "ShoppingCart", "Mountain", "Target"];

export default function GroupSettingsScreen(): JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { 
    getGroup, updateGroup, deleteGroup, removeGroupMember, addGroupMembers, 
    groups, currentUser, getGroupBalances
  } = useApp();

  const group = getGroup(id ?? "");

  const [name, setName] = useState(group?.name ?? "");
  const [description, setDescription] = useState(group?.description ?? "");
  const [icon, setIcon] = useState(group?.icon ?? "Home");
  const [currencyCode, setCurrencyCode] = useState(group?.currency ?? "USD");
  const currency = CURRENCIES.find(c => c.code === currencyCode) ?? CURRENCIES[0];

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const balances = getGroupBalances(id ?? "");

  // Available friends to add (not in the group)
  const availableFriends = useMemo(() => {
    if (!group) return [];
    const allMembers = groups.flatMap((g) => g.members.map((m) => m.user));
    const uniqueFriends = Array.from(new Map(allMembers.map((user) => [user.id, user])).values());
    const existingIds = new Set(group.members.map(m => m.userId));
    return uniqueFriends.filter(f => !existingIds.has(f.id) && f.id !== currentUser.id);
  }, [groups, group, currentUser.id]);

  if (!group) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F2F2F6' }}>
        <View className="flex-1 items-center justify-center p-6">
          <Typography type="h3">Group not found</Typography>
          <Button onPress={() => router.back()} className="mt-4">Go Back</Button>
        </View>
      </SafeAreaView>
    );
  }

  function handleSave(): void {
    if (!name.trim()) { setError("Group name is required"); return; }
    setLoading(true);
    try {
      updateGroup(group!.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        icon,
        currency: currency.code,
      });
      router.back();
    } catch {
      setError("Failed to update group. Please try again.");
      setLoading(false);
    }
  }

  function handleRemoveMember(userId: string) {
    const memBalance = balances.get(userId) ?? 0;
    if (Math.abs(memBalance) > 0.01) {
      // Wait, we can't show alerts natively without the React Native Alert, 
      // but we can just set an error state here.
      setError("Cannot remove member with non-zero balance.");
      return;
    }
    removeGroupMember(group!.id, userId);
    setError(""); // Clear any previous error
  }

  function handleAddFriend(friend: any) {
    addGroupMembers(group!.id, [friend]);
    setError("");
  }

  function handleDeleteGroup() {
    deleteGroup(group!.id);
    router.replace("/(tabs)/groups");
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F2F2F6' }} edges={["top", "bottom"]}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          className="flex-1 bg-background"
          contentContainerStyle={{ paddingBottom: 48 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header ────────────────────────────────── */}
          <View className="flex-row items-center justify-between px-6 pt-4 mb-8">
            <Typography type="h3" className="font-black tracking-tight text-[28px]">Settings</Typography>
            <Button variant="ghost" size="sm" onPress={() => router.back()}>✕ Cancel</Button>
          </View>

          {/* ── Icon picker ──────────────────────────── */}
          <View className="mb-8">
            <Typography type="body-xs" className="text-muted-foreground font-bold tracking-widest mb-3 ml-8">
              CHOOSE ICON
            </Typography>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}
            >
              {GROUP_ICONS.map((i) => {
                const IconComponent = (icons as any)[i] || icons.HelpCircle;
                const isSelected = icon === i;
                return (
                  <PressableFeedback key={i} onPress={() => setIcon(i)}>
                    <View 
                      className={`w-14 h-14 rounded-full items-center justify-center border-2 ${isSelected ? 'bg-primary border-primary' : 'bg-white border-transparent'}`}
                    >
                      <IconComponent 
                        size={24} 
                        color={isSelected ? "white" : "#8A8798"} 
                        strokeWidth={isSelected ? 2.5 : 2} 
                      />
                    </View>
                  </PressableFeedback>
                );
              })}
            </ScrollView>
          </View>

          {/* ── Form fields ───────────────────────────── */}
          <View className="px-6 mb-8 gap-5">
            <View>
              <Typography type="body-sm" className="font-bold text-muted-foreground tracking-widest mb-2 ml-2">
                GROUP NAME
              </Typography>
              <View className={`bg-white h-[56px] rounded-[20px] px-4 justify-center border ${error && !name.trim() ? 'border-danger' : 'border-border'}`}>
                <TextInput 
                  value={name}
                  onChangeText={(t) => { setName(t); setError(""); }}
                  placeholder="e.g. Weekend Trip, Housemates…"
                  className="font-medium text-[16px] text-foreground h-full"
                  placeholderTextColor="#8A8798"
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View>
              <Typography type="body-sm" className="font-bold text-muted-foreground tracking-widest mb-2 ml-2">
                DESCRIPTION (OPTIONAL)
              </Typography>
              <View className="bg-white rounded-[20px] px-4 py-3 border border-border">
                <TextInput 
                  value={description}
                  onChangeText={setDescription}
                  placeholder="What is this group for?"
                  className="font-medium text-[16px] text-foreground"
                  placeholderTextColor="#8A8798"
                  multiline
                  numberOfLines={3}
                  style={{ minHeight: 80, textAlignVertical: 'top' }}
                />
              </View>
            </View>

            <CurrencySelector 
              label="Group Base Currency" 
              value={currency.code} 
              onChange={(c) => setCurrencyCode(c.code)} 
            />
          </View>

          {/* ── Members ────────────────────────────────── */}
          <View className="px-6 mb-8">
            <Typography type="body-xs" className="text-muted-foreground font-bold tracking-widest mb-3 ml-2">
              MEMBERS
            </Typography>
            <View className="bg-white rounded-[24px] overflow-hidden border border-border">
              {group.members.map((member, idx) => {
                const memBalance = balances.get(member.userId) ?? 0;
                return (
                  <View key={member.userId} className={`flex-row items-center justify-between p-4 ${idx < group.members.length - 1 ? 'border-b border-border/50' : ''}`}>
                    <View className="flex-row items-center gap-3">
                      <AppUserAvatar user={member.user} size="md" />
                      <View>
                        <Typography type="body" className="font-bold text-foreground">
                          {member.userId === currentUser.id ? "You" : member.user.name}
                        </Typography>
                        <Typography type="body-sm" className="text-muted-foreground">
                          Balance: {getCurrencySymbol(currencyCode)}{Math.abs(memBalance).toLocaleString()}
                        </Typography>
                      </View>
                    </View>
                    {member.userId !== currentUser.id && (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onPress={() => handleRemoveMember(member.userId)}
                        className="opacity-70"
                      >
                        Remove
                      </Button>
                    )}
                  </View>
                );
              })}
            </View>
          </View>

          {/* ── Add Friends ─────────────────────────────── */}
          {availableFriends.length > 0 && (
            <View className="px-6 mb-8">
              <Typography type="body-xs" className="text-muted-foreground font-bold tracking-widest mb-3 ml-2">
                ADD FRIENDS
              </Typography>
              <View className="bg-white rounded-[24px] overflow-hidden border border-border">
                {availableFriends.map((friend, idx) => (
                  <View key={friend.id} className={`flex-row items-center justify-between p-4 ${idx < availableFriends.length - 1 ? 'border-b border-border/50' : ''}`}>
                    <View className="flex-row items-center gap-3">
                      <AppUserAvatar user={friend} size="md" />
                      <Typography type="body" className="font-bold text-foreground">
                        {friend.name}
                      </Typography>
                    </View>
                    <Button 
                      size="sm" 
                      onPress={() => handleAddFriend(friend)}
                    >
                      Add
                    </Button>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ── Error ──────────────────────────────── */}
          {error ? (
            <View className="px-6 mb-4">
              <Alert status="danger" className="rounded-[20px]">
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Title>{error}</Alert.Title>
                </Alert.Content>
              </Alert>
            </View>
          ) : null}

          {/* ── Danger Zone ───────────────────────────── */}
          <View className="px-6 mb-8 mt-4">
            <Typography type="body-xs" className="text-danger font-bold tracking-widest mb-3 ml-2">
              DANGER ZONE
            </Typography>
            <View className="bg-danger/10 border border-danger/20 p-4 rounded-[24px]">
              <Typography type="body-sm" className="text-danger mb-4">
                Deleting this group will permanently remove it from your groups list.
              </Typography>
              <Button 
                onPress={handleDeleteGroup}
                className="bg-danger text-white rounded-[16px]"
              >
                Delete Group
              </Button>
            </View>
          </View>
        </ScrollView>

        {/* ── Fixed Submit Button ─────────────────────────────── */}
        <View className="px-6 py-4 bg-background border-t border-border/50">
          <PressableFeedback onPress={loading ? undefined : handleSave}>
            <View className={`w-full h-[56px] rounded-[20px] items-center justify-center ${loading ? 'bg-primary/70' : 'bg-primary'}`}>
              <Typography type="body" className="font-bold text-white">
                {loading ? "Saving…" : "Save Changes"}
              </Typography>
            </View>
          </PressableFeedback>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
