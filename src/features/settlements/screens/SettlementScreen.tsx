import { Typography, Spinner, useToast } from "heroui-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { SettleRouteParams } from "@/types/navigation";
import type { JSX } from "react";
import { useState, useMemo } from "react";
import { StatusBar } from "expo-status-bar";
import { KeyboardAvoidingView, Platform, ScrollView, View, Pressable, TextInput } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useGroups } from "@/features/groups/queries/useGroups";
import { useUserExpenses } from "@/features/expenses/queries/useExpenses";
import { useUserSettlements, useAddSettlement } from "@/features/settlements/queries/useSettlements";
import * as balancesUtil from "@/features/settlements/utils/balances";

import { useAuth } from "@/context/AppContext";
import { useUIStore } from "@/store/useUIStore";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { CurrencySelector } from "@/components/forms/CurrencySelector";
import * as icons from "lucide-react-native";
import * as Haptics from "expo-haptics";

const BG = "#F5F0EB";
const SURFACE = "#FFFFFF";
const BORDER = "#E8E4DF";
const TEXT_PRIMARY = "#1A1A1A";
const TEXT_SECONDARY = "#8E8E93";
const SECTION_PAD = 20;
const CARD_RADIUS = 16;

function SectionLabel({ children }: { children: string }): JSX.Element {
  return (
    <Typography
      style={{
        fontSize: 10,
        fontWeight: "700",
        letterSpacing: 1.4,
        color: TEXT_SECONDARY,
        fontFamily: "PlusJakartaSans_700Bold",
        textTransform: "uppercase",
        marginBottom: 8,
        marginLeft: 4,
      }}
    >
      {children}
    </Typography>
  );
}

