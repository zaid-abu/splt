import { useState } from "react";
import { View, Text, Alert } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

import { CoralScreen } from "@/components/coral/CoralScreen";
import { CoralTopBar } from "@/components/coral/CoralTopBar";
import { CoralField } from "@/components/coral/CoralField";
import { CoralButton } from "@/components/coral/CoralButton";
import { useCoralColors } from "@/components/coral/useCoral";

import { useAuth } from "@/context/AppContext";
import { useUpdateProfile } from "@/features/profile/hooks/useUpdateProfile";
import { useAppToast } from "@/hooks/useAppToast";

export default function EditProfileScreen() {
  const router = useRouter();
  const coral = useCoralColors();
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
    <CoralScreen contentContainerStyle={{ gap: 16 }}>
      <CoralTopBar title="Edit Profile" onBack={() => router.back()} />

      <View style={{ alignItems: "center", marginTop: 20, marginBottom: 12 }}>
        <View
          style={{
            width: 88,
            height: 88,
            borderRadius: 44,
            backgroundColor: coral.avatarSoft,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              fontFamily: "InstrumentSans_600SemiBold",
              fontSize: 32,
              color: coral.avatarInk,
            }}
          >
            {currentUser.initials}
          </Text>
        </View>
      </View>

      <CoralField
        label="Name"
        placeholder="Full name"
        value={name}
        onChangeText={(v) => {
          setNameError("");
          setName(v);
        }}
        error={nameError}
        autoCapitalize="words"
      />

      <CoralField
        label="Email"
        value={currentUser.email}
        editable={false}
        style={{ opacity: 0.6 }}
      />
      <Text
        style={{
          fontFamily: "InstrumentSans_400Regular",
          fontSize: 12,
          color: coral.muted,
          marginTop: -10,
        }}
      >
        Email cannot be changed
      </Text>

      <View style={{ marginTop: 12 }}>
        <CoralField
          label="Home currency"
          value={currentUser.defaultCurrency || "USD"}
          editable={false}
          style={{ opacity: 0.6 }}
        />
        <Text
          style={{
            fontFamily: "InstrumentSans_400Regular",
            fontSize: 12,
            color: coral.muted,
            marginTop: 6,
          }}
        >
          Change in Currencies
        </Text>
      </View>

      <View style={{ height: 12 }} />

      <CoralButton
        label="Save Changes"
        onPress={handleSave}
        disabled={isPending}
        loading={isPending}
      />
    </CoralScreen>
  );
}
