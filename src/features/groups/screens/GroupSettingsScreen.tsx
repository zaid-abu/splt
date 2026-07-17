import { Typography, Spinner } from "heroui-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { GroupSettingsRouteParams } from "@/types/navigation";
import type { JSX } from "react";
import { ThemedStatusBar } from "@/components/ui/ThemedStatusBar";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as icons from "lucide-react-native";

import { useUI, IconButton, SectionLabel } from "@/components/ui";
import { Skeleton } from "@/components/ui/Skeleton";
import { ConfirmationSheet } from "@/components/dialogs/ConfirmationSheet";
import { UserSearchBottomSheet } from "@/features/groups/components/UserSearchBottomSheet";

import { useGroupSettings } from "@/features/groups/hooks/useGroupSettings";
import { GroupIdentitySection } from "@/features/groups/components/GroupIdentitySection";
import { GroupFinanceSection } from "@/features/groups/components/GroupFinanceSection";
import { GroupMembersSection } from "@/features/groups/components/GroupMembersSection";
import { GroupDangerZone } from "@/features/groups/components/GroupDangerZone";
import { useAuth } from "@/context/AppContext";

export default function GroupSettingsScreen(): JSX.Element {
  const { color, radius, space } = useUI();
  const { id } = useLocalSearchParams<GroupSettingsRouteParams>();
  const insets = useSafeAreaInsets();
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
    loading,
    isLoading,
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
  } = useGroupSettings(id || "");

  if (!group) {
    return (
      <View style={{ flex: 1, backgroundColor: color.bg, paddingTop: insets.top }}>
        <ThemedStatusBar />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <View
            style={{
              alignItems: "center",
              backgroundColor: color.surface,
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: color.border,
              padding: 32,
            }}
          >
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: radius.lg,
                backgroundColor: color.control,
                borderWidth: 1,
                borderColor: color.border,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <icons.Frown size={24} color={color.text} strokeWidth={1.8} />
            </View>
            <Typography
              style={{
                fontSize: 18,
                color: color.text,
                fontFamily: "IBMPlexSans_600SemiBold",
                marginBottom: 8,
              }}
            >
              Group not found
            </Typography>
            <Typography
              style={{
                fontSize: 14,
                color: color.muted,
                fontFamily: "IBMPlexSans_500Medium",
                textAlign: "center",
              }}
            >
              This group may have been deleted.
            </Typography>
            <Pressable
              onPress={handleBack}
              style={({ pressed }) => ({
                marginTop: 20,
                paddingVertical: 14,
                paddingHorizontal: 24,
                backgroundColor: color.text,
                borderRadius: radius.pill,
                opacity: pressed ? 0.75 : 1,
              })}
            >
              <Typography
                style={{
                  color: color.textInverse,
                  fontFamily: "IBMPlexSans_600SemiBold",
                  fontSize: 15,
                }}
              >
                Go back
              </Typography>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: color.bg }}>
        <ThemedStatusBar />
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={{ padding: space.page, gap: 24, paddingTop: insets.top + 16 }}>
            <Skeleton height={36} />
            <Skeleton height={48} />
            <Skeleton height={56} />
            <Skeleton height={14} />
            <Skeleton height={44} />
            <Skeleton height={14} />
            <Skeleton height={44} />
          </View>
        </KeyboardAvoidingView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      <ThemedStatusBar />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View
          style={{
            paddingTop: insets.top + 16,
            paddingHorizontal: space.page,
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
              color: color.text,
            }}
          >
            Settings
          </Typography>
          <IconButton
            icon={icons.X}
            accessibilityLabel="Close settings"
            onPress={handleBack}
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
            style={{ paddingHorizontal: space.page, marginBottom: 48 }}
          >
            <GroupIdentitySection
              icon={icon}
              onIconChange={(i) => {
                setIcon(i);
              }}
              name={name}
              onNameChange={(v) => {
                setNameError("");
                setName(v);
              }}
              nameError={nameError}
              description={description}
              onDescriptionChange={setDescription}
            />
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(400).delay(100)}
            style={{ paddingHorizontal: space.page, marginBottom: 48 }}
          >
            <GroupFinanceSection
              currencyCode={currencyCode}
              onCurrencyChange={setCurrencyCode}
              defaultSplitMethod={defaultSplitMethod}
              onDefaultSplitMethodChange={setDefaultSplitMethod}
              simplifyDebts={simplifyDebts}
              onSimplifyDebtsChange={setSimplifyDebts}
            />
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(400).delay(200)}
            style={{ paddingHorizontal: space.page, marginBottom: 48 }}
          >
            <GroupMembersSection
              members={group.members}
              currentUserId={currentUser.id}
              balances={balances}
              currencyCode={currencyCode}
              onAddMemberPress={() => searchSheetRef.current?.present()}
              onRemoveMember={handleRemoveMemberClick}
            />
          </Animated.View>

          <View style={{ paddingHorizontal: space.page, paddingBottom: 40 }}>
            <GroupDangerZone
              onDeletePress={() => deleteSheetRef.current?.present()}
              onLeavePress={() => leaveSheetRef.current?.present()}
            />
          </View>
        </ScrollView>

        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            paddingHorizontal: space.page,
            paddingTop: 16,
            paddingBottom: Math.max(insets.bottom, 16),
            backgroundColor: color.bg,
            borderTopWidth: 1,
            borderTopColor: color.border,
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Save changes"
            onPress={handleSave}
            disabled={loading}
            style={({ pressed }) => ({
              height: 56,
              borderRadius: radius.pill,
              backgroundColor: color.text,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: 8,
              opacity: pressed || loading ? 0.78 : 1,
            })}
          >
            {loading && <Spinner color={color.textInverse} size="sm" />}
            <Typography
              style={{
                fontSize: 16,
                color: color.textInverse,
                fontFamily: "IBMPlexSans_600SemiBold",
              }}
            >
              Save Changes
            </Typography>
          </Pressable>
        </View>

        <ConfirmationSheet
          title="Delete Group?"
          description={`Are you sure you want to delete "${group.name}"? This cannot be undone.`}
          confirmLabel="Delete"
          confirmTone="danger"
          sheetRef={deleteSheetRef}
          onConfirm={handleDeleteGroup}
        />

        <ConfirmationSheet
          title="Remove Member?"
          description={`Are you sure you want to remove ${memberToRemove?.name} from "${group.name}"?`}
          confirmLabel="Remove"
          confirmTone="danger"
          sheetRef={removeMemberSheetRef}
          onConfirm={confirmRemoveMember}
        />

        <ConfirmationSheet
          title="Leave Group?"
          description={`Are you sure you want to leave "${group.name}"? Your expense history will be preserved.`}
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
      </KeyboardAvoidingView>
    </View>
  );
}
