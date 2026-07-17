import { Typography } from "heroui-native";
import { useRouter, useNavigation } from "expo-router";
import type { JSX } from "react";
import { useState, useEffect } from "react";
import { ThemedStatusBar } from "@/components/ui/ThemedStatusBar";
import { KeyboardAvoidingView, Platform, ScrollView, View, TextInput, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as icons from "lucide-react-native";
import * as Haptics from "expo-haptics";

import { useAuth } from "@/context/AppContext";
import { useUpdateProfile } from "@/features/profile/hooks/useUpdateProfile";
import { useAppToast } from "@/hooks/useAppToast";
import { useUI, IconButton, SectionLabel } from "@/components/ui";
import { HapticButton } from "@/components/ui/HapticButton";
import { BottomActionBar } from "@/components/ui/BottomActionBar";

export default function EditProfileScreen(): JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();
  const { toast } = useAppToast();
  const { mutateAsync: updateProfile, isPending } = useUpdateProfile();
  const { color, radius, space, shadow } = useUI();
  const ERROR = color.danger;

  const navigation = useNavigation();
  const [name, setName] = useState(currentUser.name);
  const [nameError, setNameError] = useState("");
  const hasUnsavedChanges = name !== currentUser.name;

  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e: any) => {
      if (!hasUnsavedChanges) return;
      e.preventDefault();
      Alert.alert("Unsaved Changes", "You have unsaved changes. Go back anyway?", [
        { text: "Stay", style: "cancel" },
        {
          text: "Discard",
          style: "destructive",
          onPress: () => navigation.dispatch(e.data.action),
        },
      ]);
    });
    return unsubscribe;
  }, [navigation, hasUnsavedChanges]);

  const handleClose = () => {
    if (hasUnsavedChanges) {
      Alert.alert("Unsaved Changes", "You have unsaved changes. Go back anyway?", [
        { text: "Stay", style: "cancel" },
        { text: "Discard", style: "destructive", onPress: () => router.back() },
      ]);
    } else {
      router.back();
    }
  };

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
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      <ThemedStatusBar />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View
          style={{
            paddingTop: insets.top + 16,
            paddingHorizontal: space.page,
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
              color: color.text,
            }}
          >
            Edit Profile
          </Typography>
          <IconButton icon={icons.X} accessibilityLabel="Close" onPress={handleClose} />
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: space.page, paddingTop: 32, gap: 28 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View>
            <View style={{ marginBottom: 12 }}>
              <SectionLabel>Name</SectionLabel>
            </View>
            <TextInput
              value={name}
              onChangeText={(v) => {
                setNameError("");
                setName(v);
              }}
              placeholder="Full Name"
              placeholderTextColor={color.muted}
              autoCapitalize="words"
              style={{
                fontSize: 16,
                color: color.text,
                fontFamily: "IBMPlexSans_500Medium",
                borderBottomWidth: 1,
                borderBottomColor: nameError ? ERROR : color.border,
                paddingBottom: 12,
              }}
            />
            {nameError && (
              <Typography
                style={{
                  color: ERROR,
                  fontSize: 13,
                  fontFamily: "IBMPlexSans_500Medium",
                  marginTop: 8,
                }}
              >
                {nameError}
              </Typography>
            )}
          </View>

          <View>
            <View style={{ marginBottom: 12 }}>
              <SectionLabel>Email</SectionLabel>
            </View>
            <Typography
              style={{
                fontSize: 16,
                color: color.muted,
                fontFamily: "IBMPlexSans_500Medium",
                paddingBottom: 12,
                borderBottomWidth: 1,
                borderBottomColor: color.border,
              }}
            >
              {currentUser.email}
            </Typography>
            <Typography
              style={{
                fontSize: 12,
                color: color.muted,
                fontFamily: "IBMPlexSans_500Medium",
                marginTop: 6,
                opacity: 0.6,
              }}
            >
              Email cannot be changed
            </Typography>
          </View>
        </ScrollView>

        <BottomActionBar>
          <HapticButton
            onPress={handleSave}
            disabled={isPending}
            loading={isPending}
            tone="ink"
            height={56}
            style={{ flex: 1 }}
          >
            Save Changes
          </HapticButton>
        </BottomActionBar>
      </KeyboardAvoidingView>
    </View>
  );
}
