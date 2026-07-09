import type { JSX } from "react";
import { useState, useRef, useCallback, useMemo } from "react";
import { View, Keyboard, Pressable } from "react-native";
import { StatusBar } from "expo-status-bar";
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
import { useFriends, useAddFriend } from "@/features/friends/queries/useFriends";
import { CurrencySelector } from "@/components/forms/CurrencySelector";
import { useAuth } from "@/context/AppContext";
import type { Currency, User } from "@/types";
import { useAppToast } from "@/hooks/useAppToast";
import { UserSearchBottomSheet } from "@/features/groups/components/UserSearchBottomSheet";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { IconButton, PrimaryButton, SectionLabel, UI } from "@/components/ui/native-ui";
import { GROUP_ICONS } from "@/constants/icons";

const BG = UI.color.bg;
const TEXT_PRIMARY = UI.color.textStrong;
const TEXT_SECONDARY = UI.color.muted;
const SEPARATOR = UI.color.border;

export default function NewGroupScreen(): JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();
  const { mutateAsync: createGroup } = useCreateGroup();
  const { data: friends = [] } = useFriends(currentUser?.id);
  const { mutateAsync: addFriend } = useAddFriend();
  const { toast } = useAppToast();

  const bottomSheetRef = useRef<BottomSheet>(null);

  const [name, setName] = useState("");
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
      const friendIds = new Set(friends.map((f) => f.id));
      const usersToAddNow = selectedUsers.filter((u) => friendIds.has(u.id));
      const strangersToInvite = selectedUsers.filter((u) => !friendIds.has(u.id));

      const group = await createGroup({
        name: name.trim(),
        description: undefined,
        icon,
        currency: currency.code,
        createdBy: currentUser.id,
        members: [
          { userId: currentUser.id, user: currentUser, balance: 0 },
          ...usersToAddNow.map((u) => ({ userId: u.id, user: u, balance: 0 })),
        ],
      });

      for (const stranger of strangersToInvite) {
        await addFriend({ userId: currentUser.id, friendId: stranger.id, groupId: group.id });
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      if (strangersToInvite.length > 0) {
        toast.show({
          label: "Requests Sent",
          description:
            "Non-friends will be added to the group once they accept your friend request.",
          variant: "success",
          placement: "top",
        });
      }

      bottomSheetRef.current?.close();
      setTimeout(() => {
        router.replace(`/group/${group.id}`);
      }, 300);
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
    <View style={{ flex: 1, backgroundColor: BG }}>
      <StatusBar style="dark" />
        <BottomSheet
          ref={bottomSheetRef}
          snapPoints={snapPoints}
          enableDynamicSizing={false}
          index={0}
          enablePanDownToClose
          onClose={handleDismiss}
          backdropComponent={renderBackdrop}
          handleIndicatorStyle={{ backgroundColor: "#D6D2CD", width: 40 }}
          backgroundStyle={{ backgroundColor: BG, borderRadius: 0 }}
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
                borderBottomColor: SEPARATOR,
              }}
            >
              <View style={{ flex: 1 }} />
              <Typography
                style={{
                  fontSize: 16,
                  color: TEXT_PRIMARY,
                  fontFamily: "IBMPlexSans_600SemiBold",
                }}
              >
                Create new group
              </Typography>
              <View style={{ flex: 1, alignItems: "flex-end" }}>
                <IconButton
                  icon={icons.X}
                  accessibilityLabel="Close create group"
                  onPress={() => bottomSheetRef.current?.close()}
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
                    backgroundColor: UI.color.control,
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    borderWidth: 1,
                    borderColor: SEPARATOR,
                    borderRadius: UI.radius.lg,
                  }}
                >
                  <IconComponent size={24} color={TEXT_PRIMARY} strokeWidth={1.5} />
                  <View
                    style={{
                      width: 1,
                      height: 24,
                      backgroundColor: SEPARATOR,
                      marginHorizontal: 16,
                    }}
                  />
                  <BottomSheetTextInput
                    style={{
                      flex: 1,
                      fontSize: 20,
                      color: TEXT_PRIMARY,
                      fontFamily: "IBMPlexSans_600SemiBold",
                    }}
                    placeholder="e.g. Day trip to Warsaw"
                    placeholderTextColor={TEXT_SECONDARY}
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                </View>
              </View>

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

                    // Generate color for picker
                    const GROUP_BG_PALETTE = [
                      "#FCE7D0",
                      "#E8E4F9",
                      "#D5EFE2",
                      "#D9EEF8",
                      "#F9E3E3",
                      "#E3EFF9",
                      "#F5F0C0",
                      "#E8D9F9",
                    ];
                    const colorIdx =
                      i.split("").reduce((a, c) => a + c.charCodeAt(0), 0) %
                      GROUP_BG_PALETTE.length;
                    const iconBg = GROUP_BG_PALETTE[colorIdx];

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
                            borderRadius: UI.radius.lg,
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: isSelected ? UI.color.text : iconBg,
                            borderWidth: 1,
                            borderColor: isSelected ? UI.color.text : SEPARATOR,
                          }}
                        >
                          <Ico
                            size={24}
                            color={isSelected ? "#FFFFFF" : TEXT_PRIMARY}
                            strokeWidth={isSelected ? 2 : 1.5}
                          />
                        </View>
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
                    onPress={openSearchSheet}
                    style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
                  >
                    <Typography
                      style={{
                        fontSize: 15,
                        color: TEXT_PRIMARY,
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
                    borderBottomColor: SEPARATOR,
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: UI.radius.md,
                      backgroundColor: UI.color.control,
                      borderWidth: 1,
                      borderColor: SEPARATOR,
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 16,
                    }}
                  >
                    <icons.User size={20} color={TEXT_PRIMARY} strokeWidth={1.5} />
                  </View>
                  <Typography
                    style={{
                      fontSize: 16,
                      color: TEXT_PRIMARY,
                      fontFamily: "IBMPlexSans_600SemiBold",
                    }}
                  >
                    You
                  </Typography>
                </Animated.View>

                {/* Added members */}
                {selectedUsers.map((user) => (
                  <Animated.View
                    key={user.id}
                    entering={FadeIn}
                    exiting={FadeOut}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: 16,
                      borderBottomWidth: 1,
                      borderBottomColor: SEPARATOR,
                    }}
                  >
                    <View style={{ marginRight: 16 }}>
                      <AppUserAvatar user={user} size="sm" />
                    </View>
                    <Typography
                      style={{
                        flex: 1,
                        fontSize: 16,
                        color: TEXT_PRIMARY,
                        fontFamily: "IBMPlexSans_500Medium",
                      }}
                    >
                      {user.name}
                    </Typography>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => handleRemoveUser(user.id)}
                      style={({ pressed }) => ({ padding: 8, opacity: pressed ? 0.5 : 1 })}
                    >
                      <icons.Trash2 size={20} color={TEXT_SECONDARY} strokeWidth={1.5} />
                    </Pressable>
                  </Animated.View>
                ))}
              </View>

              {/* ── Currency ───────────────────────────────────────────── */}
              <View style={{ paddingHorizontal: 24, marginBottom: 32 }}>
                <View style={{ marginBottom: 16 }}>
                  <SectionLabel>Currency</SectionLabel>
                </View>
                <View
                  style={{ borderBottomWidth: 1, borderBottomColor: SEPARATOR, paddingBottom: 8 }}
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
                backgroundColor: BG,
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
                    color: "#FFFFFF",
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
                  color: TEXT_SECONDARY,
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