export default function SettleUpScreen(): JSX.Element {
  const {
    id,
    groupId,
    amount: initialAmount,
    direction: initialDirection,
  } = useLocalSearchParams<SettleRouteParams>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const { data: groups = [] } = useGroups(currentUser?.id);
  const { data: expenses = [] } = useUserExpenses(currentUser?.id);
  const { data: settlements = [] } = useUserSettlements(currentUser?.id);
  const convertCurrency = useUIStore((s) => s.convertCurrency);
  const preferredCurrency = useUIStore((s) => s.preferredCurrency);

  const balances = balancesUtil.getUserBalances(
    currentUser.id,
    undefined,
    groups,
    expenses,
    settlements,
    preferredCurrency,
    convertCurrency
  );
  const { mutateAsync: addSettlement, isPending: isAddingSettlement } = useAddSettlement();
  const setCurrency = useUIStore((s) => s.setCurrency);

  const allMembers = groups.flatMap((g) => g.members.map((m) => m.user));
  const uniqueFriends = Array.from(new Map(allMembers.map((user) => [user.id, user])).values());
  const friend = uniqueFriends.find((f) => f.id === id);

  const netBalance = balances.get(id ?? "") || 0; // Negative means you owe them

  // "you" means you paid them (so they owe you less, or you owe them less)
  // "them" means they paid you
  const [direction, setDirection] = useState<"you" | "them">(
    (initialDirection as "you" | "them") || (netBalance < 0 ? "you" : "them")
  );

  const [amount, setAmount] = useState(initialAmount || Math.abs(netBalance).toString());
  const [note, setNote] = useState("");
  
  const sharedGroups = useMemo(() => {
    return groups.filter(
      (g) =>
        g.members.some((m) => m.userId === currentUser.id) && g.members.some((m) => m.userId === id)
    );
  }, [groups, currentUser.id, id]);

  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>(
    groupId || (sharedGroups.length === 1 ? sharedGroups[0].id : undefined)
  );

  const selectedGroup = groups.find((g) => g.id === selectedGroupId);
  const initialCurrency = selectedGroup ? selectedGroup.currency : preferredCurrency.code;
  const [settleCurrency, setSettleCurrency] = useState(initialCurrency);

  const [loading, setLoading] = useState(false);

  if (!friend) {
    return (
      <View style={{ flex: 1, backgroundColor: BG, alignItems: "center", justifyContent: "center" }}>
        <Typography style={{ fontSize: 18, color: TEXT_PRIMARY }}>Friend not found</Typography>
        <Pressable onPress={() => router.back()} style={{ marginTop: 16, padding: 12, backgroundColor: "#8C7A6B", borderRadius: 12 }}>
          <Typography style={{ color: "#FFF", fontWeight: "700" }}>Go Back</Typography>
        </Pressable>
      </View>
    );
  }

  const parsedAmount = parseFloat(amount.replace(",", ".")) || 0;

  async function handleSubmit() {
    if (!parsedAmount || parsedAmount <= 0) {
      toast.show({ label: "Error", description: "Please enter a valid amount.", variant: "danger", placement: "top" });
      return;
    }

    setLoading(true);

    try {
      await addSettlement({
        groupId: selectedGroupId,
        fromUserId: direction === "you" ? currentUser.id : friend!.id,
        toUserId: direction === "you" ? friend!.id : currentUser.id,
        amount: parsedAmount,
        currency: settleCurrency,
        date: new Date(),
        note: note.trim(),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (e: any) {
      toast.show({ label: "Error", description: e.message || "Failed to record settlement.", variant: "danger", placement: "top" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        
        {/* ── Header ───────────────────────────────── */}
        <View style={{ paddingTop: insets.top + 16, paddingBottom: 24, paddingHorizontal: SECTION_PAD, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Typography style={{ fontFamily: "DMSerifDisplay_400Regular", fontSize: 32, color: TEXT_PRIMARY, lineHeight: 40 }}>
            Settle Up
          </Typography>
          <Pressable onPress={() => router.back()} accessibilityRole="button" style={{ padding: 8 }}>
            <Typography style={{ fontSize: 15, fontWeight: "600", color: TEXT_SECONDARY, fontFamily: "PlusJakartaSans_600SemiBold" }}>
              ✕ Cancel
            </Typography>
          </Pressable>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 100 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.duration(300)}>
            {/* ── Group Selection ──────────────────────────── */}
            {sharedGroups.length > 0 && (
              <View style={{ paddingHorizontal: SECTION_PAD, marginBottom: 32 }}>
                <SectionLabel>Associate with Group (Optional)</SectionLabel>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSelectedGroupId(undefined);
                    }}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderRadius: 0,
                      borderWidth: 1,
                      borderColor: !selectedGroupId ? TEXT_PRIMARY : BORDER,
                      backgroundColor: !selectedGroupId ? TEXT_PRIMARY : SURFACE,
                    }}
                  >
                    <Typography style={{ fontSize: 14, fontWeight: "700", color: !selectedGroupId ? "#FFF" : TEXT_PRIMARY, fontFamily: "PlusJakartaSans_700Bold" }}>
                      No Group
                    </Typography>
                  </Pressable>
                  
                  {sharedGroups.map((g) => {
                    const isSelected = selectedGroupId === g.id;
                    const IconComp = (icons as any)[g.icon] || icons.HelpCircle;
                    return (
                      <Pressable
                        key={g.id}
                        accessibilityRole="button"
                        onPress={() => {
                          Haptics.selectionAsync();
                          setSelectedGroupId(g.id);
                        }}
                        style={{
                          paddingHorizontal: 16,
                          paddingVertical: 10,
                          borderRadius: 0,
                          borderWidth: 1,
                          borderColor: isSelected ? "#8C7A6B" : BORDER,
                          backgroundColor: isSelected ? "#8C7A6B" : SURFACE,
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <IconComp size={16} color={isSelected ? "#FFF" : TEXT_SECONDARY} />
                        <Typography style={{ fontSize: 14, fontWeight: "700", color: isSelected ? "#FFF" : TEXT_PRIMARY, fontFamily: "PlusJakartaSans_700Bold" }}>
                          {g.name}
                        </Typography>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* ── Direction Toggle ───────────────────────── */}
            <View style={{ paddingHorizontal: SECTION_PAD, marginBottom: 32 }}>
              <View style={{ backgroundColor: SURFACE, borderRadius: CARD_RADIUS, padding: 24, borderWidth: 1, borderColor: BORDER, alignItems: "center" }}>
                
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 32, marginBottom: 24 }}>
                  <View style={{ alignItems: "center", gap: 8, opacity: direction === "you" ? 1 : 0.4 }}>
                    <View style={{ borderRadius: 0, borderWidth: direction === "you" ? 2 : 0, borderColor: TEXT_PRIMARY, padding: 2 }}>
                      <AppUserAvatar user={currentUser} size="lg" />
                    </View>
                    <Typography style={{ fontSize: 14, fontWeight: "700", color: TEXT_PRIMARY, fontFamily: "PlusJakartaSans_700Bold" }}>
                      You
                    </Typography>
                  </View>

                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      Haptics.selectionAsync();
                      setDirection((prev) => (prev === "you" ? "them" : "you"));
                    }}
                    style={({ pressed }) => ({
                      width: 48,
                      height: 48,
                      borderRadius: 0,
                      backgroundColor: "#F9F6F2",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: pressed ? 0.7 : 1,
                    })}
                  >
                    <icons.ArrowRightLeft size={24} color={TEXT_PRIMARY} />
                  </Pressable>

                  <View style={{ alignItems: "center", gap: 8, opacity: direction === "them" ? 1 : 0.4 }}>
                    <View style={{ borderRadius: 0, borderWidth: direction === "them" ? 2 : 0, borderColor: TEXT_PRIMARY, padding: 2 }}>
                      <AppUserAvatar user={friend} size="lg" />
                    </View>
                    <Typography style={{ fontSize: 14, fontWeight: "700", color: TEXT_PRIMARY, fontFamily: "PlusJakartaSans_700Bold" }}>
                      {friend.name.split(" ")[0]}
                    </Typography>
                  </View>
                </View>

                {/* Segmented Control */}
                <View style={{ flexDirection: "row", backgroundColor: "#F9F6F2", borderRadius: 12, padding: 4, width: "100%" }}>
                  <Pressable
                    onPress={() => { Haptics.selectionAsync(); setDirection("you"); }}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 10,
                      backgroundColor: direction === "you" ? SURFACE : "transparent",
                      alignItems: "center",
                      shadowColor: direction === "you" ? "#000" : "transparent",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.05,
                      shadowRadius: 2,
                      elevation: direction === "you" ? 2 : 0,
                    }}
                  >
                    <Typography style={{ fontSize: 14, fontWeight: "700", color: direction === "you" ? TEXT_PRIMARY : TEXT_SECONDARY, fontFamily: "PlusJakartaSans_700Bold" }}>
                      You paid
                    </Typography>
                  </Pressable>
                  <Pressable
                    onPress={() => { Haptics.selectionAsync(); setDirection("them"); }}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 10,
                      backgroundColor: direction === "them" ? SURFACE : "transparent",
                      alignItems: "center",
                      shadowColor: direction === "them" ? "#000" : "transparent",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.05,
                      shadowRadius: 2,
                      elevation: direction === "them" ? 2 : 0,
                    }}
                  >
                    <Typography style={{ fontSize: 14, fontWeight: "700", color: direction === "them" ? TEXT_PRIMARY : TEXT_SECONDARY, fontFamily: "PlusJakartaSans_700Bold" }}>
                      They paid
                    </Typography>
                  </Pressable>
                </View>

              </View>
            </View>

            {/* ── Inputs ────────────────────────────── */}
            <View style={{ paddingHorizontal: SECTION_PAD, gap: 20, marginBottom: 32 }}>
              <View style={{ backgroundColor: SURFACE, borderRadius: CARD_RADIUS, borderWidth: 1, borderColor: BORDER, padding: 16, paddingVertical: 12 }}>
                <CurrencySelector
                  label="Currency"
                  value={settleCurrency}
                  onChange={(c) => {
                    setSettleCurrency(c.code);
                    setCurrency(c);
                  }}
                />
              </View>

              <View>
                <SectionLabel>{`Amount (${settleCurrency})`}</SectionLabel>
                <TextInput
                  placeholder="0.00"
                  placeholderTextColor={TEXT_SECONDARY}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                  style={{
                    backgroundColor: SURFACE,
                    height: 64,
                    borderRadius: CARD_RADIUS,
                    paddingHorizontal: 16,
                    borderWidth: 1,
                    borderColor: BORDER,
                    fontSize: 24,
                    fontWeight: "800",
                    color: TEXT_PRIMARY,
                    fontFamily: "PlusJakartaSans_800ExtraBold"
                  }}
                />
                {netBalance !== 0 && (
                  <Typography style={{ fontSize: 13, color: TEXT_SECONDARY, fontFamily: "PlusJakartaSans_500Medium", marginTop: 8, marginLeft: 4 }}>
                    Current balance: {Math.abs(netBalance).toFixed(2)} {preferredCurrency.code}
                  </Typography>
                )}
              </View>

              <View>
                <SectionLabel>Note (Optional)</SectionLabel>
                <TextInput
                  placeholder="e.g. Venmo, Cash..."
                  placeholderTextColor={TEXT_SECONDARY}
                  value={note}
                  onChangeText={setNote}
                  autoCapitalize="sentences"
                  style={{
                    backgroundColor: SURFACE,
                    height: 56,
                    borderRadius: CARD_RADIUS,
                    paddingHorizontal: 16,
                    borderWidth: 1,
                    borderColor: BORDER,
                    fontSize: 16,
                    color: TEXT_PRIMARY,
                    fontFamily: "PlusJakartaSans_500Medium"
                  }}
                />
              </View>
            </View>
          </Animated.View>
        </ScrollView>

        {/* ── Fixed Submit Button ─────────────────────────────── */}
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            paddingHorizontal: SECTION_PAD,
            paddingTop: 16,
            paddingBottom: insets.bottom + 16,
            backgroundColor: BG,
            borderTopWidth: 1,
            borderTopColor: "rgba(0,0,0,0.05)",
          }}
        >
          <Pressable
            accessibilityRole="button"
            onPress={handleSubmit}
            disabled={loading}
            style={({ pressed }) => ({
              height: 56,
              borderRadius: 0,
              backgroundColor: "#8C7A6B",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              opacity: pressed || loading ? 0.8 : 1,
            })}
          >
            {loading && <Spinner color="white" size="sm" style={{ marginRight: 8 }} />}
            <Typography style={{ fontSize: 16, fontWeight: "700", color: "#FFFFFF", fontFamily: "PlusJakartaSans_700Bold" }}>
              Record Payment
            </Typography>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
