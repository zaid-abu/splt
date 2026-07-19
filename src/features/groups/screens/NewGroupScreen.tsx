import type { JSX } from "react";
import { useState, useRef, useCallback, useMemo } from "react";
import { View, Keyboard, Pressable } from "react-native";
import { ThemedStatusBar } from "@/components/ui/ThemedStatusBar";
import { useRouter } from "expo-router";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
  BottomSheetTextInput,
  BottomSheetModal,
} from "@gorhom/bottom-sheet";
import { ScrollView } from "react-native-gesture-handler";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { Typography, Spinner } from "heroui-native";
import * as Haptics from "expo-haptics";
import * as icons from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCreateGroup } from "@/features/groups/queries/useGroups";
import { useFriends } from "@/features/friends/queries/useFriends";
import { CurrencySelector } from "@/components/forms/CurrencySelector";
import { useAuth } from "@/context/AppContext";
import type { Currency, User } from "@/types";
import { useAppToast } from "@/hooks/useAppToast";
import { UserSearchBottomSheet } from "@/features/groups/components/UserSearchBottomSheet";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { useUI, IconButton, PrimaryButton, SectionLabel } from "@/components/ui";
import { useTheme } from "@/hooks/useTheme";

import { GROUP_ICONS } from "@/constants/icons";

const GROUP_PICKER_COLORS = [
  "#F5E7DD",
  "#E3ECEB",
  "#E6E8F1",
  "#EEE7F2",
  "#F0ECE7",
  "#E8E4DE",
  "#E8F0EA",
  "#EBE4E0",
];

const GROUP_PICKER_COLORS_DARK = [
  "#2A2520",
  "#202A28",
  "#22253A",
  "#2A2535",
  "#2A2825",
  "#25232A",
  "#1E2A25",
  "#2A2822",
];

