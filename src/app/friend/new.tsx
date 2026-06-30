import {
  Button,
  Typography,
  PressableFeedback,
  Spinner,
  TextField,
  Label,
  Input,
  useToast,
} from "heroui-native";
import { useRouter } from "expo-router";
import type { JSX } from "react";
import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import * as icons from "lucide-react-native";
import { useApp } from "@/context/AppContext";

export default function NewFriendScreen(): JSX.Element {
  const router = useRouter();
  const { createGroup, currentUser } = useApp();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isFormValid = name.trim().length > 0 && email.trim().length > 0 && email.includes("@");

  const handleSubmit = async () => {
    if (!isFormValid) return;

    setIsSubmitting(true);
    try {
      // In the current data model, friends are derived from groups.
      // So we create a 1-on-1 group representing this friendship.
      await createGroup({
        name: `Non-group expenses with ${name.trim()}`,
        icon: "User", // Using a fallback string icon
        currency: currentUser.defaultCurrency || "USD",
        memberEmails: [currentUser.email, email.trim()],
        simplifyDebts: true,
      });

      toast.show({
        label: "Friend added",
        description: `${name} has been added to your friends.`,
        variant: "success",
      });
      router.back();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to add friend";
      toast.show({
        label: "Error",
        description: msg,
        variant: "danger",
      });
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F2F2F6" }} edges={["top", "bottom"]}>
      <StatusBar style="dark" />

      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4">
        <PressableFeedback
          onPress={() => router.back()}
          hitSlop={8}
          className="w-10 h-10 items-center justify-center bg-white rounded-full border border-border/50"
        >
          <icons.X size={20} color="#0F172A" />
        </PressableFeedback>
        <Typography type="h3" className="font-bold">
          Add Friend
        </Typography>
        <View className="w-10 h-10" />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="bg-white rounded-[24px] p-6 border border-border/50 shadow-sm mb-6">
            <View className="mb-6 gap-2">
              <TextField>
                <Label className="ml-1 tracking-widest uppercase text-muted-foreground text-[10px]">
                  FRIEND&apos;S NAME
                </Label>
                <Input
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. John Doe"
                  autoCapitalize="words"
                  autoFocus
                  className="bg-[#F8F8F9] h-[56px] rounded-[20px] px-4 border border-border text-[16px]"
                />
              </TextField>
            </View>

            <View className="mb-6 gap-2">
              <TextField>
                <Label className="ml-1 tracking-widest uppercase text-muted-foreground text-[10px]">
                  FRIEND&apos;S EMAIL
                </Label>
                <Input
                  value={email}
                  onChangeText={setEmail}
                  placeholder="john@example.com"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  className="bg-[#F8F8F9] h-[56px] rounded-[20px] px-4 border border-border text-[16px]"
                />
              </TextField>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer / Submit */}
      <View className="p-6 bg-white border-t border-border/50 pt-4 pb-8 shadow-sm">
        <Button
          variant="primary"
          size="lg"
          className="w-full rounded-[16px] h-[56px]"
          isDisabled={!isFormValid || isSubmitting}
          onPress={handleSubmit}
        >
          {isSubmitting ? (
            <Spinner color="white" />
          ) : (
            <>
              <icons.UserPlus size={20} color="white" className="mr-2" />
              <Button.Label className="font-bold text-[16px] text-white">Add Friend</Button.Label>
            </>
          )}
        </Button>
      </View>
    </SafeAreaView>
  );
}
