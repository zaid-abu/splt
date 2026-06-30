// heroui-native switch classes for uniwind: w-[48px] h-[24px] w-[28px] h-[20px] left-[2px] right-[2px] shadow-field rounded-full justify-center overflow-hidden absolute items-center disabled:opacity-disabled disabled:pointer-events-none
import {
  Alert,
  Button,
  Typography,
  PressableFeedback,
  Spinner,
  Switch,
  TextField,
  Label,
  Input,
  ListGroup,
  useToast,
} from "heroui-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { JSX } from "react";
import { useState, useMemo } from "react";
import { StatusBar } from "expo-status-bar";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CurrencySelector } from "@/components/CurrencySelector";
import { AppUserAvatar } from "@/components/MemberAvatar";
import { getCurrencySymbol } from "@/components/AmountDisplay";
import * as icons from "lucide-react-native";
import { useApp } from "@/context/AppContext";
import { CURRENCIES } from "@/types";

const GROUP_ICONS = [
  "Home",
  "Plane",
  "Pizza",
  "PartyPopper",
  "Tent",
  "Gamepad2",
  "Briefcase",
  "Music",
  "Dumbbell",
  "Coffee",
  "Car",
  "Film",
  "ShoppingCart",
  "Mountain",
  "Target",
];

export default function GroupSettingsScreen(): JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const {
    getGroup,
    updateGroup,
    deleteGroup,
    removeGroupMember,
    addGroupMembers,
    groups,
    currentUser,
    getGroupBalances,
  } = useApp();
  const { toast } = useToast();

  const group = getGroup(id ?? "");

  const [name, setName] = useState(group?.name ?? "");
  const [description, setDescription] = useState(group?.description ?? "");
  const [icon, setIcon] = useState(group?.icon ?? "Home");
  const [currencyCode, setCurrencyCode] = useState(group?.currency ?? "USD");
  const [simplifyDebts, setSimplifyDebts] = useState(group?.simplifyDebts ?? false);
  const currency = CURRENCIES.find((c) => c.code === currencyCode) ?? CURRENCIES[0];

  const [loading, setLoading] = useState(false);

  const balances = getGroupBalances(id ?? "");

  // Available friends to add (not in the group)
  const availableFriends = useMemo(() => {
    if (!group) return [];
    const allMembers = groups.flatMap((g) => g.members.map((m) => m.user));
    const uniqueFriends = Array.from(new Map(allMembers.map((user) => [user.id, user])).values());
    const existingIds = new Set(group.members.map((m) => m.userId));
    return uniqueFriends.filter((f) => !existingIds.has(f.id) && f.id !== currentUser.id);
  }, [groups, group, currentUser.id]);

  if (!group) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#F2F2F6" }}>
        <View className="flex-1 items-center justify-center p-6">
          <Typography type="h3">Group not found</Typography>
          <Button onPress={() => router.back()} className="mt-4">
            Go Back
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  async function handleSave(): Promise<void> {
    if (!name.trim()) {
      toast.show({
        label: "Error",
        description: "Group name is required",
        variant: "danger",
        placement: "top",
      });
      return;
    }
    setLoading(true);
    try {
      await updateGroup(group!.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        icon,
        currency: currency.code,
        simplifyDebts,
      });
      router.back();
    } catch {
      toast.show({
        label: "Error",
        description: "Failed to update group. Please try again.",
        variant: "danger",
        placement: "top",
      });
      setLoading(false);
    }
  }

  function handleRemoveMember(userId: string) {
    const memBalance = balances.get(userId) ?? 0;
    if (Math.abs(memBalance) > 0.01) {
      toast.show({
        label: "Error",
        description: "Cannot remove member with non-zero balance.",
        variant: "danger",
        placement: "top",
      });
      return;
    }
    removeGroupMember(group!.id, userId);
  }

  function handleAddFriend(friend: any) {
    addGroupMembers(group!.id, [friend]);
  }

  function handleDeleteGroup() {
    deleteGroup(group!.id);
    router.replace("/(tabs)/groups");
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F2F2F6" }} edges={["top", "bottom"]}>
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
            <Typography type="h3" className="font-black tracking-tight text-[28px]">
              Settings
            </Typography>
            <Button variant="ghost" size="sm" onPress={() => router.back()}>
              ✕ Cancel
            </Button>
          </View>

          {/* ── Icon picker ──────────────────────────── */}
          <View className="mb-8">
            <Typography
              type="body-xs"
              className="text-muted-foreground font-bold tracking-widest mb-3 ml-8"
            >
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
                      className={`w-14 h-14 rounded-full items-center justify-center border-2 ${isSelected ? "bg-primary border-primary" : "bg-white border-transparent"}`}
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
            <TextField>
              <Label className="ml-1 tracking-widest uppercase text-muted-foreground text-[10px]">
                GROUP NAME
              </Label>
              <Input
                value={name}
                onChangeText={(t) => setName(t)}
                placeholder="e.g. Weekend Trip, Housemates…"
                autoCapitalize="words"
                className="bg-white h-[56px] rounded-[20px] px-4 border border-border text-[16px]"
              />
            </TextField>

            <TextField>
              <Label className="ml-1 tracking-widest uppercase text-muted-foreground text-[10px]">
                DESCRIPTION (OPTIONAL)
              </Label>
              <Input
                value={description}
                onChangeText={setDescription}
                placeholder="What is this group for?"
                multiline
                numberOfLines={3}
                style={{ minHeight: 80, textAlignVertical: "top" }}
                className="bg-white rounded-[20px] px-4 py-3 border border-border text-[16px]"
              />
            </TextField>

            <CurrencySelector
              label="Group Base Currency"
              value={currency.code}
              onChange={(c) => setCurrencyCode(c.code)}
            />

            <View>
              <Typography
                type="body-sm"
                className="font-bold text-muted-foreground tracking-widest mb-2 ml-2"
              >
                SETTLEMENTS
              </Typography>
              <View className="bg-white rounded-[20px] px-4 py-4 border border-border flex-row items-center justify-between">
                <View className="flex-1 mr-4">
                  <Typography type="body" className="font-bold text-foreground">
                    Simplify Debts
                  </Typography>
                  <Typography type="body-sm" className="text-muted-foreground mt-0.5">
                    Automatically combine debts to reduce the total number of payments between
                    members.
                  </Typography>
                </View>
                <Switch
                  isSelected={simplifyDebts}
                  onSelectedChange={setSimplifyDebts}
                  className="accent-zinc-900"
                />
              </View>
            </View>
          </View>

          {/* ── Members ────────────────────────────────── */}
          <View className="px-6 mb-8">
            <Typography
              type="body-xs"
              className="text-muted-foreground font-bold tracking-widest mb-3 ml-2"
            >
              MEMBERS
            </Typography>
            <ListGroup className="bg-white rounded-[24px] overflow-hidden border border-border">
              {group.members.map((member, idx) => {
                const memBalance = balances.get(member.userId) ?? 0;
                return (
                  <ListGroup.Item
                    key={member.userId}
                    className={`p-4 ${idx < group.members.length - 1 ? "border-b border-border/50" : ""}`}
                  >
                    <ListGroup.ItemPrefix className="mr-3">
                      <AppUserAvatar user={member.user} size="md" />
                    </ListGroup.ItemPrefix>
                    <ListGroup.ItemContent>
                      <ListGroup.ItemTitle className="font-bold text-foreground">
                        {member.userId === currentUser.id ? "You" : member.user.name}
                      </ListGroup.ItemTitle>
                      <ListGroup.ItemDescription className="text-muted-foreground mt-0.5">
                        Balance: {getCurrencySymbol(currencyCode)}
                        {Math.abs(memBalance).toLocaleString()}
                      </ListGroup.ItemDescription>
                    </ListGroup.ItemContent>
                    {member.userId !== currentUser.id && (
                      <ListGroup.ItemSuffix>
                        <Button
                          size="sm"
                          variant="ghost"
                          onPress={() => handleRemoveMember(member.userId)}
                          className="opacity-70"
                        >
                          Remove
                        </Button>
                      </ListGroup.ItemSuffix>
                    )}
                  </ListGroup.Item>
                );
              })}
            </ListGroup>
          </View>

          {/* ── Add Friends ─────────────────────────────── */}
          {availableFriends.length > 0 && (
            <View className="px-6 mb-8">
              <Typography
                type="body-xs"
                className="text-muted-foreground font-bold tracking-widest mb-3 ml-2"
              >
                ADD FRIENDS
              </Typography>
              <ListGroup className="bg-white rounded-[24px] overflow-hidden border border-border">
                {availableFriends.map((friend, idx) => (
                  <ListGroup.Item
                    key={friend.id}
                    className={`p-4 ${idx < availableFriends.length - 1 ? "border-b border-border/50" : ""}`}
                  >
                    <ListGroup.ItemPrefix className="mr-3">
                      <AppUserAvatar user={friend} size="md" />
                    </ListGroup.ItemPrefix>
                    <ListGroup.ItemContent>
                      <ListGroup.ItemTitle className="font-bold text-foreground">
                        {friend.name}
                      </ListGroup.ItemTitle>
                    </ListGroup.ItemContent>
                    <ListGroup.ItemSuffix>
                      <Button size="sm" onPress={() => handleAddFriend(friend)}>
                        Add
                      </Button>
                    </ListGroup.ItemSuffix>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </View>
          )}

          {/* ── Danger Zone ───────────────────────────── */}
          <View className="px-6 mb-8 mt-4">
            <Typography type="body-xs" className="text-danger font-bold tracking-widest mb-3 ml-2">
              DANGER ZONE
            </Typography>
            <View className="bg-danger/10 border border-danger/20 p-4 rounded-[24px]">
              <Typography type="body-sm" className="text-danger mb-4">
                Deleting this group will permanently remove it from your groups list.
              </Typography>
              <Button onPress={handleDeleteGroup} className="bg-danger text-white rounded-[16px]">
                Delete Group
              </Button>
            </View>
          </View>
        </ScrollView>

        {/* ── Fixed Submit Button ─────────────────────────────── */}
        <View className="px-6 py-4 bg-background border-t border-border/50">
          <Button
            variant="primary"
            className="w-full h-[56px] rounded-[20px]"
            onPress={handleSave}
            isDisabled={loading}
          >
            {loading && <Spinner color="white" size="sm" className="mr-2" />}
            <Button.Label className="font-bold">Save Changes</Button.Label>
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
