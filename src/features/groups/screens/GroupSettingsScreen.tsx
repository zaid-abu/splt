import { Typography, Spinner, Switch } from "heroui-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { GroupSettingsRouteParams } from "@/types/navigation";
import type { JSX } from "react";
import { useState, useMemo, useRef } from "react";
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView } from "@gorhom/bottom-sheet";
import { StatusBar } from "expo-status-bar";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  Pressable,
  TextInput,
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
import { GROUP_ICONS } from "@/constants/icons";
import { UI, IconButton, SectionLabel } from "@/components/ui/native-ui";

const TEXT_DANGER = UI.color.danger;

function IconShell({
  IconComponent,
  size = 44,
  selected,
}: {
  IconComponent: any;
  size?: number;
  selected?: boolean;
}): JSX.Element {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: UI.radius.lg,
        backgroundColor: selected ? UI.color.text : UI.color.control,
        borderWidth: 1,
        borderColor: selected ? UI.color.text : UI.color.border,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <IconComponent
        size={size === 44 ? 20 : 28}
        color={selected ? "#FFFFFF" : UI.color.text}
        strokeWidth={1.5}
      />
    </View>
  );
}

const SHEET_BACKDROP = (props: any) => (
  <BottomSheetBackdrop
    {...props}
    disappearsOnIndex={-1}
    appearsOnIndex={0}
    pressBehavior="close"
    opacity={0.4}
  />
);

