import { Typography } from "heroui-native";
import { useRouter } from "expo-router";
import type { JSX } from "react";
import { useState } from "react";
import { ThemedStatusBar } from "@/components/ui/ThemedStatusBar";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  ActivityIndicator,
  Pressable,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as icons from "lucide-react-native";
import * as Haptics from "expo-haptics";

import { useAuth } from "@/context/AppContext";
import { useUpdateProfile } from "@/features/profile/hooks/useUpdateProfile";
import { useAppToast } from "@/hooks/useAppToast";
import { UI, IconButton } from "@/components/ui/native-ui";

const ERROR = UI.color.danger;

export default function EditProfileScreen(): JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();
  const { toast } = useAppToast();
  const { mutateAsync: updateProfile, isPending } = useUpdateProfile();

  const [name, setName] = useState(currentUser.name);
  const [nameError, setNameError] = useState("");

  const handleSave = async () => {
    if (!name.trim()) {
      setNameError("Name is required");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await updateProfile({
        userId: currentUser.id,
        data: { name: name.trim() },
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err: any) {
      toast.show({
        label: "Update failed",
        description: err.message || "Could not update profile.",
        variant: "danger",
        placement: "top",
      });
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: UI.color.bg }}>
      <ThemedStatusBar />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View
          style={{
            paddingTop: insets.top + 16,
            paddingHorizontal: UI.space.page,
            paddingBottom: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography
            style={{
              fontFamily: "Sora_600SemiBold",
              fontSize: 24,
              color: UI.color.text,
            }}
          >
            Edit Profile
          </Typography>
          <IconButton icon={icons.X} accessibilityLabel="Close" onPress={() => router.back()} />
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: UI.space.page, paddingTop: 32, gap: 28 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TextInput
            value={name}
            onChangeText={(v) => {
              setNameError("");
              setName(v);
            }}
            placeholder="Full Name"
            placeholderTextColor={UI.color.muted}
            autoCapitalize="words"
            style={{
              fontSize: 16,
              color: UI.color.text,
              fontFamily: "IBMPlexSans_500Medium",
              borderBottomWidth: 1,
              borderBottomColor: nameError ? ERROR : UI.color.border,
              paddingBottom: 12,
            }}
          />

          {nameError && (
            <Typography style={{ color: ERROR, fontSize: 13, fontFamily: "IBMPlexSans_500Medium" }}>
              {nameError}
            </Typography>
          )}
        </ScrollView>

        <View
          style={{
            paddingHorizontal: UI.space.page,
            paddingBottom: Math.max(insets.bottom, 16),
            paddingTop: 16,
            borderTopWidth: 1,
            borderTopColor: UI.color.border,
            backgroundColor: UI.color.bg,
          }}
        >
          <Pressable
            accessibilityRole="button"
            disabled={isPending}
            onPress={handleSave}
            style={({ pressed }) => ({
              height: 56,
              borderRadius: UI.radius.pill,
              backgroundColor: UI.color.text,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: 8,
              opacity: pressed || isPending ? 0.78 : 1,
            })}
          >
            {isPending && <ActivityIndicator color={UI.color.textInverse} />}
            <Typography
              style={{
                fontSize: 16,
                color: UI.color.textInverse,
                fontFamily: "IBMPlexSans_600SemiBold",
              }}
            >
              Save Changes
            </Typography>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
