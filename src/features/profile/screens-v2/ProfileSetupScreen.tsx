import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import type { JSX } from "react";
import { useState } from "react";
import { Image, Pressable, Text, View } from "react-native";

import { CoralButton } from "@/components/coral/CoralButton";
import { CoralField } from "@/components/coral/CoralField";
import { CoralScreen } from "@/components/coral/CoralScreen";
import { CoralSegment } from "@/components/coral/CoralSegment";
import { CoralTopBar } from "@/components/coral/CoralTopBar";
import { LargeTitle } from "@/components/coral/LargeTitle";
import { useCoralColors } from "@/components/coral/useCoral";
import { CurrencySelector } from "@/components/forms/CurrencySelector";
import { useAuth } from "@/context/AppContext";
import { useAppToast } from "@/hooks/useAppToast";
import { AuthService } from "@/services/api/auth";
import { useUIStore, type ThemePreference } from "@/store/useUIStore";
import { CURRENCIES } from "@/types";

export default function ProfileSetupScreen(): JSX.Element {
  const router = useRouter();
  const coral = useCoralColors();
  const { toast } = useAppToast();
  const { currentUser, replaceCurrentUser } = useAuth();
  const preferredCurrency = useUIStore((state) => state.preferredCurrency);
  const currentTheme = useUIStore((state) => state.theme);
  const setCurrency = useUIStore((state) => state.setCurrency);
  const setTheme = useUIStore((state) => state.setTheme);
  const [displayName, setDisplayName] = useState(currentUser.name);
  const [selectedCurrency, setSelectedCurrency] = useState(
    currentUser.defaultCurrency || preferredCurrency.code
  );
  const [theme, setSelectedTheme] = useState<ThemePreference>(currentTheme);
  const [avatarUri, setAvatarUri] = useState<string | undefined>(currentUser.avatar);
  const [avatarChanged, setAvatarChanged] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initials =
    displayName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?";

  const chooseAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      toast.show({
        label: "Photo access needed",
        description: "Allow photo access to choose a profile picture, or continue without one.",
        variant: "danger",
        placement: "top",
      });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setAvatarUri(result.assets[0].uri);
      setAvatarChanged(true);
    }
  };

  const submit = async () => {
    const name = displayName.trim();
    if (name.length < 2) {
      toast.show({
        label: "Name required",
        description: "Enter at least two characters for your display name.",
        variant: "danger",
        placement: "top",
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const user = await AuthService.completeProfileSetup(currentUser.id, {
        name,
        defaultCurrency: selectedCurrency,
        avatarUri: avatarChanged ? avatarUri : undefined,
      });
      const currency = CURRENCIES.find((item) => item.code === selectedCurrency);
      if (currency) setCurrency(currency);
      setTheme(theme);
      replaceCurrentUser(user);
      router.replace("/first-action");
    } catch (error) {
      toast.show({
        label: "Setup failed",
        description: error instanceof Error ? error.message : "Could not complete profile setup.",
        variant: "danger",
        placement: "top",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CoralScreen>
      <CoralTopBar title="Profile setup" />
      <LargeTitle>Set up your profile.</LargeTitle>
      <Text
        style={{
          fontFamily: "InstrumentSans_400Regular",
          fontSize: 17,
          lineHeight: 26,
          color: coral.muted,
          marginBottom: 24,
        }}
      >
        Choose how friends see you and how Splt presents shared money.
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Choose a profile photo"
        onPress={() => void chooseAvatar()}
        style={{
          alignSelf: "center",
          alignItems: "center",
          gap: 8,
          marginBottom: 24,
          minHeight: 96,
        }}
      >
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={{ width: 80, height: 80, borderRadius: 40 }} />
        ) : (
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: coral.avatarSoft,
            }}
          >
            <Text
              style={{
                fontFamily: "InstrumentSans_600SemiBold",
                fontSize: 28,
                color: coral.avatarInk,
              }}
            >
              {initials}
            </Text>
          </View>
        )}
        <Text
          style={{ fontFamily: "InstrumentSans_600SemiBold", fontSize: 14, color: coral.accent }}
        >
          Add a profile photo
        </Text>
      </Pressable>
      <View style={{ gap: 20 }}>
        <CoralField
          label="Display name"
          value={displayName}
          onChangeText={setDisplayName}
          autoCapitalize="words"
          autoComplete="name"
        />
        <View style={{ gap: 7 }}>
          <Text
            style={{ fontFamily: "InstrumentSans_500Medium", fontSize: 13, color: coral.muted }}
          >
            Home currency
          </Text>
          <CurrencySelector
            value={selectedCurrency}
            onChange={(currency) => setSelectedCurrency(currency.code)}
          />
        </View>
        <View style={{ gap: 7 }}>
          <Text
            style={{ fontFamily: "InstrumentSans_500Medium", fontSize: 13, color: coral.muted }}
          >
            Appearance
          </Text>
          <CoralSegment
            options={[
              { label: "Automatic", value: "system" },
              { label: "Light", value: "light" },
              { label: "Dark", value: "dark" },
            ]}
            selected={theme}
            onSelect={(value) => setSelectedTheme(value as ThemePreference)}
          />
        </View>
        <CoralButton label="Continue" onPress={() => void submit()} loading={isSubmitting} />
      </View>
    </CoralScreen>
  );
}
