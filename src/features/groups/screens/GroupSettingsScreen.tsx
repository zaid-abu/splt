import { useLocalSearchParams, useRouter } from "expo-router";
import type { GroupSettingsRouteParams } from "@/types/navigation";
import type { JSX } from "react";
import { useState, useMemo, useRef } from "react";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { StatusBar } from "expo-status-bar";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  Pressable,
  Switch as NativeSwitch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  useGroups,
  useUpdateGroup,
  useDeleteGroup,
  useAddGroupMembers,
  useRemoveGroupMember,
} from "@/features/groups/queries/useGroups";
import { useGroupExpenses } from "@/features/expenses/queries/useExpenses";
import { useGroupSettlements } from "@/features/settlements/queries/useSettlements";
import { useFriends, useAddFriend } from "@/features/friends/queries/useFriends";
import * as balancesUtil from "@/features/settlements/utils/balances";

import { CurrencySelector } from "@/components/forms/CurrencySelector";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { UserSearchBottomSheet } from "@/features/groups/components/UserSearchBottomSheet";
import { getCurrencySymbol } from "@/components/ui/AmountDisplay";
import * as icons from "lucide-react-native";
import { useAuth } from "@/context/AppContext";
import { useUIStore } from "@/store/useUIStore";
import { CURRENCIES } from "@/types";
import { useAppToast } from "@/hooks/useAppToast";
import { Text } from "@/components/primitives/Text";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { Dialog } from "@/components/ui/Dialog";

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
  const { id } = useLocalSearchParams<GroupSettingsRouteParams>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();
  const userId = currentUser?.id ?? "";
  const { mutateAsync: updateGroup } = useUpdateGroup();
  const { mutateAsync: deleteGroup } = useDeleteGroup();
  const { mutateAsync: removeGroupMember } = useRemoveGroupMember();
  const { mutateAsync: addGroupMembers } = useAddGroupMembers();

  const { data: groups = [] } = useGroups(currentUser?.id);
  const { data: expenses = [] } = useGroupExpenses(id);
  const { data: settlements = [] } = useGroupSettlements(id);
  const { data: friends = [] } = useFriends(currentUser?.id);
  const { mutateAsync: addFriend } = useAddFriend();

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
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

  const [memberToRemove, setMemberToRemove] = useState<{ id: string; name: string } | null>(null);
  const [removeMemberDialogVisible, setRemoveMemberDialogVisible] = useState(false);

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

  const searchSheetRef = useRef<BottomSheetModal>(null);

  if (!group) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <EmptyState
          icon="AlertCircle"
          title="Group not found"
          action={{ label: "Go Back", onPress: () => router.back() }}
        />
      </View>
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
      toast.show({
        label: "Error",
        description: "Failed to update group.",
        variant: "danger",
        placement: "top",
      });
      setLoading(false);
    }
  }

  function handleRemoveMemberClick(userId: string, userName: string) {
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
    setMemberToRemove({ id: userId, name: userName });
    setRemoveMemberDialogVisible(true);
  }

  async function confirmRemoveMember() {
    if (!memberToRemove || !group) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await removeGroupMember({ groupId: group.id, userId: memberToRemove.id });
      toast.show({
        label: "Member Removed",
        description: `${memberToRemove.name} has been removed from the group.`,
        variant: "success",
        placement: "top",
      });
    } catch (e: any) {
      toast.show({
        label: "Error",
        description: "Failed to remove member.",
        variant: "danger",
        placement: "top",
      });
    }
    setRemoveMemberDialogVisible(false);
  }

  async function handleAddMember(user: any) {
    if (!group) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const isFriend = friends.some((f) => f.id === user.id);

    try {
      if (isFriend) {
        await addGroupMembers({ groupId: group.id, userIds: [user.id] });
        toast.show({
          label: "Member Added",
          description: `${user.name} was added to the group.`,
          variant: "success",
          placement: "top",
        });
      } else {
        await addFriend({ userId: userId, friendId: user.id, groupId: group.id });
        toast.show({
          label: "Request Sent",
          description: `Friend request sent to ${user.name}. They will be added to the group once accepted.`,
          variant: "success",
          placement: "top",
        });
      }
    } catch (e: any) {
      toast.show({
        label: "Error",
        description: e.message || "Failed to add member.",
        variant: "danger",
        placement: "top",
      });
    }

    searchSheetRef.current?.dismiss();
  }

  async function handleDeleteGroup() {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      await deleteGroup(group!.id);
      router.replace("/(tabs)/groups");
    } catch (e: any) {
      toast.show({
        label: "Error",
        description: e?.message || "Failed to delete group",
        variant: "danger",
        placement: "top",
      });
    }
  }

  if (!currentUser) return <></>;
  return (
    <View className="flex-1 bg-background">
      <StatusBar style="light" />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View
          className="flex-row items-center justify-between px-6 pb-6"
          style={{ paddingTop: insets.top + 16 }}
        >
          <Text variant="screenTitle" color="foreground">
            Settings
          </Text>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            className="p-2 active:opacity-50"
          >
            <icons.X size={32} color="#FAFAFA" strokeWidth={1} />
          </Pressable>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 140 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            entering={FadeInDown.duration(400)}
            className="px-6 mb-12"
          >
            <Text variant="sectionLabel" className="mb-6">
              Identity
            </Text>

            <View className="flex-row items-center mb-8">
              <View className="w-16 h-16 rounded-xl bg-surface border border-border items-center justify-center mr-4">
                {(() => {
                  const IconComp = (icons as any)[icon] || icons.HelpCircle;
                  return <IconComp size={32} color="#FAFAFA" strokeWidth={1.5} />;
                })()}
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 12 }}
              >
                {GROUP_ICONS.map((i) => {
                  const IconComponent = (icons as any)[i] || icons.HelpCircle;
                  const isSelected = icon === i;
                  if (isSelected) return null;
                  return (
                    <Pressable
                      key={i}
                      accessibilityRole="button"
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setIcon(i);
                      }}
                      className="w-12 h-12 rounded-xl items-center justify-center bg-transparent border border-border active:opacity-50"
                    >
                      <IconComponent size={20} color="#8E8E93" strokeWidth={1.5} />
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            <View className="mb-6">
              <Input
                label="Group Name"
                value={name}
                onChangeText={setName}
                placeholder="Group Name"
                autoCapitalize="words"
              />
            </View>

            <Input
              label="Description"
              value={description}
              onChangeText={setDescription}
              placeholder="Description (Optional)"
              multiline
            />
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(400).delay(100)}
            className="px-6 mb-12"
          >
            <Text variant="sectionLabel" className="mb-6">
              Finance
            </Text>

            <View className="border-b border-border pb-6 mb-6">
              <CurrencySelector
                label="Base Currency"
                value={currency.code}
                onChange={(c) => setCurrencyCode(c.code)}
              />
            </View>

            <View className="flex-row items-center justify-between border-b border-border pb-6">
              <View className="flex-1 mr-6">
                <Text variant="body" color="foreground" className="font-bold mb-2">
                  Simplify Debts
                </Text>
                <Text variant="bodySmall" color="muted">
                  Automatically combine debts to reduce the total number of payments between members.
                </Text>
              </View>
              <NativeSwitch
                value={simplifyDebts}
                onValueChange={setSimplifyDebts}
                trackColor={{ false: "#26262D", true: "#FB923C" }}
                thumbColor="#FFFFFF"
              />
            </View>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(400).delay(200)}
            className="px-6 mb-12"
          >
            <View className="flex-row justify-between items-center mb-6">
              <Text variant="sectionLabel">Members</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => searchSheetRef.current?.present()}
                className="active:opacity-50"
              >
                <Text variant="bodySmall" className="font-bold" color="primary">
                  + Add Member
                </Text>
              </Pressable>
            </View>

            <View>
              {group.members.map((member, idx) => {
                const memBalance = balances.get(member.userId) ?? 0;
                return (
                  <View
                    key={member.userId}
                    className={`flex-row items-center justify-between py-4 ${idx < group.members.length - 1 ? "border-b border-border" : ""}`}
                  >
                    <View className="flex-row items-center gap-4">
                      <AppUserAvatar user={member.user} size="lg" />
                      <View>
                        <Text variant="body" color="foreground" className="font-bold mb-1">
                          {member.userId === userId ? "You" : member.user.name}
                        </Text>
                        <Text variant="bodySmall" color="muted">
                          Balance: {getCurrencySymbol(currencyCode)}
                          {Math.abs(memBalance).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </Text>
                      </View>
                    </View>
                    {member.userId !== userId && (
                      <Pressable
                        onPress={() => handleRemoveMemberClick(member.userId, member.user.name)}
                        className="p-2 active:opacity-50"
                      >
                        <icons.Trash2 size={24} color="#FAFAFA" strokeWidth={1} />
                      </Pressable>
                    )}
                  </View>
                );
              })}
            </View>
          </Animated.View>

          <View className="px-6 pb-10">
            <Button
              variant="danger"
              size="lg"
              fullWidth
              onPress={() => setDeleteDialogVisible(true)}
            >
              Delete Group
            </Button>
          </View>
        </ScrollView>

        <View
          className="absolute bottom-0 left-0 right-0 px-6 pt-4 bg-background"
          style={{ paddingBottom: insets.bottom + 16 }}
        >
          <Button
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            onPress={handleSave}
          >
            Save Changes
          </Button>
        </View>

        <Dialog
          visible={deleteDialogVisible}
          onClose={() => setDeleteDialogVisible(false)}
          title="Delete Group?"
          description={`Are you sure you want to delete "${group.name}"? This cannot be undone.`}
          actions={[
            { label: "Cancel", variant: "ghost", onPress: () => setDeleteDialogVisible(false) },
            {
              label: "Delete",
              variant: "danger",
              onPress: () => {
                setDeleteDialogVisible(false);
                setTimeout(() => handleDeleteGroup(), 300);
              },
            },
          ]}
        />

        <Dialog
          visible={removeMemberDialogVisible}
          onClose={() => setRemoveMemberDialogVisible(false)}
          title="Remove Member?"
          description={`Are you sure you want to remove ${memberToRemove?.name} from "${group.name}"?`}
          actions={[
            { label: "Cancel", variant: "ghost", onPress: () => setRemoveMemberDialogVisible(false) },
            { label: "Remove", variant: "danger", onPress: confirmRemoveMember },
          ]}
        />

        <UserSearchBottomSheet
          ref={searchSheetRef}
          onSelect={handleAddMember}
          excludeUserIds={group.members.map((m) => m.userId)}
          title="Add to Group"
        />
      </KeyboardAvoidingView>
    </View>
  );
}
