import type { JSX } from "react";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { View, Keyboard } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import { ScrollView } from "react-native-gesture-handler";
import Animated, { LinearTransition, FadeIn, FadeOut } from "react-native-reanimated";
import { Button, Typography, PressableFeedback, Spinner, useToast } from "heroui-native";
import * as Haptics from "expo-haptics";
import * as icons from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useCreateGroup } from "@/features/groups/queries/useGroups";
import { CurrencySelector } from "@/components/forms/CurrencySelector";
import { useAuth } from "@/context/AppContext";
import type { Currency } from "@/types";

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
  const { mutateAsync: createGroup } = useCreateGroup();
  const { toast } = useToast();

  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  const [name, setName] = useState("");
  const [icon, setIcon] = useState("Home");
  const [currency, setCurrency] = useState<Currency>({
    code: "USD",
    name: "US Dollar",
    symbol: "$",
  });
  const [loading, setLoading] = useState(false);
  const [memberEmails, setMemberEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState("");
  const [showEmailInput, setShowEmailInput] = useState(false);

  const snapPoints = useMemo(() => ["85%"], []);

  useEffect(() => {
    // Present the bottom sheet when the screen mounts
    bottomSheetModalRef.current?.present();
  }, []);

  const handleDismiss = useCallback(() => {
    router.back();
  }, [router]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.4} />
    ),
    []
  );

  const toggleEmailInput = () => {
    setShowEmailInput(!showEmailInput);
  };

  const handleAddEmail = () => {
    const trimmed = emailInput.trim().toLowerCase();
    if (trimmed && trimmed.includes("@") && !memberEmails.includes(trimmed)) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setMemberEmails([...memberEmails, trimmed]);
      setEmailInput("");
      setShowEmailInput(false);
      Keyboard.dismiss();
    }
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMemberEmails(memberEmails.filter((e) => e !== emailToRemove));
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
      const group = await createGroup({
        name: name.trim(),
        description: undefined, // Removed description for simplicity based on reference
        icon,
        currency: currency.code,
        createdBy: currentUser.id,
        members: [{ userId: currentUser.id, user: currentUser, balance: 0 }],
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      bottomSheetModalRef.current?.dismiss();
      // small delay to let the sheet dismiss before replacing route
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
    <View style={{ flex: 1 }}>
      <StatusBar style="light" />
      <BottomSheetModal
        ref={bottomSheetModalRef}
        snapPoints={snapPoints}
        enableDynamicSizing={false}
        index={0}
        onDismiss={handleDismiss}
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={{ backgroundColor: "#D6D2CD", width: 40 }}
        backgroundStyle={{ backgroundColor: "#F5F0EB", borderRadius: 24 }}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
      >
        <View style={{ flex: 1 }}>
          {/* ── Top Bar ────────────────────────────────────────────── */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 20,
              paddingBottom: 16,
              borderBottomWidth: 1,
              borderBottomColor: "#E8E4DF",
            }}
          >
            <View style={{ flex: 1 }} />
            <Typography
              style={{
                fontSize: 16,
                fontWeight: "700",
                color: "#1A1A1A",
                fontFamily: "PlusJakartaSans_700Bold",
              }}
            >
              Create new group
            </Typography>
            <View style={{ flex: 1, alignItems: "flex-end" }}>
              <PressableFeedback onPress={() => bottomSheetModalRef.current?.dismiss()} hitSlop={12}>
                <icons.X size={24} color="#8E8E93" />
              </PressableFeedback>
            </View>
          </View>

          <BottomSheetScrollView
            contentContainerStyle={{ paddingVertical: 24 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* ── Title Input ────────────────────────────────────────── */}
            <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
              <Typography
                style={{
                  fontSize: 10,
                  fontWeight: "700",
                  color: "#8E8E93",
                  marginBottom: 8,
                  letterSpacing: 1.4,
                  fontFamily: "PlusJakartaSans_700Bold",
                  textTransform: "uppercase",
                }}
              >
                TITLE
              </Typography>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#FFFFFF",
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  height: 56,
                  borderWidth: 1,
                  borderColor: "#E8E4DF",
                }}
              >
                <IconComponent size={24} color="#1A1A1A" strokeWidth={1.5} />
                <View
                  style={{
                    width: 1,
                    height: 24,
                    backgroundColor: "#E8E4DF",
                    marginHorizontal: 12,
                  }}
                />
                <BottomSheetTextInput
                  style={{
                    flex: 1,
                    fontSize: 16,
                    color: "#1A1A1A",
                    fontFamily: "PlusJakartaSans_500Medium",
                  }}
                  placeholder="e.g. Day trip to Warsaw"
                  placeholderTextColor="#8E8E93"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* ── Icon Picker (Horizontal List) ──────────────────────── */}
            <View style={{ marginBottom: 24 }}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
              >
                {GROUP_ICONS.map((i) => {
                  const Ico = (icons as any)[i] || icons.HelpCircle;
                  const isSelected = icon === i;
                  
                  // Generate color for picker like Dashboard does
                  const GROUP_BG_PALETTE = ["#FCE7D0", "#E8E4F9", "#D5EFE2", "#D9EEF8", "#F9E3E3", "#E3EFF9", "#F5F0C0", "#E8D9F9"];
                  const colorIdx = i.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % GROUP_BG_PALETTE.length;
                  const iconBg = GROUP_BG_PALETTE[colorIdx];

                  return (
                    <PressableFeedback
                      key={i}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setIcon(i);
                      }}
                    >
                      <View
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 24,
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: isSelected ? "#1A1A1A" : iconBg,
                          borderWidth: isSelected ? 0 : 0,
                        }}
                      >
                        <Ico
                          size={20}
                          color={isSelected ? "#FFFFFF" : "#1A1A1A"}
                          strokeWidth={isSelected ? 2 : 1.5}
                        />
                      </View>
                    </PressableFeedback>
                  );
                })}
              </ScrollView>
            </View>

            {/* ── Participants ───────────────────────────────────────── */}
            <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <Typography
                  style={{
                    fontSize: 10,
                    fontWeight: "700",
                    color: "#8E8E93",
                    letterSpacing: 1.4,
                    fontFamily: "PlusJakartaSans_700Bold",
                    textTransform: "uppercase",
                  }}
                >
                  PARTICIPANTS
                </Typography>
                <PressableFeedback onPress={toggleEmailInput}>
                  <Typography
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: "#1A1A1A",
                      fontFamily: "PlusJakartaSans_600SemiBold",
                    }}
                  >
                    + Add
                  </Typography>
                </PressableFeedback>
              </View>

              {showEmailInput && (
                <Animated.View 
                  entering={FadeIn.duration(200)} 
                  exiting={FadeOut.duration(200)} 
                  layout={LinearTransition.springify().mass(0.5)}
                  style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}
                >
                  <BottomSheetTextInput
                    style={{
                      flex: 1,
                      height: 48,
                      backgroundColor: "#FFFFFF",
                      borderRadius: 12,
                      paddingHorizontal: 16,
                      borderWidth: 1,
                      borderColor: "#E8E4DF",
                      fontSize: 15,
                      fontFamily: "PlusJakartaSans_500Medium",
                    }}
                    placeholder="friend@example.com"
                    placeholderTextColor="#8E8E93"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={emailInput}
                    onChangeText={setEmailInput}
                    onSubmitEditing={handleAddEmail}
                  />
                  <Button
                    variant="primary"
                    onPress={handleAddEmail}
                    isDisabled={!emailInput.includes("@")}
                    style={{ height: 48, borderRadius: 12, paddingHorizontal: 20, backgroundColor: "#1A1A1A" }}
                  >
                    <Button.Label style={{ color: "#FFFFFF", fontWeight: "600" }}>Add</Button.Label>
                  </Button>
                </Animated.View>
              )}

              {/* Current user (You) */}
              <Animated.View
                layout={LinearTransition.springify().mass(0.5)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: "rgba(0,0,0,0.03)",
                }}
              >
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: "#E8E4DF",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                  }}
                >
                  <icons.User size={16} color="#1A1A1A" strokeWidth={2} />
                </View>
                <Typography
                  style={{
                    fontSize: 15,
                    color: "#1A1A1A",
                    fontWeight: "600",
                    fontFamily: "PlusJakartaSans_600SemiBold",
                  }}
                >
                  You
                </Typography>
              </Animated.View>

              {/* Added members */}
              {memberEmails.map((email) => (
                <Animated.View
                  key={email}
                  entering={FadeIn}
                  exiting={FadeOut}
                  layout={LinearTransition.springify().mass(0.5)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: "rgba(0,0,0,0.03)",
                  }}
                >
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: "#FFFFFF",
                      borderWidth: 1,
                      borderColor: "#E8E4DF",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 12,
                    }}
                  >
                    <Typography
                      style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: "#1A1A1A",
                        fontFamily: "PlusJakartaSans_600SemiBold",
                      }}
                    >
                      {email.charAt(0).toUpperCase()}
                    </Typography>
                  </View>
                  <Typography
                    style={{
                      flex: 1,
                      fontSize: 15,
                      color: "#1A1A1A",
                      fontWeight: "500",
                      fontFamily: "PlusJakartaSans_500Medium",
                    }}
                  >
                    {email}
                  </Typography>
                  <PressableFeedback onPress={() => handleRemoveEmail(email)} style={{ padding: 4 }}>
                    <icons.Trash2 size={18} color="#8E8E93" strokeWidth={1.5} />
                  </PressableFeedback>
                </Animated.View>
              ))}
            </View>

            {/* ── Currency ───────────────────────────────────────────── */}
            <View style={{ paddingHorizontal: 20, marginBottom: 32 }}>
              <Typography
                style={{
                  fontSize: 10,
                  fontWeight: "700",
                  color: "#8E8E93",
                  marginBottom: 12,
                  letterSpacing: 1.4,
                  fontFamily: "PlusJakartaSans_700Bold",
                  textTransform: "uppercase",
                }}
              >
                CURRENCY
              </Typography>
              <CurrencySelector value={currency.code} onChange={setCurrency} />
            </View>
          </BottomSheetScrollView>

          {/* ── Footer Button ──────────────────────────────────────── */}
          <View
            style={{
              paddingHorizontal: 20,
              paddingTop: 16,
              paddingBottom: Math.max(insets.bottom, 16),
              backgroundColor: "#F5F0EB",
              borderTopWidth: 1,
              borderTopColor: "#E8E4DF",
            }}
          >
            <Button
              variant="primary"
              onPress={handleCreate}
              isDisabled={loading}
              style={{
                width: "100%",
                height: 56,
                borderRadius: 16,
                backgroundColor: "#1A1A1A",
                marginBottom: 12,
              }}
            >
              {loading && <Spinner color="white" size="sm" style={{ marginRight: 8 }} />}
              <Button.Label
                style={{
                  color: "white",
                  fontWeight: "700",
                  fontSize: 16,
                  fontFamily: "PlusJakartaSans_700Bold",
                }}
              >
                Create group
              </Button.Label>
            </Button>
            <Typography
              style={{
                fontSize: 12,
                color: "#8E8E93",
                textAlign: "center",
                fontFamily: "PlusJakartaSans_500Medium",
              }}
            >
              All participants will receive an invite
            </Typography>
          </View>
        </View>
      </BottomSheetModal>
    </View>
  );
}