export default function NewGroupScreen(): JSX.Element {
  const { color, radius, space, shadow } = useUI();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();
  const { isDarkMode } = useTheme();
  const { mutateAsync: createGroup } = useCreateGroup();
  const { data: friends = [] } = useFriends(currentUser?.id);
  const { toast } = useAppToast();

  const bottomSheetRef = useRef<BottomSheet>(null);

  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");
  const isNavigating = useRef(false);
  const [icon, setIcon] = useState("Home");
  const [currency, setCurrency] = useState<Currency>({
    code: "USD",
    name: "US Dollar",
    symbol: "$",
  });
  const [loading, setLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);

  const snapPoints = useMemo(() => ["90%"], []);

  const searchSheetRef = useRef<BottomSheetModal>(null);

  const handleDismiss = useCallback(() => {
    if (isNavigating.current) return;
    router.back();
  }, [router]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.4} />
    ),
    []
  );

  const openSearchSheet = () => {
    Keyboard.dismiss();
    searchSheetRef.current?.present();
  };

  const handleAddUser = (user: User) => {
    if (!selectedUsers.find((u) => u.id === user.id)) {
      setSelectedUsers([...selectedUsers, user]);
    }
    searchSheetRef.current?.dismiss();
  };

  const handleRemoveUser = (userId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedUsers(selectedUsers.filter((u) => u.id !== userId));
  };

  async function handleCreate(): Promise<void> {
    if (!name.trim()) {
      setNameError("Group name is required");
      return;
    }

    setLoading(true);
    try {
      const group = await createGroup({
        clientOperationId: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        name: name.trim(),
        icon,
        currency: currency.code,
        inviteeIds: selectedUsers.map((u) => u.id),
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      isNavigating.current = true;
      router.replace("/home");
      setTimeout(() => {
        router.push(`/group/${group.id}`);
      }, 50);
    } catch {
      toast.show({
        label: "Error",
        description: "Failed to create group. Please try again.",
        variant: "danger",
        placement: "top",
      });
      setLoading(false);
    }
  }

  const IconComponent = (icons as any)[icon] || icons.HelpCircle;

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      <ThemedStatusBar />
      <BottomSheet
        ref={bottomSheetRef}
        snapPoints={snapPoints}
        enableDynamicSizing={false}
        index={0}
        enablePanDownToClose
        onClose={handleDismiss}
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={{ backgroundColor: color.muted, width: 40 }}
        backgroundStyle={{ backgroundColor: color.bg, borderRadius: 0 }}
      >
        <View style={{ flex: 1 }}>
          {/* ── Top Bar ────────────────────────────────────────────── */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 24,
              paddingBottom: 16,
              borderBottomWidth: 1,
              borderBottomColor: color.border,
            }}
          >
            <View style={{ flex: 1 }} />
            <Typography
              style={{
                fontSize: 16,
                color: color.textStrong,
                fontFamily: "IBMPlexSans_600SemiBold",
              }}
            >
              Create new group
            </Typography>
            <View style={{ flex: 1, alignItems: "flex-end" }}>
              <IconButton
                icon={icons.X}
                accessibilityLabel="Close create group"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  bottomSheetRef.current?.close();
                }}
                style={{ width: 40, height: 40 }}
              />
            </View>
          </View>

          <BottomSheetScrollView
            contentContainerStyle={{ paddingVertical: 24 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* ── Title Input ────────────────────────────────────────── */}
            <View style={{ paddingHorizontal: 24, marginBottom: 32 }}>
              <View style={{ marginBottom: 8 }}>
                <SectionLabel>Title</SectionLabel>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: color.control,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderWidth: 1,
                  borderColor: color.border,
                  borderRadius: radius.lg,
                }}
              >
                <IconComponent size={24} color={color.textStrong} strokeWidth={1.5} />
                <View
                  style={{
                    width: 1,
                    height: 24,
                    backgroundColor: color.border,
                    marginHorizontal: 16,
                  }}
                />
                <BottomSheetTextInput
                  style={{
                    flex: 1,
                    fontSize: 20,
                    color: color.textStrong,
                    fontFamily: "IBMPlexSans_600SemiBold",
                  }}
                  placeholder="e.g. Day trip to Warsaw"
                  placeholderTextColor={color.muted}
                  value={name}
                  onChangeText={(v) => {
                    setNameError("");
                    setName(v);
                  }}
                  autoCapitalize="words"
                />
              </View>
            </View>
            {nameError ? (
              <Typography
                style={{
                  marginTop: 6,
                  color: color.danger,
                  fontSize: 13,
                  fontFamily: "IBMPlexSans_500Medium",
                  paddingLeft: 4,
                }}
              >
                {nameError}
              </Typography>
            ) : null}

            {/* ── Icon Picker (Horizontal List) ──────────────────────── */}
            <View style={{ marginBottom: 32 }}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}
              >
                {GROUP_ICONS.map((i) => {
                  const Ico = (icons as any)[i] || icons.HelpCircle;
                  const isSelected = icon === i;

                  const colorIdx =
                    i.split("").reduce((a, c) => a + c.charCodeAt(0), 0) %
                    GROUP_PICKER_COLORS.length;
                  const pickerColors = isDarkMode ? GROUP_PICKER_COLORS_DARK : GROUP_PICKER_COLORS;
                  const iconBg = pickerColors[colorIdx];

                  return (
                    <Pressable
                      accessibilityRole="button"
                      key={i}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setIcon(i);
                      }}
                      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                    >
                      <View
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: radius.lg,
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: isSelected ? color.text : iconBg,
                          borderWidth: 2,
                          borderColor: isSelected ? color.text : color.border,
                        }}
                      >
                        <Ico
                          size={24}
                          color={isSelected ? color.textInverse : color.textStrong}
                          strokeWidth={isSelected ? 2 : 1.5}
                        />
                      </View>
                      {isSelected && (
                        <View
                          style={{
                            position: "absolute",
                            top: -4,
                            right: -4,
                            width: 20,
                            height: 20,
                            borderRadius: radius.pill,
                            backgroundColor: color.text,
                            alignItems: "center",
                            justifyContent: "center",
                            borderWidth: 2,
                            borderColor: color.bg,
                          }}
                        >
                          <icons.Check size={12} color={color.textInverse} strokeWidth={3} />
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* ── Participants ───────────────────────────────────────── */}
            <View style={{ paddingHorizontal: 24, marginBottom: 32 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <SectionLabel>Participants</SectionLabel>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    openSearchSheet();
                  }}
                  style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
                >
                  <Typography
                    style={{
                      fontSize: 15,
                      color: color.textStrong,
                      fontFamily: "IBMPlexSans_600SemiBold",
                    }}
                  >
                    + Add
                  </Typography>
                </Pressable>
              </View>

              {/* Current user (You) */}
              <Animated.View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: color.border,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: radius.md,
                    backgroundColor: color.control,
                    borderWidth: 1,
                    borderColor: color.border,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 16,
                  }}
                >
                  <icons.User size={20} color={color.textStrong} strokeWidth={1.5} />
                </View>
                <Typography
                  style={{
                    fontSize: 16,
                    color: color.textStrong,
                    fontFamily: "IBMPlexSans_600SemiBold",
                  }}
                >
                  You
                </Typography>
              </Animated.View>

              {/* Added members */}
              {selectedUsers.map((user) => {
                const isFriend = friends.some((f) => f.id === user.id);
                return (
                  <Animated.View
                    key={user.id}
                    entering={FadeIn}
                    exiting={FadeOut}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: 16,
                      borderBottomWidth: 1,
                      borderBottomColor: color.border,
                    }}
                  >
                    <View style={{ marginRight: 16 }}>
                      <AppUserAvatar user={user} size="sm" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Typography
                        style={{
                          fontSize: 16,
                          color: color.textStrong,
                          fontFamily: "IBMPlexSans_600SemiBold",
                        }}
                      >
                        {user.name}
                      </Typography>
                      <Typography
                        style={{
                          fontSize: 12,
                          color: color.muted,
                          fontFamily: "IBMPlexSans_500Medium",
                          marginTop: 2,
                        }}
                      >
                        {isFriend ? "Friend" : "Will receive invite"}
                      </Typography>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => handleRemoveUser(user.id)}
                      style={({ pressed }) => ({ padding: 8, opacity: pressed ? 0.5 : 1 })}
                    >
                      <icons.Trash2 size={20} color={color.muted} strokeWidth={1.5} />
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>

            {/* ── Currency ───────────────────────────────────────────── */}
            <View style={{ paddingHorizontal: 24, marginBottom: 32 }}>
              <View style={{ marginBottom: 16 }}>
                <SectionLabel>Currency</SectionLabel>
              </View>
              <View
                style={{
                  borderBottomWidth: 1,
                  borderBottomColor: color.border,
                  paddingBottom: 8,
                }}
              >
                <CurrencySelector value={currency.code} onChange={setCurrency} />
              </View>
            </View>
          </BottomSheetScrollView>

          {/* ── Footer Button ──────────────────────────────────────── */}
          <View
            style={{
              paddingHorizontal: 24,
              paddingTop: 16,
              paddingBottom: Math.max(insets.bottom, 16),
              backgroundColor: color.bg,
            }}
          >
            <PrimaryButton
              onPress={handleCreate}
              disabled={!name.trim() || loading}
              loading={loading}
              style={{ width: "100%", minHeight: 56, marginBottom: 12 }}
            >
              {loading && <Spinner color="white" size="sm" style={{ marginRight: 8 }} />}
              <Typography
                style={{
                  color: color.textInverse,
                  fontSize: 16,
                  fontFamily: "IBMPlexSans_600SemiBold",
                }}
              >
                Create group
              </Typography>
            </PrimaryButton>
            <Typography
              style={{
                fontSize: 13,
                color: color.muted,
                textAlign: "center",
                fontFamily: "IBMPlexSans_500Medium",
              }}
            >
              All participants will receive an invite
            </Typography>
          </View>
        </View>
      </BottomSheet>

      <UserSearchBottomSheet
        ref={searchSheetRef}
        onSelect={handleAddUser}
        excludeUserIds={selectedUsers.map((u) => u.id)}
        title="Add to Group"
      />
    </View>
  );
}
