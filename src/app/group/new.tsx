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
import { Alert, Button, Typography, PressableFeedback } from "heroui-native";
import { useRouter } from "expo-router";
import type { JSX } from "react";
import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CurrencySelector } from "@/components/CurrencySelector";
import * as icons from "lucide-react-native";
import { useApp } from "@/context/AppContext";
import type { Currency } from "@/types";

const GROUP_ICONS = ["Home", "Plane", "Pizza", "PartyPopper", "Tent", "Gamepad2", "Briefcase", "Music", "Dumbbell", "Coffee", "Car", "Film", "ShoppingCart", "Mountain", "Target"];

export default function NewGroupScreen(): JSX.Element {
  const router = useRouter();
  const { createGroup } = useApp();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("Home");
  const [currency, setCurrency] = useState<Currency>({ code: "USD", name: "US Dollar", symbol: "$" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleCreate(): void {
    if (!name.trim()) { setError("Group name is required"); return; }

    setLoading(true);
    setError("");
    try {
      const group = createGroup({
        name: name.trim(),
        description: description.trim() || undefined,
        icon,
        currency: currency.code,
        memberEmails: [],
      });
      router.replace(`/group/${group.id}`);
    } catch {
      setError("Failed to create group. Please try again.");
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F2F2F6' }} edges={["top", "bottom"]}>
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
            <Typography type="h3" className="font-black tracking-tight text-[28px]">New Group</Typography>
            <Button variant="ghost" size="sm" onPress={() => router.back()}>✕ Cancel</Button>
          </View>

          {/* ── Icon picker ──────────────────────────── */}
          <View className="mb-8">
            <Typography type="body-xs" className="text-muted-foreground font-bold tracking-widest mb-3 ml-8">
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
                      className={`w-14 h-14 rounded-full items-center justify-center border-2 ${isSelected ? 'bg-primary border-primary' : 'bg-white border-transparent shadow-sm'}`}
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
            <View className="items-center bg-white rounded-[32px] p-6 shadow-sm border border-border">
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
                <Typography type="body" className="text-muted-foreground font-medium text-center mb-4">
                  {description}
                </Typography>
              ) : <View className="h-4" />}
              <View className="bg-primary/10 px-3 py-1.5 rounded-full">
                <Typography type="body-sm" className="font-bold text-primary">
                  {currency.symbol} {currency.code}
                </Typography>
              </View>
            </View>
          </View>

          {/* ── Form fields ───────────────────────────── */}
          <View className="px-6 mb-8 gap-5">
            <View>
              <Typography type="body-sm" className="font-bold text-muted-foreground tracking-widest mb-2 ml-2">
                GROUP NAME
              </Typography>
              <View className={`bg-white shadow-sm h-[56px] rounded-[20px] px-4 justify-center border ${error && !name.trim() ? 'border-danger' : 'border-border'}`}>
                <TextInput 
                  value={name}
                  onChangeText={(t) => { setName(t); setError(""); }}
                  placeholder="e.g. Weekend Trip, Housemates…"
                  className="font-medium text-[16px] text-foreground h-full"
                  placeholderTextColor="#8A8798"
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View>
              <Typography type="body-sm" className="font-bold text-muted-foreground tracking-widest mb-2 ml-2">
                DESCRIPTION (OPTIONAL)
              </Typography>
              <View className="bg-white shadow-sm rounded-[20px] px-4 py-3 border border-border">
                <TextInput 
                  value={description}
                  onChangeText={setDescription}
                  placeholder="What is this group for?"
                  className="font-medium text-[16px] text-foreground min-h-[80px]"
                  placeholderTextColor="#8A8798"
                  multiline
                  textAlignVertical="top"
                />
              </View>
            </View>
          </View>

          {/* ── Currency ──────────────────────────────── */}
          <View className="px-6 mb-8">
            <Typography type="body-xs" className="text-muted-foreground font-bold tracking-widest mb-3 ml-2">
              CURRENCY
            </Typography>
            <View className="bg-white rounded-[24px] p-5 shadow-sm border border-border">
              <Typography type="body-sm" className="text-muted-foreground font-medium mb-4">
                All expenses will use this currency
              </Typography>
              <CurrencySelector
                value={currency.code}
                onChange={setCurrency}
              />
            </View>
          </View>

          {/* ── Members note ──────────────────────────── */}
          <View className="px-6 mb-6">
            <Alert status="default" className="rounded-[20px]">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>You'll be added automatically</Alert.Title>
                <Alert.Description>
                  Invite others after creating the group from the group detail screen.
                </Alert.Description>
              </Alert.Content>
            </Alert>
          </View>

          {/* ── Error ─────────────────────────────────── */}
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
        </ScrollView>

        {/* ── Fixed Submit Button ────────────────────────────────── */}
        <View className="px-6 py-4 bg-background border-t border-border/50">
          <PressableFeedback onPress={loading ? undefined : handleCreate}>
            <View className={`w-full h-[56px] rounded-[20px] items-center justify-center shadow-sm ${loading ? 'bg-primary/70' : 'bg-primary'}`}>
              <Typography type="body" className="font-bold text-white">
                {loading ? "Creating…" : "Create Group"}
              </Typography>
            </View>
          </PressableFeedback>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
