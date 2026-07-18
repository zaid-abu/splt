import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "expo-router";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/context/AppContext";
import { useUIStore } from "@/store/useUIStore";
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
import { useAppToast } from "@/hooks/useAppToast";
import type { Group, SplitMethod } from "@/types";

export interface UseGroupSettingsReturn {
  group: Group | undefined;
  name: string;
  setName: (v: string) => void;
  nameError: string;
  setNameError: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  icon: string;
  setIcon: (v: string) => void;
  currencyCode: string;
  setCurrencyCode: (v: string) => void;
  simplifyDebts: boolean;
  setSimplifyDebts: (v: boolean) => void;
  defaultSplitMethod: SplitMethod;
  setDefaultSplitMethod: (v: SplitMethod) => void;
  loading: boolean;
  isLoading: boolean;
  friends: any[];
  balances: Map<string, number>;
  deleteSheetRef: React.RefObject<BottomSheetModal | null>;
  leaveSheetRef: React.RefObject<BottomSheetModal | null>;
  removeMemberSheetRef: React.RefObject<BottomSheetModal | null>;
  searchSheetRef: React.RefObject<BottomSheetModal | null>;
  memberToRemove: { id: string; name: string } | null;
  handleSave: () => Promise<void>;
  handleRemoveMemberClick: (userId: string, userName: string) => void;
  confirmRemoveMember: () => Promise<void>;
  handleAddMember: (user: any) => Promise<void>;
  handleDeleteGroup: () => Promise<void>;
  handleLeaveGroup: () => Promise<void>;
  handleBack: () => void;
}

export function useGroupSettings(groupId: string): UseGroupSettingsReturn {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { toast } = useAppToast();

  const { mutateAsync: updateGroup } = useUpdateGroup();
  const { mutateAsync: deleteGroup } = useDeleteGroup();
  const { mutateAsync: removeGroupMember } = useRemoveGroupMember();
  const { mutateAsync: addGroupMembers } = useAddGroupMembers();

  const { data: groups = [] } = useGroups(currentUser?.id);
  const { data: expenses = [], isLoading: isLoadingExpenses } = useGroupExpenses(groupId);
  const { data: settlements = [], isLoading: isLoadingSettlements } = useGroupSettlements(groupId);
  const { data: friends = [], isLoading: isLoadingFriends } = useFriends(currentUser?.id);
  const { mutateAsync: addFriend } = useAddFriend();

  const preferredCurrency = useUIStore((s) => s.preferredCurrency);
  const convertCurrency = useUIStore((s) => s.convertCurrency);

  const group = groups.find((item) => item.id === groupId);

  const [name, setName] = useState(group?.name ?? "");
  const [nameError, setNameError] = useState("");
  const [description, setDescription] = useState(group?.description ?? "");
  const [icon, setIcon] = useState(group?.icon ?? "Home");
  const [currencyCode, setCurrencyCode] = useState(group?.currency ?? "USD");
  const [simplifyDebts, setSimplifyDebts] = useState(group?.simplifyDebts ?? false);
  const [defaultSplitMethod, setDefaultSplitMethod] = useState<SplitMethod>(
    (group as any)?.defaultSplitMethod ?? "equal"
  );

  const [loading, setLoading] = useState(false);
  const deleteSheetRef = useRef<BottomSheetModal>(null);
  const leaveSheetRef = useRef<BottomSheetModal>(null);
  const [memberToRemove, setMemberToRemove] = useState<{ id: string; name: string } | null>(null);
  const removeMemberSheetRef = useRef<BottomSheetModal>(null);
  const searchSheetRef = useRef<BottomSheetModal>(null);

  const balances = useMemo(
    () =>
      balancesUtil.getGroupBalances(
        groupId,
        expenses,
        settlements,
        group,
        preferredCurrency,
        convertCurrency
      ),
    [groupId, expenses, settlements, group, preferredCurrency, convertCurrency]
  );

  const isLoading = isLoadingExpenses || isLoadingSettlements || isLoadingFriends;

  const handleSave = useCallback(async () => {
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
          currency: currencyCode,
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
  }, [
    name,
    description,
    icon,
    currencyCode,
    simplifyDebts,
    defaultSplitMethod,
    group,
    updateGroup,
    router,
    toast,
  ]);

  const handleRemoveMemberClick = useCallback(
    (userId: string, userName: string) => {
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
    },
    [balances, toast]
  );

  const confirmRemoveMember = useCallback(async () => {
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
  }, [memberToRemove, group, removeGroupMember, toast]);

  const handleAddMember = useCallback(
    async (user: any) => {
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
    },
    [group, friends, addGroupMembers, addFriend, currentUser.id, toast]
  );

  const handleDeleteGroup = useCallback(async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    try {
      await deleteGroup(group!.id);
      router.replace("/home");
    } catch {
      toast.show({
        label: "Error",
        description: "Failed to delete group",
        variant: "danger",
        placement: "top",
      });
    }
  }, [group, deleteGroup, router, toast]);

  const handleLeaveGroup = useCallback(async () => {
    try {
      await removeGroupMember({ groupId: group!.id, userId: currentUser.id });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/home");
    } catch {
      toast.show({
        label: "Error",
        description: "Failed to leave group.",
        variant: "danger",
        placement: "top",
      });
    }
  }, [group, removeGroupMember, currentUser.id, router, toast]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  return {
    group,
    name,
    setName,
    nameError,
    setNameError,
    description,
    setDescription,
    icon,
    setIcon,
    currencyCode,
    setCurrencyCode,
    simplifyDebts,
    setSimplifyDebts,
    defaultSplitMethod,
    setDefaultSplitMethod,
    loading,
    isLoading,
    friends,
    balances,
    deleteSheetRef,
    leaveSheetRef,
    removeMemberSheetRef,
    searchSheetRef,
    memberToRemove,
    handleSave,
    handleRemoveMemberClick,
    confirmRemoveMember,
    handleAddMember,
    handleDeleteGroup,
    handleLeaveGroup,
    handleBack,
  };
}
