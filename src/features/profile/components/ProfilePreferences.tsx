import type { JSX } from "react";
import { View } from "react-native";
import { Switch } from "heroui-native";
import { Moon, DollarSign } from "lucide-react-native";
import { useUI, GlassSection, GlassRow } from "@/components/ui";
import { CurrencySelector } from "@/components/forms/CurrencySelector";
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
  const { color } = useUI();

  return (
    <GlassSection title="Preferences">
      <GlassRow
        icon={<Moon size={20} color={color.text} />}
        title="Dark Mode"
        subtitle="Switch between light and dark themes"
        end={<Switch isSelected={isDarkMode} onSelectedChange={onThemeToggle} />}
      />
      <GlassRow
        icon={<DollarSign size={20} color={color.text} />}
        title="Currency"
        subtitle={preferredCurrencyCode}
        end={<CurrencySelector value={preferredCurrencyCode} onChange={onCurrencyChange} />}
      />
    </GlassSection>
  );
}
