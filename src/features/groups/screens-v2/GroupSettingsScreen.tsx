import { View, ScrollView, Text, Pressable, Switch } from "react-native";
import * as Haptics from "expo-haptics";
import * as icons from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { CoralScreen } from "@/components/coral/CoralScreen";
import { CoralTopBar } from "@/components/coral/CoralTopBar";
import { CoralField } from "@/components/coral/CoralField";
import { CoralButton } from "@/components/coral/CoralButton";
import { CoralSelect, type SelectOption } from "@/components/coral/CoralSelect";
import { Eyebrow } from "@/components/coral/Eyebrow";
import { MoneyRow } from "@/components/coral/MoneyRow";
import { useCoralColors } from "@/components/coral/useCoral";

import { useGroupSettings } from "@/features/groups/hooks/useGroupSettings";
import { useAuth } from "@/context/AppContext";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { ConfirmationSheet } from "@/components/dialogs/ConfirmationSheet";
import { UserSearchBottomSheet } from "@/features/groups/components/UserSearchBottomSheet";
import { GROUP_ICONS } from "@/constants/icons";
import { CURRENCIES } from "@/types";

export default function GroupSettingsScreen() {
  const router = useRouter();
  const coral = useCoralColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { currentUser } = useAuth();

  const {
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
    newExpenseAlerts,
    setNewExpenseAlerts,
    loading,
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
  } = useGroupSettings(id || "");

  if (!group) {
    return (
      <CoralScreen>
        <CoralTopBar title="Settings" onBack={() => router.back()} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80 }}>
          <Text
            style={{
              fontFamily: "InstrumentSans_600SemiBold",
              fontSize: 18,
              color: coral.foreground,
              marginBottom: 8,
            }}
          >
            Group not found
          </Text>
          <Text
            style={{ fontFamily: "InstrumentSans_400Regular", fontSize: 14, color: coral.muted }}
          >
            This group may have been deleted.
          </Text>
          <View style={{ marginTop: 24, width: "100%" }}>
            <CoralButton label="Go back" onPress={() => router.back()} variant="text" />
          </View>
        </View>
      </CoralScreen>
    );
  }

  const currencyOptions: SelectOption[] = CURRENCIES.map((c) => ({
    label: `${c.symbol} ${c.code}`,
    value: c.code,
  }));

  const splitMethodOptions: SelectOption[] = [
    { label: "Equal", value: "equal" },
    { label: "Custom", value: "custom" },
    { label: "Percentage", value: "percentage" },
  ];

  const canEdit = permissions?.canEdit ?? false;
  const canDelete = permissions?.canDelete ?? false;
  const canLeave = permissions?.canLeave ?? false;
  const canAddMember = permissions?.canAddMember ?? false;

  const hasBlockers = blockingBalances.length > 0;

  function blockerSummary(): string {
    if (!hasBlockers) return ""
    const lines = blockingBalances.map(
      (b) => `${b.userName}: ${b.amount > 0 ? "+" : ""}${b.amount.toFixed(2)}`
    )
    return `\n\nOutstanding balances in ${group.currency}:\n${lines.join("\n")}`
  }

  return (
    <CoralScreen contentContainerStyle={{ gap: 4 }}>
      <CoralTopBar title="Settings" onBack={() => router.back()} />

      {canEdit && (
        <>
          <Eyebrow>Identity</Eyebrow>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 10, paddingBottom: 4 }}
          >
            {GROUP_ICONS.map((i) => {
              const Ico = (icons as any)[i] || icons.HelpCircle;
              const isSelected = icon === i;
              return (
                <Pressable
                  key={i}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setIcon(i);
                  }}
                >
                  <View
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 14,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: isSelected ? coral.accent : coral.surface,
                      borderWidth: 1,
                      borderColor: isSelected ? coral.accent : coral.border,
                    }}
                  >
                    <Ico
                      size={22}
                      color={isSelected ? coral.inkOnAccent : coral.foreground}
                      strokeWidth={isSelected ? 2 : 1.5}
                    />
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>

          <CoralField
            label="Name"
            placeholder="Group name"
            value={name}
            onChangeText={(v) => {
              setNameError("");
              setName(v);
            }}
            error={nameError}
          />

          <CoralField
            label="Description"
            placeholder="Optional description"
            value={description}
            onChangeText={setDescription}
          />

          <Eyebrow>Finance</Eyebrow>

          <CoralSelect
            label="Currency"
            options={currencyOptions}
            value={currencyCode}
            onValueChange={setCurrencyCode}
            placeholder="Select currency"
          />

          <CoralSelect
            label="Default split method"
            options={splitMethodOptions}
            value={defaultSplitMethod}
            onValueChange={(value) => setDefaultSplitMethod(value as any)}
            placeholder="Select method"
          />

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              minHeight: 52,
              marginTop: 8,
            }}
          >
            <Text
              style={{
                fontFamily: "InstrumentSans_400Regular",
                fontSize: 16,
                color: coral.foreground,
              }}
            >
              Simplify debts
            </Text>
            <Switch
              value={simplifyDebts}
              onValueChange={(v) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSimplifyDebts(v);
              }}
              trackColor={{ false: coral.border, true: coral.accent }}
              thumbColor="white"
            />
          </View>
        </>
      )}

      {currentMember && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            minHeight: 52,
            marginTop: 8,
          }}
        >
          <Text
            style={{
              fontFamily: "InstrumentSans_400Regular",
              fontSize: 16,
              color: coral.foreground,
            }}
          >
            New expense alerts
          </Text>
          <Switch
            value={newExpenseAlerts}
            onValueChange={(v) => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setNewExpenseAlerts(v);
            }}
            trackColor={{ false: coral.border, true: coral.accent }}
            thumbColor="white"
          />
        </View>
      )}

      <Eyebrow>Members ({group.members.length})</Eyebrow>

      <View style={{ gap: 4 }}>
        {group.members.map((member) => {
          const balance = balances.get(member.userId) ?? 0;
          const isCurrentUser = member.userId === currentUser.id;
          const balanceStr =
            Math.abs(balance) < 0.01
              ? "Settled"
              : `${balance > 0 ? "+" : ""}${
                  balance.toFixed
                    ? balance.toFixed(2)
                    : balance.toFixed
                      ? balance.toFixed(2)
                      : String(balance)
                }`;

          return (
            <MoneyRow
              key={member.userId}
              avatar={<AppUserAvatar user={member.user} size="sm" />}
              title={isCurrentUser ? "You" : member.user.name}
              subtitle={isCurrentUser ? undefined : member.user.email}
              amount={balanceStr}
              amountTone={
                Math.abs(balance) < 0.01 ? "neutral" : balance > 0 ? "positive" : "negative"
              }
              rightElement={
                !isCurrentUser && permissions?.canRemoveMember(member.userId) ? (
                  <Pressable
                    onPress={() => handleRemoveMemberClick(member.userId, member.user.name)}
                    style={{
                      minWidth: 44,
                      minHeight: 44,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <icons.Trash2 size={18} color={coral.muted} strokeWidth={1.5} />
                  </Pressable>
                ) : undefined
              }
            />
          );
        })}
      </View>

      {canAddMember && (
        <CoralButton
          label="+ Add member"
          variant="secondary"
          onPress={() => searchSheetRef.current?.present()}
        />
      )}

      <View style={{ height: 8 }} />

      {canEdit && (
        <CoralButton
          label="Save Changes"
          onPress={handleSave}
          disabled={loading}
          loading={loading}
        />
      )}

      <View style={{ height: 16 }} />

      {canDelete && (
        <CoralButton
          label={`Delete "${group.name}"`}
          variant="danger"
          onPress={() => deleteSheetRef.current?.present()}
        />
      )}

      {canLeave && (
        <CoralButton
          label="Leave group"
          variant="text"
          onPress={() => leaveSheetRef.current?.present()}
        />
      )}

      <View style={{ height: 40 }} />

      <ConfirmationSheet
        title="Delete Group?"
        description={
          hasBlockers
            ? `"${group.name}" has outstanding balances. Deleting will pause the group — history remains and invitations are cancelled.${blockerSummary()}`
            : `Are you sure you want to delete "${group.name}"? This cannot be undone.`
        }
        confirmLabel="Delete"
        confirmTone="danger"
        sheetRef={deleteSheetRef}
        onConfirm={handleDeleteGroup}
      />

      <ConfirmationSheet
        title="Remove Member?"
        description={
          memberToRemove && blockingBalances.some((b) => b.userId === memberToRemove.id)
            ? `${memberToRemove.name} has an outstanding balance. Remove them anyway?${blockerSummary()}`
            : `Are you sure you want to remove ${memberToRemove?.name} from "${group.name}"?`
        }
        confirmLabel="Remove"
        confirmTone="danger"
        sheetRef={removeMemberSheetRef}
        onConfirm={confirmRemoveMember}
      />

      <ConfirmationSheet
        title="Leave Group?"
        description={
          hasBlockers
            ? `"${group.name}" has outstanding balances in your name. Settle them before leaving.${blockerSummary()}`
            : `Are you sure you want to leave "${group.name}"? Your expense history will be preserved.`
        }
        confirmLabel="Leave"
        confirmTone="brand"
        sheetRef={leaveSheetRef}
        onConfirm={handleLeaveGroup}
      />

      <UserSearchBottomSheet
        ref={searchSheetRef}
        onSelect={handleAddMember}
        excludeUserIds={group.members.map((m) => m.userId)}
        title="Add to Group"
      />
    </CoralScreen>
  );
}
