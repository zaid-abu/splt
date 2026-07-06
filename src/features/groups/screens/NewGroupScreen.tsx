import type { JSX } from "react";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { View, Keyboard, Pressable } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
  BottomSheetTextInput,
  BottomSheetModalProvider,
  BottomSheetModal,
} from "@gorhom/bottom-sheet";
import { ScrollView } from "react-native-gesture-handler";
import Animated, { LinearTransition, FadeIn, FadeOut } from "react-native-reanimated";
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
import { Text } from "@/components/primitives/Text";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

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

export default function NewGroupScreen(): JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();
  const userId = currentUser?.id ?? "";
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

  const snapPoints = useMemo(() => ["85%"], []);

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
        createdBy: userId,
        members: [
          { userId: userId, user: currentUser, balance: 0 },
          ...usersToAddNow.map((u) => ({ userId: u.id, user: u, balance: 0 })),
        ],
      });

      for (const stranger of strangersToInvite) {
        await addFriend({ userId: userId, friendId: stranger.id, groupId: group.id });
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

  if (!currentUser) return <></>;
  return (
    <BottomSheetModalProvider>
      <View className="flex-1">
        <StatusBar style="light" />
        <BottomSheet
          ref={bottomSheetRef}
          snapPoints={snapPoints}
          enableDynamicSizing={false}
          index={0}
          enablePanDownToClose
          onClose={handleDismiss}
          backdropComponent={renderBackdrop}
          handleIndicatorStyle={{ backgroundColor: "#3A3A42", width: 40 }}
          backgroundStyle={{ backgroundColor: "#131316", borderRadius: 20 }}
        >
          <View className="flex-1">
            {/* ── Top Bar ── */}
            <View className="flex-row items-center px-6 pb-4 border-b border-divider">
              <View className="flex-1" />
              <Text variant="body" className="font-bold" color="foreground">
                Create new group
              </Text>
              <View className="flex-1 items-end">
                <Pressable
                  accessibilityRole="button"
                  onPress={() => bottomSheetRef.current?.close()}
                  hitSlop={12}
                  className="active:opacity-50"
                >
                  <icons.X size={24} color="#8E8E93" />
                </Pressable>
              </View>
            </View>

            <BottomSheetScrollView
              contentContainerStyle={{ paddingVertical: 24 }}
              keyboardShouldPersistTaps="handled"
            >
              {/* ── Title Input ── */}
              <View className="px-6 mb-8">
                <Text variant="sectionLabel" color="muted" className="mb-2">
                  TITLE
                </Text>
                <View className="flex-row items-center py-3 border-b border-border">
                  <IconComponent size={24} color="#FAFAFA" strokeWidth={1.5} />
                  <View className="w-px h-6 bg-border mx-4" />
                  <BottomSheetTextInput
                    className="flex-1 text-xl font-bold text-foreground"
                    placeholder="e.g. Day trip to Warsaw"
                    placeholderTextColor="#8E8E93"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              {/* ── Icon Picker ── */}
              <View className="mb-8">
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}
                >
                  {GROUP_ICONS.map((i) => {
                    const Ico = (icons as any)[i] || icons.HelpCircle;
                    const isSelected = icon === i;

                    return (
                      <Pressable
                        accessibilityRole="button"
                        key={i}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setIcon(i);
                        }}
                        className="active:opacity-70"
                      >
                        <View
                          className={`w-14 h-14 rounded-xl items-center justify-center border ${
                            isSelected
                              ? "bg-primary border-primary"
                              : "bg-transparent border-border"
                          }`}
                        >
                          <Ico
                            size={24}
                            color={isSelected ? "#FAFAFA" : "#FAFAFA"}
                            strokeWidth={isSelected ? 2 : 1.5}
                          />
                        </View>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              {/* ── Participants ── */}
              <View className="px-6 mb-8">
                <View className="flex-row justify-between items-center mb-4">
                  <Text variant="sectionLabel" color="muted">
                    PARTICIPANTS
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    onPress={openSearchSheet}
                    className="active:opacity-50"
                  >
                    <Text variant="body" className="font-bold" color="primary">
                      + Add
                    </Text>
                  </Pressable>
                </View>

                {/* Current user (You) */}
                <Animated.View className="flex-row items-center py-4 border-b border-border">
                  <View className="w-10 h-10 rounded-xl bg-surface-2 items-center justify-center mr-4">
                    <icons.User size={20} color="#FAFAFA" strokeWidth={1.5} />
                  </View>
                  <Text variant="body" className="font-bold" color="foreground">
                    You
                  </Text>
                </Animated.View>

                {/* Added members */}
                {selectedUsers.map((user) => (
                  <Animated.View
                    key={user.id}
                    entering={FadeIn}
                    exiting={FadeOut}
                    className="flex-row items-center py-4 border-b border-border"
                  >
                    <View className="mr-4">
                      <AppUserAvatar user={user} size="sm" />
                    </View>
                    <Text variant="body" color="foreground" className="font-semibold flex-1">
                      {user.name}
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => handleRemoveUser(user.id)}
                      className="p-2 active:opacity-50"
                    >
                      <icons.Trash2 size={20} color="#8E8E93" strokeWidth={1.5} />
                    </Pressable>
                  </Animated.View>
                ))}
              </View>

              {/* ── Currency ── */}
              <View className="px-6 mb-8">
                <Text variant="sectionLabel" color="muted" className="mb-4">
                  CURRENCY
                </Text>
                <View className="border-b border-border pb-2">
                  <CurrencySelector value={currency.code} onChange={setCurrency} />
                </View>
              </View>
            </BottomSheetScrollView>

            {/* ── Footer Button ── */}
            <View
              className="px-6 pt-4 bg-surface"
              style={{ paddingBottom: Math.max(insets.bottom, 16) }}
            >
              <Button
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
                onPress={handleCreate}
                className="mb-3"
              >
                Create group
              </Button>
              <Text variant="bodySmall" color="muted" className="text-center">
                All participants will receive an invite
              </Text>
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
    </BottomSheetModalProvider>
  );
}
