import {
  Typography,
  Spinner,
} from "heroui-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { GroupSettingsRouteParams } from "@/types/navigation";
import type { JSX } from "react";
import { useState, useMemo, useRef, useCallback } from "react";
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView } from "@gorhom/bottom-sheet";
import { StatusBar } from "expo-status-bar";
import { KeyboardAvoidingView, Platform, ScrollView, View, Pressable, TextInput, Switch as NativeSwitch } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  useGroups,
  useUpdateGroup,
  useDeleteGroup,
  useAddGroupMembers,
} from "@/features/groups/queries/useGroups";
import { useGroupExpenses } from "@/features/expenses/queries/useExpenses";
import { useGroupSettlements } from "@/features/settlements/queries/useSettlements";
import * as balancesUtil from "@/features/settlements/utils/balances";

import { CurrencySelector } from "@/components/forms/CurrencySelector";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { getCurrencySymbol } from "@/components/ui/AmountDisplay";
import * as icons from "lucide-react-native";
import { useAuth } from "@/context/AppContext";
import { useDataStore } from "@/store/useDataStore";
import { useUIStore } from "@/store/useUIStore";
import { CURRENCIES } from "@/types";
import { useAppToast } from "@/hooks/useAppToast";

const BG = "#F5F0EB";
const TEXT_PRIMARY = "#000000";
const TEXT_SECONDARY = "#8A8782";
const TEXT_DANGER = "#000000";
const SEPARATOR = "#E8E4DF";

function SectionLabel({ children }: { children: string }): JSX.Element {
  return (
    <Typography
      style={{
        fontSize: 12,
        fontWeight: "700",
        letterSpacing: 2,
        color: TEXT_SECONDARY,
        fontFamily: "PlusJakartaSans_700Bold",
        textTransform: "uppercase",
        marginBottom: 24,
      }}
    >
      {children}
    </Typography>
  );
}

const GROUP_ICONS = [
  "Home", "Plane", "Pizza", "PartyPopper", "Tent", "Gamepad2",
  "Briefcase", "Music", "Dumbbell", "Coffee", "Car", "Film",
  "ShoppingCart", "Mountain", "Target",
];

