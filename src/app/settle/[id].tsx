import { Alert, Button, Typography, PressableFeedback, Tabs, Spinner } from "heroui-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { JSX } from "react";
import { useState, useMemo } from "react";
import { StatusBar } from "expo-status-bar";
import { KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";

import { useApp } from "@/context/AppContext";
import { AppUserAvatar } from "@/components/MemberAvatar";
import { CurrencySelector } from "@/components/CurrencySelector";
import * as icons from "lucide-react-native";
import * as Haptics from "expo-haptics";

export default function SettleUpScreen(): JSX.Element {
  const {
    id,
    groupId,
    amount: initialAmount,
    direction: initialDirection,
  } = useLocalSearchParams<{ id: string; groupId?: string; amount?: string; direction?: string }>();
  const router = useRouter();
  const { groups, currentUser, preferredCurrency, getUserBalances, addSettlement, setCurrency } =
    useApp();

  const allMembers = groups.flatMap((g) => g.members.map((m) => m.user));
  const uniqueFriends = Array.from(new Map(allMembers.map((user) => [user.id, user])).values());
  const friend = uniqueFriends.find((f) => f.id === id);

  const balances = getUserBalances();
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
  const [error, setError] = useState("");

  if (!friend) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#F2F2F6" }}>
        <View className="flex-1 items-center justify-center p-6">
          <Alert status="danger" className="mb-4 rounded-[20px]">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>Friend not found</Alert.Title>
            </Alert.Content>
          </Alert>
          <Button onPress={() => router.back()} className="rounded-full mt-4">
            Go back
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const parsedAmount = parseFloat(amount.replace(",", ".")) || 0;

  async function handleSubmit() {
    if (!parsedAmount || parsedAmount <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    setLoading(true);
    setError("");

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
    } catch {
      setError("Failed to record settlement.");
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F2F2F6" }} edges={["top", "bottom"]}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          className="flex-1 bg-background"
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header ───────────────────────────────── */}
          <View className="flex-row items-center justify-between px-6 pt-4 mb-8">
            <Typography type="h3" className="font-black tracking-tight text-[28px]">
              Settle Up
            </Typography>
            <Button variant="ghost" size="sm" onPress={() => router.back()}>
              ✕ Cancel
            </Button>
          </View>

          <Animated.View entering={FadeInDown.duration(300)}>
            {/* ── Group Selection ──────────────────────────── */}
            {sharedGroups.length > 0 && (
              <View className="px-6 mb-8">
                <Typography
                  type="body-sm"
                  className="font-bold text-muted-foreground tracking-widest mb-3 ml-2"
                >
                  ASSOCIATE WITH GROUP (OPTIONAL)
                </Typography>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <PressableFeedback
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSelectedGroupId(undefined);
                    }}
                  >
                    <View
                      className={`px-4 py-2 rounded-full border mr-2 ${!selectedGroupId ? "bg-primary border-primary" : "bg-white border-border"}`}
                    >
                      <Typography
                        type="body-sm"
                        className={`font-bold ${!selectedGroupId ? "text-white" : "text-foreground"}`}
                      >
                        No Group
                      </Typography>
                    </View>
                  </PressableFeedback>
                  {sharedGroups.map((g) => {
                    const isSelected = selectedGroupId === g.id;
                    return (
                      <PressableFeedback
                        key={g.id}
                        onPress={() => {
                          Haptics.selectionAsync();
                          setSelectedGroupId(g.id);
                        }}
                      >
                        <View
                          className={`px-4 py-2 rounded-full border mr-2 flex-row items-center gap-2 ${isSelected ? "bg-primary border-primary" : "bg-white border-border"}`}
                        >
                          {(() => {
                            const IconComp = (icons as any)[g.icon] || icons.HelpCircle;
                            return <IconComp size={16} color={isSelected ? "white" : "#8A8798"} />;
                          })()}
                          <Typography
                            type="body-sm"
                            className={`font-bold ${isSelected ? "text-white" : "text-foreground"}`}
                          >
                            {g.name}
                          </Typography>
                        </View>
                      </PressableFeedback>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* ── Direction Toggle ───────────────────────── */}
            <View className="px-6 mb-8">
              <View className="bg-white rounded-[24px] p-4 border border-border items-center">
                <View className="flex-row items-center gap-6 mb-6">
                  <View className="items-center gap-2">
                    <View
                      className={
                        direction === "you"
                          ? "ring-2 ring-primary ring-offset-2 rounded-full"
                          : "opacity-50"
                      }
                    >
                      <AppUserAvatar user={currentUser} size="lg" />
                    </View>
                    <Typography
                      type="body-sm"
                      className={`font-bold ${direction === "you" ? "text-primary" : "text-muted-foreground"}`}
                    >
                      You
                    </Typography>
                  </View>

                  <PressableFeedback
                    onPress={() => {
                      Haptics.selectionAsync();
                      setDirection((prev) => (prev === "you" ? "them" : "you"));
                    }}
                  >
                    <View className="w-12 h-12 rounded-full bg-secondary items-center justify-center">
                      <icons.ArrowRightLeft size={20} className="text-foreground" />
                    </View>
                  </PressableFeedback>

                  <View className="items-center gap-2">
                    <View
                      className={
                        direction === "them"
                          ? "ring-2 ring-primary ring-offset-2 rounded-full"
                          : "opacity-50"
                      }
                    >
                      <AppUserAvatar user={friend} size="lg" />
                    </View>
                    <Typography
                      type="body-sm"
                      className={`font-bold ${direction === "them" ? "text-primary" : "text-muted-foreground"}`}
                    >
                      {friend.name.split(" ")[0]}
                    </Typography>
                  </View>
                </View>

                <Tabs
                  value={direction}
                  onValueChange={(v) => {
                    Haptics.selectionAsync();
                    setDirection(v as any);
                  }}
                  variant="primary"
                  className="w-full"
                >
                  <Tabs.List className="w-full bg-secondary rounded-[16px] p-1">
                    <Tabs.Indicator className="bg-white rounded-[12px] shadow-sm" />
                    <Tabs.Trigger value="you" className="flex-1 h-[40px]">
                      {({ isSelected }) => (
                        <Tabs.Label
                          className={`font-bold text-sm ${isSelected ? "text-foreground" : "text-muted-foreground"}`}
                        >
                          You paid
                        </Tabs.Label>
                      )}
                    </Tabs.Trigger>
                    <Tabs.Trigger value="them" className="flex-1 h-[40px]">
                      {({ isSelected }) => (
                        <Tabs.Label
                          className={`font-bold text-sm ${isSelected ? "text-foreground" : "text-muted-foreground"}`}
                        >
                          They paid
                        </Tabs.Label>
                      )}
                    </Tabs.Trigger>
                  </Tabs.List>
                </Tabs>
              </View>
            </View>

            {/* ── Inputs ────────────────────────────── */}
            <View className="px-6 gap-5 mb-8">
              <CurrencySelector
                label="Currency"
                value={settleCurrency}
                onChange={(c) => {
                  setSettleCurrency(c.code);
                  setCurrency(c); // Update globally for convenience
                }}
              />

              <View>
                <Typography
                  type="body-sm"
                  className="font-bold text-muted-foreground tracking-widest mb-2 ml-2 uppercase"
                >
                  Amount ({settleCurrency})
                </Typography>
                <View
                  className={`bg-white h-[56px] rounded-[20px] px-4 justify-center border ${error && (!parsedAmount || parsedAmount <= 0) ? "border-danger" : "border-border"}`}
                >
                  <TextInput
                    placeholder="0.00"
                    value={amount}
                    onChangeText={(t) => {
                      setAmount(t);
                      setError("");
                    }}
                    keyboardType="decimal-pad"
                    className="font-black text-[20px] text-foreground h-full"
                    placeholderTextColor="#8A8798"
                  />
                </View>
                {netBalance !== 0 && (
                  <Typography
                    type="body-xs"
                    className="text-muted-foreground mt-2 ml-2 font-medium"
                  >
                    Current balance: {Math.abs(netBalance).toFixed(2)} {preferredCurrency.code}
                  </Typography>
                )}
              </View>

              <View>
                <Typography
                  type="body-sm"
                  className="font-bold text-muted-foreground tracking-widest mb-2 ml-2 uppercase"
                >
                  Note (Optional)
                </Typography>
                <View className="bg-white h-[56px] rounded-[20px] px-4 justify-center border border-border">
                  <TextInput
                    placeholder="e.g. Venmo, Cash..."
                    value={note}
                    onChangeText={setNote}
                    autoCapitalize="sentences"
                    className="font-medium text-[16px] text-foreground h-full"
                    placeholderTextColor="#8A8798"
                  />
                </View>
              </View>
            </View>

            {/* ── Error ──────────────────────────────── */}
            {error ? (
              <View className="px-6 mb-4">
                <Alert status="danger" className="rounded-[20px]">
                  <Alert.Indicator />
                  <Alert.Content>
                    <Alert.Title>{error}</Alert.Title>
                  </Alert.Content>
                </Alert>
              </View>
            ) : null}
          </Animated.View>
        </ScrollView>

        {/* ── Fixed Submit Button ─────────────────────────────── */}
        <View className="px-6 py-4 bg-background border-t border-border/50">
          <PressableFeedback onPress={loading ? undefined : handleSubmit}>
            <View
              className={`w-full h-[56px] rounded-[20px] flex-row items-center justify-center gap-2 ${loading ? "bg-primary/70" : "bg-primary"}`}
            >
              {loading && <Spinner color="white" size="sm" />}
              <Typography type="body" className="font-bold text-white">
                Record Payment
              </Typography>
            </View>
          </PressableFeedback>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
