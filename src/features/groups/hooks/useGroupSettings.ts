import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "expo-router";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/context/AppContext";
import { useUIStore } from "@/store/useUIStore";
import {
  useGroups,
  useUpdateGroupSettings,
  useArchiveGroup,
  useInviteMembers,
  useRemoveGroupMember,
  useLeaveGroup,
} from "@/features/groups/queries/useGroups";
import { useGroupExpenses } from "@/features/expenses/queries/useExpenses";
import { useGroupSettlements } from "@/features/settlements/queries/useSettlements";
import { useFriends } from "@/features/friends/queries/useFriends";
import * as balancesUtil from "@/features/settlements/utils/balances";
import { useAppToast } from "@/hooks/useAppToast";
import { getGroupPermissions } from "@/features/permissions/contracts";
import type { Group, SplitMethod } from "@/types";
import type { GroupPermissions } from "@/features/permissions/contracts";

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
  newExpenseAlerts: boolean;
  setNewExpenseAlerts: (v: boolean) => void;
  loading: boolean;
  isLoading: boolean;
  friends: any[];
  balances: Map<string, number>;
  permissions: GroupPermissions | null;
  currentMember: Group["members"][number] | null;
  blockingBalances: { userId: string; userName: string; amount: number }[];
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

  const { mutateAsync: updateGroupSettings } = useUpdateGroupSettings();
  const { mutateAsync: archiveGroup } = useArchiveGroup();
  const { mutateAsync: removeGroupMember } = useRemoveGroupMember();
  const { mutateAsync: inviteMembers } = useInviteMembers();
  const { mutateAsync: leaveGroup } = useLeaveGroup();

  const { data: groups = [] } = useGroups(currentUser?.id);
  const { data: expenses = [], isLoading: isLoadingExpenses } = useGroupExpenses(groupId);
  const { data: settlements = [], isLoading: isLoadingSettlements } = useGroupSettlements(groupId);
  const { data: friends = [], isLoading: isLoadingFriends } = useFriends(currentUser?.id);

  const preferredCurrency = useUIStore((s) => s.preferredCurrency);
  const convertCurrency = useUIStore((s) => s.convertCurrency);

  const group = groups.find((item) => item.id === groupId);

  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("Home");
  const [currencyCode, setCurrencyCode] = useState("USD");
  const [simplifyDebts, setSimplifyDebts] = useState(false);
  const [defaultSplitMethod, setDefaultSplitMethod] = useState<SplitMethod>("equal");
  const [newExpenseAlerts, setNewExpenseAlerts] = useState(false);

  const [loading, setLoading] = useState(false);
  const deleteSheetRef = useRef<BottomSheetModal>(null);
  const leaveSheetRef = useRef<BottomSheetModal>(null);
  const [memberToRemove, setMemberToRemove] = useState<{ id: string; name: string } | null>(null);
  const removeMemberSheetRef = useRef<BottomSheetModal>(null);
  const searchSheetRef = useRef<BottomSheetModal>(null);

  const initializedForGroupId = useRef<string | null>(null);
  const formTouched = useRef(false);

  useEffect(() => {
    if (!group) return;
    if (initializedForGroupId.current === group.id) return;
    if (formTouched.current) return;

    initializedForGroupId.current = group.id;
    setName(group.name ?? "");
    setNameError("");
    setDescription(group.description ?? "");
    setIcon(group.icon ?? "Home");
    setCurrencyCode(group.currency ?? "USD");
    setSimplifyDebts(group.simplifyDebts ?? false);
    setDefaultSplitMethod((group as any)?.defaultSplitMethod ?? "equal");
  }, [group]);

  const markTouched = useCallback(() => {
    formTouched.current = true;
  }, []);

  const handleSetName = useCallback(
    (v: string) => {
      markTouched();
      setNameError("");
      setName(v);
    },
    [markTouched]
  );

  const handleSetDescription = useCallback(
    (v: string) => {
      markTouched();
      setDescription(v);
    },
    [markTouched]
  );

  const handleSetIcon = useCallback(
    (v: string) => {
      markTouched();
      setIcon(v);
    },
    [markTouched]
  );

  const handleSetCurrencyCode = useCallback(
    (v: string) => {
      markTouched();
      setCurrencyCode(v);
    },
    [markTouched]
  );

  const handleSetSimplifyDebts = useCallback(
    (v: boolean) => {
      markTouched();
      setSimplifyDebts(v);
    },
    [markTouched]
  );

  const handleSetDefaultSplitMethod = useCallback(
    (v: SplitMethod) => {
      markTouched();
      setDefaultSplitMethod(v);
    },
    [markTouched]
  );

  const handleSetNewExpenseAlerts = useCallback(
    (v: boolean) => {
      markTouched();
      setNewExpenseAlerts(v);
    },
    [markTouched]
  );

  const currentMember = useMemo(() => {
    if (!group || !currentUser) return null;
    return group.members.find((m) => m.userId === currentUser.id) ?? null;
  }, [group, currentUser]);

  const permissions = useMemo((): GroupPermissions | null => {
    if (!group || !currentUser) return null;
    return getGroupPermissions({
      currentUserId: currentUser.id,
      createdBy: group.createdBy,
      memberIds: group.members.map((m) => m.userId),
    });
  }, [group, currentUser]);

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

  const blockingBalances = useMemo(() => {
    if (!group) return [];
    const result: { userId: string; userName: string; amount: number }[] = [];
    for (const [userId, amount] of balances) {
      if (Math.abs(amount) > 0.01) {
        const member = group.members.find((m) => m.userId === userId);
        result.push({ userId, userName: member?.user?.name ?? userId, amount });
      }
    }
    return result;
  }, [balances, group]);

  useEffect(() => {
    if (!currentMember) return;
    if (initializedForGroupId.current !== group?.id) return;
    setNewExpenseAlerts(currentMember.newExpenseAlerts ?? false);
  }, [currentMember, group?.id]);

  const isLoading = isLoadingExpenses || isLoadingSettlements || isLoadingFriends;

  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      setNameError("Group name is required");
      return;
    }
    setLoading(true);
    try {
      await updateGroupSettings({
        groupId: group!.id,
        name: name.trim(),
        icon,
        currency: currencyCode,
        newExpenseAlerts,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      formTouched.current = false;
      initializedForGroupId.current = null;
      toast.show({
        label: "Saved",
        description: "Group settings updated.",
        variant: "success",
        placement: "top",
      });
      setLoading(false);
    } catch {
      toast.show({
        label: "Error",
        description: "Failed to update group.",
        variant: "danger",
        placement: "top",
      });
      setLoading(false);
    }
  }, [name, icon, currencyCode, newExpenseAlerts, group, updateGroupSettings, toast]);

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

      try {
        await inviteMembers({ groupId: group.id, userIds: [user.id] });
        toast.show({
          label: "Member Added",
          description: `${user.name} was added to the group.`,
          variant: "success",
          placement: "top",
        });
      } catch {
        toast.show({
          label: "Error",
          description: "Failed to add member.",
          variant: "danger",
          placement: "top",
        });
      }
    },
    [group, inviteMembers, toast]
  );

  const handleDeleteGroup = useCallback(async () => {
    if (!group) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    try {
      await archiveGroup(group.id);
      router.replace("/circles?segment=groups");
    } catch {
      toast.show({
        label: "Error",
        description: "Failed to delete group",
        variant: "danger",
        placement: "top",
      });
    }
  }, [group, archiveGroup, router, toast]);

  const handleLeaveGroup = useCallback(async () => {
    if (!group) return;
    try {
      await leaveGroup(group.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/circles?segment=groups");
    } catch {
      toast.show({
        label: "Error",
        description: "Failed to leave group.",
        variant: "danger",
        placement: "top",
      });
    }
  }, [group, leaveGroup, router, toast]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  return {
    group,
    name,
    setName: handleSetName,
    nameError,
    setNameError,
    description,
    setDescription: handleSetDescription,
    icon,
    setIcon: handleSetIcon,
    currencyCode,
    setCurrencyCode: handleSetCurrencyCode,
    simplifyDebts,
    setSimplifyDebts: handleSetSimplifyDebts,
    defaultSplitMethod,
    setDefaultSplitMethod: handleSetDefaultSplitMethod,
    newExpenseAlerts,
    setNewExpenseAlerts: handleSetNewExpenseAlerts,
    loading,
    isLoading,
    friends,
    balances,
    permissions,
    currentMember,
    blockingBalances,
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