export default function GroupSettingsScreen(): JSX.Element {
  const { id } = useLocalSearchParams<GroupSettingsRouteParams>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();
  
  const { mutateAsync: updateGroup } = useUpdateGroup();
  const { mutateAsync: deleteGroup } = useDeleteGroup();
  const removeGroupMember = useDataStore((s) => s.removeGroupMember);
  const { mutateAsync: addGroupMembers } = useAddGroupMembers();
  
  const { data: groups = [] } = useGroups(currentUser?.id);
  const { data: expenses = [] } = useGroupExpenses(id);
  const { data: settlements = [] } = useGroupSettlements(id);
  
  const preferredCurrency = useUIStore((s) => s.preferredCurrency);
  const convertCurrency = useUIStore((s) => s.convertCurrency);

  const { toast } = useAppToast();

  const group = groups.find((item) => item.id === id);

  const [name, setName] = useState(group?.name ?? "");
  const [description, setDescription] = useState(group?.description ?? "");
  const [icon, setIcon] = useState(group?.icon ?? "Home");
  const [currencyCode, setCurrencyCode] = useState(group?.currency ?? "USD");
  const [simplifyDebts, setSimplifyDebts] = useState(group?.simplifyDebts ?? false);
  const currency = CURRENCIES.find((c) => c.code === currencyCode) ?? CURRENCIES[0];

  const [loading, setLoading] = useState(false);
  const deleteSheetRef = useRef<BottomSheetModal>(null);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" opacity={0.4} />
    ),
    []
  );

  const balances = useMemo(
    () =>
      balancesUtil.getGroupBalances(
        id ?? "",
        expenses,
        settlements,
        group,
        preferredCurrency,
        convertCurrency
      ),
    [id, expenses, settlements, group, preferredCurrency, convertCurrency]
  );

  const availableFriends = useMemo(() => {
    if (!group) return [];
    const allMembers = groups.flatMap((g) => g.members.map((m) => m.user));
    const uniqueFriends = Array.from(new Map(allMembers.map((user) => [user.id, user])).values());
    const existingIds = new Set(group.members.map((m) => m.userId));
    return uniqueFriends.filter((f) => !existingIds.has(f.id) && f.id !== currentUser.id);
  }, [groups, group, currentUser.id]);

  if (!group) {
    return (
      <View style={{ flex: 1, backgroundColor: BG, alignItems: "center", justifyContent: "center" }}>
        <Typography style={{ fontSize: 18, color: TEXT_PRIMARY }}>Group not found</Typography>
        <Pressable onPress={() => router.back()} style={{ marginTop: 16, padding: 12, backgroundColor: "#8C7A6B", borderRadius: 12 }}>
          <Typography style={{ color: "#FFF", fontWeight: "700" }}>Go Back</Typography>
        </Pressable>
      </View>
    );
  }

  async function handleSave(): Promise<void> {
    if (!name.trim()) {
      toast.show({ label: "Error", description: "Group name is required", variant: "danger", placement: "top" });
      return;
    }
    setLoading(true);
    try {
      await updateGroup({
        id: group!.id,
        updates: {
          name: name.trim(),
          description: description.trim() || undefined,
          icon,
          currency: currency.code,
          simplifyDebts,
        },
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch {
      toast.show({ label: "Error", description: "Failed to update group.", variant: "danger", placement: "top" });
      setLoading(false);
    }
  }

  function handleRemoveMember(userId: string) {
    const memBalance = balances.get(userId) ?? 0;
    if (Math.abs(memBalance) > 0.01) {
      toast.show({ label: "Error", description: "Cannot remove member with non-zero balance.", variant: "danger", placement: "top" });
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    removeGroupMember(group!.id, userId);
  }

  function handleAddFriend(friend: any) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addGroupMembers({ groupId: group!.id, userIds: [friend.id] });
  }

  async function handleDeleteGroup() {
    console.log("Delete group button pressed!");
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      console.log("Attempting to delete group with ID:", group?.id);
      await deleteGroup(group!.id);
      console.log("Delete group successful! Navigating to groups tab...");
      router.replace("/(tabs)/groups");
    } catch (e: any) {
      console.error("Delete group failed with error:", e);
      toast.show({ label: "Error", description: e?.message || JSON.stringify(e) || "Failed to delete group", variant: "danger", placement: "top" });
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        
        {/* ── Immersive Header ── */}
        <View
          style={{
            paddingTop: insets.top + 16,
            paddingBottom: 24,
            paddingHorizontal: 24,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography style={{ fontFamily: "DMSerifDisplay_400Regular", fontSize: 40, color: TEXT_PRIMARY, lineHeight: 48 }}>
            Settings
          </Typography>
          <Pressable onPress={() => router.back()} accessibilityRole="button" style={({ pressed }) => ({ padding: 8, opacity: pressed ? 0.5 : 1 })}>
            <icons.X size={32} color={TEXT_PRIMARY} strokeWidth={1} />
          </Pressable>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 140 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Icon & Name ── */}
          <Animated.View entering={FadeInDown.duration(400)} style={{ paddingHorizontal: 24, marginBottom: 48 }}>
            <SectionLabel>Identity</SectionLabel>
            
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 32 }}>
              <View style={{ width: 64, height: 64, borderRadius: 0, backgroundColor: "transparent", borderWidth: 1, borderColor: SEPARATOR, alignItems: "center", justifyContent: "center", marginRight: 16 }}>
                {(() => {
                  const IconComp = (icons as any)[icon] || icons.HelpCircle;
                  return <IconComp size={32} color={TEXT_PRIMARY} strokeWidth={1.5} />;
                })()}
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                {GROUP_ICONS.map((i) => {
                  const IconComponent = (icons as any)[i] || icons.HelpCircle;
                  const isSelected = icon === i;
                  if (isSelected) return null; // hide selected from list to avoid duplication
                  return (
                    <Pressable
                      key={i}
                      accessibilityRole="button"
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setIcon(i);
                      }}
                      style={({ pressed }) => ({
                        width: 48,
                        height: 48,
                        borderRadius: 0,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "transparent",
                        borderWidth: 1,
                        borderColor: SEPARATOR,
                        opacity: pressed ? 0.5 : 1,
                      })}
                    >
                      <IconComponent size={20} color={TEXT_SECONDARY} strokeWidth={1.5} />
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Group Name"
              placeholderTextColor={TEXT_SECONDARY}
              autoCapitalize="words"
              style={{
                fontSize: 32,
                color: TEXT_PRIMARY,
                fontFamily: "DMSerifDisplay_400Regular",
                borderBottomWidth: 1,
                borderBottomColor: SEPARATOR,
                paddingBottom: 16,
                marginBottom: 24,
              }}
            />

            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Description (Optional)"
              placeholderTextColor={TEXT_SECONDARY}
              multiline
              style={{
                fontSize: 18,
                color: TEXT_PRIMARY,
                fontFamily: "PlusJakartaSans_400Regular",
                borderBottomWidth: 1,
                borderBottomColor: SEPARATOR,
                paddingBottom: 16,
              }}
            />
          </Animated.View>

          {/* ── Finance ── */}
          <Animated.View entering={FadeInDown.duration(400).delay(100)} style={{ paddingHorizontal: 24, marginBottom: 48 }}>
            <SectionLabel>Finance</SectionLabel>
            
            <View style={{ borderBottomWidth: 1, borderBottomColor: SEPARATOR, paddingBottom: 24, marginBottom: 24 }}>
              <CurrencySelector
                label="Base Currency"
                value={currency.code}
                onChange={(c) => setCurrencyCode(c.code)}
              />
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: SEPARATOR, paddingBottom: 24 }}>
              <View style={{ flex: 1, marginRight: 24 }}>
                <Typography style={{ fontSize: 18, fontWeight: "700", color: TEXT_PRIMARY, fontFamily: "PlusJakartaSans_700Bold", marginBottom: 8 }}>
                  Simplify Debts
                </Typography>
                <Typography style={{ fontSize: 14, color: TEXT_SECONDARY, fontFamily: "PlusJakartaSans_400Regular", lineHeight: 22 }}>
                  Automatically combine debts to reduce the total number of payments between members.
                </Typography>
              </View>
              <NativeSwitch
                value={simplifyDebts}
                onValueChange={setSimplifyDebts}
                trackColor={{ false: SEPARATOR, true: TEXT_PRIMARY }}
                thumbColor="#FFFFFF"
              />
            </View>
          </Animated.View>

          {/* ── Members ── */}
          <Animated.View entering={FadeInDown.duration(400).delay(200)} style={{ paddingHorizontal: 24, marginBottom: 48 }}>
            <SectionLabel>Members</SectionLabel>
            
            <View>
              {group.members.map((member, idx) => {
                const memBalance = balances.get(member.userId) ?? 0;
                return (
                  <View
                    key={member.userId}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingVertical: 16,
                      borderBottomWidth: 1,
                      borderBottomColor: SEPARATOR,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
                      <AppUserAvatar user={member.user} size="lg" />
                      <View>
                        <Typography style={{ fontSize: 18, fontWeight: "700", color: TEXT_PRIMARY, fontFamily: "PlusJakartaSans_700Bold", marginBottom: 4 }}>
                          {member.userId === currentUser.id ? "You" : member.user.name}
                        </Typography>
                        <Typography style={{ fontSize: 14, color: TEXT_SECONDARY, fontFamily: "PlusJakartaSans_500Medium" }}>
                          Balance: {getCurrencySymbol(currencyCode)}{Math.abs(memBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Typography>
                      </View>
                    </View>
                    {member.userId !== currentUser.id && (
                      <Pressable onPress={() => handleRemoveMember(member.userId)} style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1, padding: 8 })}>
                        <icons.Trash2 size={24} color={TEXT_PRIMARY} strokeWidth={1} />
                      </Pressable>
                    )}
                  </View>
                );
              })}
            </View>
          </Animated.View>

          {/* ── Add Friends ── */}
          {availableFriends.length > 0 && (
            <Animated.View entering={FadeInDown.duration(400).delay(300)} style={{ paddingHorizontal: 24, marginBottom: 64 }}>
              <SectionLabel>Add Friends</SectionLabel>
              <View>
                {availableFriends.map((friend, idx) => (
                  <View
                    key={friend.id}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingVertical: 16,
                      borderBottomWidth: idx < availableFriends.length - 1 ? 1 : 0,
                      borderBottomColor: SEPARATOR,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
                      <AppUserAvatar user={friend} size="lg" />
                      <Typography style={{ fontSize: 18, fontWeight: "700", color: TEXT_PRIMARY, fontFamily: "PlusJakartaSans_700Bold" }}>
                        {friend.name}
                      </Typography>
                    </View>
                    <Pressable onPress={() => handleAddFriend(friend)} style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1, padding: 8 })}>
                      <icons.PlusCircle size={28} color={TEXT_PRIMARY} strokeWidth={1} />
                    </Pressable>
                  </View>
                ))}
              </View>
            </Animated.View>
          )}

          {/* ── Danger Zone ── */}
          <View style={{ paddingHorizontal: 24, paddingBottom: 40 }}>
            <Pressable
              accessibilityRole="button"
              onPress={() => deleteSheetRef.current?.present()}
              style={({ pressed }) => ({
                height: 64,
                borderRadius: 0,
                backgroundColor: "transparent",
                borderWidth: 1,
                borderColor: TEXT_PRIMARY,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.5 : 1,
              })}
            >
              <Typography style={{ fontSize: 18, fontWeight: "700", color: TEXT_PRIMARY, fontFamily: "PlusJakartaSans_700Bold" }}>
                Delete Group
              </Typography>
            </Pressable>
          </View>
        </ScrollView>

        {/* ── Fixed Save Button ── */}
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            paddingHorizontal: 24,
            paddingTop: 16,
            paddingBottom: insets.bottom + 16,
            backgroundColor: BG,
          }}
        >
          <Pressable
            accessibilityRole="button"
            onPress={handleSave}
            disabled={loading}
            style={({ pressed }) => ({
              height: 64,
              borderRadius: 0,
              backgroundColor: "#8C7A6B",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              opacity: pressed || loading ? 0.8 : 1,
            })}
          >
            {loading && <Spinner color="white" size="sm" style={{ marginRight: 8 }} />}
            <Typography style={{ fontSize: 18, fontWeight: "700", color: "#FFFFFF", fontFamily: "PlusJakartaSans_700Bold" }}>
              Save Changes
            </Typography>
          </Pressable>
        </View>

        {/* ── Delete Confirmation Bottom Sheet ── */}
        <BottomSheetModal
          ref={deleteSheetRef}
          index={0}
          enableDynamicSizing={true}
          backdropComponent={renderBackdrop}
          backgroundStyle={{ backgroundColor: BG, borderRadius: 0 }}
          handleIndicatorStyle={{ backgroundColor: TEXT_SECONDARY, width: 40 }}
        >
          <BottomSheetView style={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: insets.bottom + 24 }}>
            <Typography style={{ fontSize: 22, fontFamily: "PlusJakartaSans_700Bold", color: TEXT_PRIMARY, marginBottom: 8 }}>
              Delete Group?
            </Typography>
            <Typography style={{ fontSize: 16, fontFamily: "PlusJakartaSans_500Medium", color: TEXT_SECONDARY, marginBottom: 24 }}>
              Are you sure you want to delete "{group.name}"? This cannot be undone.
            </Typography>

            <View style={{ flexDirection: "row", gap: 12 }}>
              <Pressable
                onPress={() => deleteSheetRef.current?.dismiss()}
                style={({ pressed }) => ({
                  flex: 1,
                  height: 48,
                  borderWidth: 1,
                  borderColor: SEPARATOR,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: pressed ? 0.5 : 1,
                })}
              >
                <Typography style={{ fontSize: 16, fontFamily: "PlusJakartaSans_700Bold", color: TEXT_PRIMARY }}>Cancel</Typography>
              </Pressable>
              <Pressable
                onPress={() => {
                  deleteSheetRef.current?.dismiss();
                  setTimeout(() => handleDeleteGroup(), 300);
                }}
                style={({ pressed }) => ({
                  flex: 1,
                  height: 48,
                  backgroundColor: "#E02424",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <Typography style={{ fontSize: 16, fontFamily: "PlusJakartaSans_700Bold", color: "#FFFFFF" }}>Delete</Typography>
              </Pressable>
            </View>
          </BottomSheetView>
        </BottomSheetModal>
      </KeyboardAvoidingView>
    </View>
  );
}
