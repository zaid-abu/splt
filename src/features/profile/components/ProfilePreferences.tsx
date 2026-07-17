import type { JSX } from "react";
import { View } from "react-native";
import { Switch } from "heroui-native";
import { useUI, SectionLabel } from "@/components/ui";
import { CurrencySelector } from "@/components/forms/CurrencySelector";
import { SettingsItem } from "@/features/profile/components/SettingsItem";
import type { Currency } from "@/types";

interface ProfilePreferencesProps {
  isDarkMode: boolean;
  preferredCurrencyCode: string;
  onThemeToggle: (value: boolean) => void;
  onCurrencyChange: (currency: Currency) => void;
}

export function ProfilePreferences({
  isDarkMode,
  preferredCurrencyCode,
  onThemeToggle,
  onCurrencyChange,
}: ProfilePreferencesProps): JSX.Element {
  const { color, radius } = useUI();

  return (
    <>
      <View style={{ marginBottom: 14 }}>
        <SectionLabel>Preferences</SectionLabel>
      </View>

      <View
        style={{
          backgroundColor: color.surface,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: color.border,
          marginBottom: 12,
        }}
      >
        <SettingsItem
          icon="Moon"
          title="Dark Mode"
          subtitle="Switch between light and dark themes"
          rightElement={<Switch isSelected={isDarkMode} onSelectedChange={onThemeToggle} />}
        />
      </View>

      <View
        style={{
          backgroundColor: color.surface,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: color.border,
        }}
      >
        <View style={{ paddingHorizontal: 16, paddingVertical: 14 }}>
          <CurrencySelector value={preferredCurrencyCode} onChange={onCurrencyChange} />
        </View>
      </View>
    </>
  );
}
