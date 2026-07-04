/**
 * New Group Screen
 *
 * HeroUI components used:
 * - Button
 * - Card, Card.Body, Card.Title, Card.Description
 * - TextField, TextField.Label, TextField.Input, TextField.FieldError
 * - TextArea, TextArea.Label, TextArea.Input
 * - Avatar, Avatar.Fallback
 * - Chip (emoji picker)
 * - ScrollShadow
 * - Typography
 * - Alert
 * - Separator
 */
import {
  Alert,
  Button,
  Typography,
  PressableFeedback,
  Spinner,
  TextField,
  Label,
  Input,
  useToast,
  Chip,
} from "heroui-native";
import { useRouter } from "expo-router";
import type { JSX } from "react";
import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGroups, useCreateGroup, useUpdateGroup, useDeleteGroup, useAddGroupMembers } from "@/queries/useGroups";
import { useUserExpenses, useAddExpense, useUpdateExpense, useDeleteExpense } from "@/queries/useExpenses";
import { useUserActivities, useLogActivity, useDeleteActivity } from "@/queries/useActivities";
import { useUserSettlements, useAddSettlement } from "@/queries/useSettlements";
import * as balancesUtil from "@/utils/balances";


import { CurrencySelector } from "@/components/CurrencySelector";
import * as icons from "lucide-react-native";
import { useAuth } from "@/context/AppContext";
import { useUIStore } from "@/store/useUIStore";
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
  const { currentUser } = useAuth();
  const { mutateAsync: createGroup, isPending: isCreatingGroup } = useCreateGroup();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("Home");
  const [currency, setCurrency] = useState<Currency>({
    code: "USD",
    name: "US Dollar",
    symbol: "$",
  });
  const [loading, setLoading] = useState(false);
  const [memberEmails, setMemberEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState("");

  const handleAddEmail = () => {
    const trimmed = emailInput.trim().toLowerCase();
    if (trimmed && trimmed.includes("@") && !memberEmails.includes(trimmed)) {
      setMemberEmails([...memberEmails, trimmed]);
      setEmailInput("");
    }
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    setMemberEmails(memberEmails.filter((email) => email !== emailToRemove));
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
      const group = await createGroup(
        {
          name: name.trim(),
          description: description.trim() || undefined,
          icon,
          currency: currency.code,
          createdBy: currentUser.id,
          members: [{ userId: currentUser.id, user: currentUser, balance: 0 }],
        }
      );
      router.replace(`/group/${group.id}`);
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

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-background" edges={["top", "bottom"]}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          className="flex-1 bg-background"
          contentContainerStyle={{ paddingBottom: 48 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header ────────────────────────────────── */}
          <View className="flex-row items-center justify-between px-6 pt-4 mb-8">
            <Typography type="h3" className="font-black tracking-tight text-[28px]">
              New Group
            </Typography>
            <Button variant="ghost" size="sm" onPress={() => router.back()}>
              ✕ Cancel
            </Button>
          </View>

          {/* ── Icon picker ──────────────────────────── */}
          <View className="mb-8">
            <Typography
              type="body-xs"
              className="text-muted-foreground font-bold tracking-widest mb-3 ml-8"
            >
              CHOOSE ICON
            </Typography>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}
            >
              {GROUP_ICONS.map((i) => {
                const IconComponent = (icons as any)[i] || icons.HelpCircle;
                const isSelected = icon === i;
                return (
                  <PressableFeedback key={i} onPress={() => setIcon(i)}>
                    <View
                      className={`w-14 h-14 rounded-full items-center justify-center border-2 ${isSelected ? "bg-primary border-primary" : "bg-white border-transparent"}`}
                    >
                      <IconComponent
                        size={24}
                        color={isSelected ? "white" : "#8A8798"}
                        strokeWidth={isSelected ? 2.5 : 2}
                      />
                    </View>
                  </PressableFeedback>
                );
              })}
            </ScrollView>
          </View>

          {/* ── Preview ───────────────────────────────── */}
          <View className="px-6 mb-8">
            <View className="items-center bg-white rounded-[32px] p-6 border border-border">
              <View className="w-20 h-20 rounded-full bg-primary/10 items-center justify-center mb-4">
                {(() => {
                  const PreviewIcon = (icons as any)[icon] || icons.HelpCircle;
                  return <PreviewIcon size={36} className="text-primary" strokeWidth={2.5} />;
                })()}
              </View>
              <Typography type="h3" className="font-black text-[24px] mb-1 text-center">
                {name.trim() || "Group name"}
              </Typography>
              {description.trim() ? (
                <Typography
                  type="body"
                  className="text-muted-foreground font-medium text-center mb-4"
                >
                  {description}
                </Typography>
              ) : (
                <View className="h-4" />
              )}
              <View className="bg-primary/10 px-3 py-1.5 rounded-full">
                <Typography type="body-sm" className="font-bold text-primary">
                  {currency.symbol} {currency.code}
                </Typography>
              </View>
            </View>
          </View>

          {/* ── Form fields ───────────────────────────── */}
          <View className="px-6 mb-8 gap-5">
            <TextField>
              <Label className="ml-1 tracking-widest uppercase text-muted-foreground text-[10px]">
                GROUP NAME
              </Label>
              <Input
                value={name}
                onChangeText={(t) => setName(t)}
                placeholder="e.g. Weekend Trip, Housemates…"
                autoCapitalize="words"
                className="bg-white h-[56px] rounded-[20px] px-4 border border-border text-[16px]"
              />
            </TextField>

            <TextField>
              <Label className="ml-1 tracking-widest uppercase text-muted-foreground text-[10px]">
                DESCRIPTION (OPTIONAL)
              </Label>
              <Input
                value={description}
                onChangeText={setDescription}
                placeholder="What is this group for?"
                multiline
                textAlignVertical="top"
                className="bg-white rounded-[20px] px-4 py-3 border border-border min-h-[80px] text-[16px]"
              />
            </TextField>
          </View>

          {/* ── Currency ──────────────────────────────── */}
          <View className="px-6 mb-8">
            <Typography
              type="body-xs"
              className="text-muted-foreground font-bold tracking-widest mb-3 ml-2"
            >
              CURRENCY
            </Typography>
            <View className="bg-white rounded-[24px] p-5 border border-border">
              <Typography type="body-sm" className="text-muted-foreground font-medium mb-4">
                All expenses will use this currency
              </Typography>
              <CurrencySelector value={currency.code} onChange={setCurrency} />
            </View>
          </View>

          {/* ── Members ──────────────────────────────── */}
          <View className="px-6 mb-6">
            <Typography
              type="body-xs"
              className="text-muted-foreground font-bold tracking-widest mb-3 ml-2 uppercase"
            >
              MEMBERS
            </Typography>
            <View className="bg-white rounded-[24px] p-5 border border-border">
              <Typography type="body-sm" className="text-muted-foreground font-medium mb-4">
                Add friends by their email address
              </Typography>

              <View className="flex-row gap-2 mb-4">
                <View className="flex-1">
                  <Input
                    value={emailInput}
                    onChangeText={setEmailInput}
                    placeholder="friend@example.com"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    onSubmitEditing={handleAddEmail}
                    className="bg-[#F8F8F9] h-[48px] rounded-[16px] px-4 border border-border text-[15px]"
                  />
                </View>
                <Button
                  variant="secondary"
                  onPress={handleAddEmail}
                  className="h-[48px] rounded-[16px] px-4"
                  isDisabled={!emailInput.includes("@")}
                >
                  <Button.Label>Add</Button.Label>
                </Button>
              </View>

              <View className="flex-row flex-wrap gap-2">
                {memberEmails.map((email) => (
                  <Chip
                    key={email}
                    className="bg-primary/10 rounded-full pl-3 pr-2 py-1 flex-row items-center gap-1"
                  >
                    <Typography type="body-sm" className="text-primary font-medium">
                      {email}
                    </Typography>
                    <PressableFeedback
                      onPress={() => handleRemoveEmail(email)}
                      className="p-1 rounded-full bg-primary/20 ml-1"
                    >
                      <icons.X size={12} className="text-primary" />
                    </PressableFeedback>
                  </Chip>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>

        {/* ── Fixed Submit Button ────────────────────────────────── */}
        <View className="px-6 py-4 bg-background border-t border-border/50">
          <Button
            variant="primary"
            className="w-full h-[56px] rounded-[20px]"
            onPress={handleCreate}
            isDisabled={loading}
          >
            {loading && <Spinner color="white" size="sm" className="mr-2" />}
            <Button.Label className="font-bold">Create Group</Button.Label>
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