function ConfirmationSheet({
  title,
  message,
  confirmLabel = "Confirm",
  confirmColor = TEXT_DANGER,
  sheetRef,
  onConfirm,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  confirmColor?: string;
  sheetRef: React.RefObject<BottomSheetModal | null>;
  onConfirm: () => void;
}): JSX.Element {
  return (
    <BottomSheetModal
      ref={sheetRef}
      index={0}
      enableDynamicSizing
      backdropComponent={SHEET_BACKDROP}
      backgroundStyle={{ backgroundColor: UI.color.bg, borderRadius: 0 }}
      handleIndicatorStyle={{ backgroundColor: UI.color.muted, width: 40 }}
    >
      <BottomSheetView style={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 24 }}>
        <Typography
          style={{
            fontSize: 22,
            fontFamily: "IBMPlexSans_600SemiBold",
            color: UI.color.text,
            marginBottom: 8,
          }}
        >
          {title}
        </Typography>
        <Typography
          style={{
            fontSize: 16,
            fontFamily: "IBMPlexSans_500Medium",
            color: UI.color.muted,
            marginBottom: 24,
            lineHeight: 22,
          }}
        >
          {message}
        </Typography>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <Pressable
            onPress={() => sheetRef.current?.dismiss()}
            style={({ pressed }) => ({
              flex: 1,
              height: 52,
              borderRadius: UI.radius.pill,
              borderWidth: 1,
              borderColor: UI.color.border,
              backgroundColor: UI.color.control,
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.65 : 1,
            })}
          >
            <Typography
              style={{
                fontSize: 16,
                fontFamily: "IBMPlexSans_600SemiBold",
                color: UI.color.text,
              }}
            >
              Cancel
            </Typography>
          </Pressable>
          <Pressable
            onPress={() => {
              sheetRef.current?.dismiss();
              setTimeout(onConfirm, 300);
            }}
            style={({ pressed }) => ({
              flex: 1,
              height: 52,
              borderRadius: UI.radius.pill,
              backgroundColor: confirmColor,
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Typography
              style={{
                fontSize: 16,
                fontFamily: "IBMPlexSans_600SemiBold",
                color: "#FFFFFF",
              }}
            >
              {confirmLabel}
            </Typography>
          </Pressable>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
}

export default function GroupSettingsScreen(): JSX.Element {
  const { id } = useLocalSearchParams<GroupSettingsRouteParams>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();

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
  const [nameError, setNameError] = useState("");
  const [description, setDescription] = useState(group?.description ?? "");
  const [icon, setIcon] = useState(group?.icon ?? "Home");
  const [currencyCode, setCurrencyCode] = useState(group?.currency ?? "USD");
  const [simplifyDebts, setSimplifyDebts] = useState(group?.simplifyDebts ?? false);
  const [defaultSplitMethod, setDefaultSplitMethod] = useState<"equal" | "custom" | "percentage">(
    (group as any)?.defaultSplitMethod ?? "equal"
  );
  const currency = CURRENCIES.find((c) => c.code === currencyCode) ?? CURRENCIES[0];

  const [loading, setLoading] = useState(false);
  const deleteSheetRef = useRef<BottomSheetModal>(null);
  const leaveSheetRef = useRef<BottomSheetModal>(null);
  const [memberToRemove, setMemberToRemove] = useState<{ id: string; name: string } | null>(null);
  const removeMemberSheetRef = useRef<BottomSheetModal>(null);
  const searchSheetRef = useRef<BottomSheetModal>(null);

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

  if (!group) {
    return (
      <View style={{ flex: 1, backgroundColor: UI.color.bg, paddingTop: insets.top }}>
        <StatusBar style="dark" />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <View
            style={{
              alignItems: "center",
              backgroundColor: UI.color.surface,
              borderRadius: UI.radius.lg,
              borderWidth: 1,
              borderColor: UI.color.border,
              padding: 32,
            }}
          >
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: UI.radius.lg,
                backgroundColor: UI.color.control,
                borderWidth: 1,
                borderColor: UI.color.border,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <icons.Frown size={24} color={UI.color.text} strokeWidth={1.8} />
            </View>
            <Typography
              style={{
                fontSize: 18,
                color: UI.color.text,
                fontFamily: "IBMPlexSans_600SemiBold",
                marginBottom: 8,
              }}
            >
              Group not found
            </Typography>
            <Typography
              style={{
                fontSize: 14,
                color: UI.color.muted,
                fontFamily: "IBMPlexSans_500Medium",
                textAlign: "center",
              }}
            >
              This group may have been deleted.
            </Typography>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => ({
                marginTop: 20,
                paddingVertical: 14,
                paddingHorizontal: 24,
                backgroundColor: UI.color.text,
                borderRadius: UI.radius.pill,
                opacity: pressed ? 0.75 : 1,
              })}
            >
              <Typography
                style={{ color: "#FFFFFF", fontFamily: "IBMPlexSans_600SemiBold", fontSize: 15 }}
              >
                Go back
              </Typography>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  async function handleSave(): Promise<void> {
    if (!name.trim()) {
      setNameError("Group name is required");
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
          defaultSplitMethod,
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
    removeMemberSheetRef.current?.present();
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
    } catch {
      toast.show({
        label: "Error",
        description: "Failed to remove member.",
        variant: "danger",
        placement: "top",
      });
    }
    removeMemberSheetRef.current?.dismiss();
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
        await addFriend({ userId: currentUser.id, friendId: user.id, groupId: group.id });
        toast.show({
          label: "Request Sent",
          description: `Friend request sent to ${user.name}. They will be added to the group once accepted.`,
          variant: "success",
          placement: "top",
        });
      }
    } catch {
      toast.show({
        label: "Error",
        description: "Failed to add member.",
        variant: "danger",
        placement: "top",
      });
    }
  }

  async function handleDeleteGroup() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    try {
      await deleteGroup(group!.id);
      router.replace("/(tabs)/groups");
    } catch {
      toast.show({
        label: "Error",
        description: "Failed to delete group",
        variant: "danger",
        placement: "top",
      });
    }
  }

  const handleLeaveGroup = async () => {
    try {
      await removeGroupMember({ groupId: group!.id, userId: currentUser.id });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)/groups");
    } catch {
      toast.show({
        label: "Error",
        description: "Failed to leave group.",
        variant: "danger",
        placement: "top",
      });
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: UI.color.bg }}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View
          style={{
            paddingTop: insets.top + 16,
            paddingHorizontal: UI.space.page,
            paddingBottom: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography
            style={{
              fontFamily: "Sora_600SemiBold",
              fontSize: 32,
              color: UI.color.text,
            }}
          >
            Settings
          </Typography>
          <IconButton
            icon={icons.X}
            accessibilityLabel="Close settings"
            onPress={() => router.back()}
          />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 140 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            entering={FadeInDown.duration(400)}
            style={{ paddingHorizontal: UI.space.page, marginBottom: 48 }}
          >
            <SectionLabel>Identity</SectionLabel>

            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 32, gap: 16 }}>
              <IconShell
                IconComponent={(icons as any)[icon] || icons.HelpCircle}
                size={64}
                selected
              />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 10 }}
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
                      style={({ pressed }) => ({
                        opacity: pressed ? 0.65 : 1,
                      })}
                    >
                      <IconShell IconComponent={IconComponent} />
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            <TextInput
              value={name}
              onChangeText={(v) => {
                setNameError("");
                setName(v);
              }}
              placeholder="Group Name"
              placeholderTextColor={UI.color.muted}
              autoCapitalize="words"
              style={{
                fontSize: 28,
                color: UI.color.text,
                fontFamily: "Sora_600SemiBold",
                borderBottomWidth: 1,
                borderBottomColor: UI.color.border,
                paddingBottom: 14,
                marginBottom: nameError ? 8 : 24,
              }}
            />
            {nameError ? (
              <Typography
                style={{
                  marginBottom: 16,
                  color: TEXT_DANGER,
                  fontSize: 13,
                  fontFamily: "IBMPlexSans_500Medium",
                }}
              >
                {nameError}
              </Typography>
            ) : null}

            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Description (Optional)"
              placeholderTextColor={UI.color.muted}
              multiline
              style={{
                fontSize: 16,
                color: UI.color.text,
                fontFamily: "IBMPlexSans_400Regular",
                borderBottomWidth: 1,
                borderBottomColor: UI.color.border,
                paddingBottom: 14,
              }}
            />
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(400).delay(100)}
            style={{ paddingHorizontal: UI.space.page, marginBottom: 48 }}
          >
            <SectionLabel>Finance</SectionLabel>

            <View
              style={{
                borderBottomWidth: 1,
                borderBottomColor: UI.color.border,
                paddingBottom: 20,
                marginBottom: 20,
              }}
            >
              <CurrencySelector
                label="Base Currency"
                value={currency.code}
                onChange={(c) => setCurrencyCode(c.code)}
              />
            </View>

            <View
              style={{
                borderBottomWidth: 1,
                borderBottomColor: UI.color.border,
                paddingBottom: 20,
                marginBottom: 20,
              }}
            >
              <Typography
                style={{
                  fontSize: 16,
                  color: UI.color.text,
                  fontFamily: "IBMPlexSans_600SemiBold",
                  marginBottom: 12,
                }}
              >
                Default Split Method
              </Typography>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {(["equal", "custom", "percentage"] as const).map((method) => {
                  const active = defaultSplitMethod === method;
                  return (
                    <Pressable
                      key={method}
                      onPress={() => setDefaultSplitMethod(method)}
                      style={({ pressed }) => ({
                        flex: 1,
                        minHeight: 42,
                        paddingHorizontal: 12,
                        borderRadius: UI.radius.pill,
                        backgroundColor: active ? UI.color.text : UI.color.control,
                        borderWidth: 1,
                        borderColor: active ? UI.color.text : UI.color.border,
                        alignItems: "center",
                        justifyContent: "center",
                        opacity: pressed ? 0.72 : 1,
                      })}
                    >
                      <Typography
                        style={{
                          fontSize: 13,
                          fontFamily: "IBMPlexSans_600SemiBold",
                          color: active ? "#FFFFFF" : UI.color.text,
                          textTransform: "capitalize",
                        }}
                      >
                        {method}
                      </Typography>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingBottom: 20,
              }}
            >
              <View style={{ flex: 1, marginRight: 24 }}>
                <Typography
                  style={{
                    fontSize: 16,
                    color: UI.color.text,
                    fontFamily: "IBMPlexSans_600SemiBold",
                    marginBottom: 4,
                  }}
                >
                  Simplify Debts
                </Typography>
                <Typography
                  style={{
                    fontSize: 14,
                    color: UI.color.muted,
                    fontFamily: "IBMPlexSans_400Regular",
                    lineHeight: 20,
                  }}
                >
                  Combine debts to reduce the number of payments between members.
                </Typography>
              </View>
              <Switch isSelected={simplifyDebts} onSelectedChange={setSimplifyDebts} />
            </View>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(400).delay(200)}
            style={{ paddingHorizontal: UI.space.page, marginBottom: 48 }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <SectionLabel>Members</SectionLabel>
              <Pressable
                accessibilityRole="button"
                onPress={() => searchSheetRef.current?.present()}
                hitSlop={8}
                style={({ pressed }) => ({ opacity: pressed ? 0.65 : 1 })}
              >
                <Typography
                  style={{
                    fontSize: 14,
                    color: UI.color.text,
                    fontFamily: "IBMPlexSans_600SemiBold",
                  }}
                >
                  + Add Member
                </Typography>
              </Pressable>
            </View>

            <View
              style={{
                borderRadius: UI.radius.lg,
                borderWidth: 1,
                borderColor: UI.color.border,
                backgroundColor: UI.color.surface,
                overflow: "hidden",
              }}
            >
              {group.members.map((member, idx) => {
                const memBalance = balances.get(member.userId) ?? 0;
                const isLast = idx === group.members.length - 1;
                return (
                  <View
                    key={member.userId}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingVertical: 14,
                      paddingHorizontal: 16,
                      borderBottomWidth: isLast ? 0 : 1,
                      borderBottomColor: UI.color.border,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                      <AppUserAvatar user={member.user} size="md" />
                      <View>
                        <Typography
                          style={{
                            fontSize: 16,
                            color: UI.color.text,
                            fontFamily: "IBMPlexSans_600SemiBold",
                          }}
                        >
                          {member.userId === currentUser.id ? "You" : member.user.name}
                        </Typography>
                        <Typography
                          style={{
                            fontSize: 14,
                            color: UI.color.muted,
                            fontFamily: "IBMPlexSans_500Medium",
                            marginTop: 2,
                          }}
                        >
                          {getCurrencySymbol(currencyCode)}
                          {Math.abs(memBalance).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </Typography>
                      </View>
                    </View>
                    {member.userId !== currentUser.id && (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Remove ${member.user.name}`}
                        onPress={() => handleRemoveMemberClick(member.userId, member.user.name)}
                        hitSlop={8}
                        style={({ pressed }) => ({
                          width: 44,
                          height: 44,
                          borderRadius: UI.radius.pill,
                          backgroundColor: UI.color.control,
                          borderWidth: 1,
                          borderColor: UI.color.border,
                          alignItems: "center",
                          justifyContent: "center",
                          opacity: pressed ? 0.65 : 1,
                        })}
                      >
                        <icons.X size={18} color={UI.color.muted} strokeWidth={2} />
                      </Pressable>
                    )}
                  </View>
                );
              })}
            </View>
          </Animated.View>

          <View style={{ paddingHorizontal: UI.space.page, paddingBottom: 40 }}>
            <Pressable
              accessibilityRole="button"
              onPress={() => deleteSheetRef.current?.present()}
              style={({ pressed }) => ({
                height: 56,
                borderRadius: UI.radius.pill,
                borderWidth: 1,
                borderColor: UI.color.danger,
                backgroundColor: UI.color.control,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.65 : 1,
              })}
            >
              <Typography
                style={{
                  fontSize: 16,
                  color: UI.color.danger,
                  fontFamily: "IBMPlexSans_600SemiBold",
                }}
              >
                Delete Group
              </Typography>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => leaveSheetRef.current?.present()}
              style={({ pressed }) => ({
                height: 56,
                borderRadius: UI.radius.pill,
                borderWidth: 1,
                borderColor: UI.color.border,
                backgroundColor: UI.color.control,
                alignItems: "center",
                justifyContent: "center",
                marginTop: 12,
                opacity: pressed ? 0.65 : 1,
              })}
            >
              <Typography
                style={{
                  fontSize: 16,
                  color: UI.color.text,
                  fontFamily: "IBMPlexSans_600SemiBold",
                }}
              >
                Leave Group
              </Typography>
            </Pressable>
          </View>
        </ScrollView>

        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            paddingHorizontal: UI.space.page,
            paddingTop: 16,
            paddingBottom: Math.max(insets.bottom, 16),
            backgroundColor: UI.color.bg,
            borderTopWidth: 1,
            borderTopColor: UI.color.border,
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Save changes"
            onPress={handleSave}
            disabled={loading}
            style={({ pressed }) => ({
              height: 56,
              borderRadius: UI.radius.pill,
              backgroundColor: UI.color.text,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: 8,
              opacity: pressed || loading ? 0.78 : 1,
            })}
          >
            {loading && <Spinner color="white" size="sm" />}
            <Typography
              style={{ fontSize: 16, color: "#FFFFFF", fontFamily: "IBMPlexSans_600SemiBold" }}
            >
              Save Changes
            </Typography>
          </Pressable>
        </View>

        <ConfirmationSheet
          title="Delete Group?"
          message={`Are you sure you want to delete "${group.name}"? This cannot be undone.`}
          confirmLabel="Delete"
          confirmColor={TEXT_DANGER}
          sheetRef={deleteSheetRef}
          onConfirm={handleDeleteGroup}
        />

        <ConfirmationSheet
          title="Remove Member?"
          message={`Are you sure you want to remove ${memberToRemove?.name} from "${group.name}"?`}
          confirmLabel="Remove"
          confirmColor={TEXT_DANGER}
          sheetRef={removeMemberSheetRef}
          onConfirm={confirmRemoveMember}
        />

        <ConfirmationSheet
          title="Leave Group?"
          message={`Are you sure you want to leave "${group.name}"? Your expense history will be preserved.`}
          confirmLabel="Leave"
          confirmColor={UI.color.text}
          sheetRef={leaveSheetRef}
          onConfirm={handleLeaveGroup}
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
