import type { JSX } from "react";
import { View } from "react-native";
import { Switch } from "heroui-native";
import { Moon, DollarSign } from "lucide-react-native";
import { useUI } from "@/components/ui";
import { MoneyRow, Eyebrow, useCoralColors } from "@/components/coral";
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
  const coral = useCoralColors();

  return (
    <View style={{ marginBottom: 28 }}>
      <Eyebrow style={{ marginTop: 0 }}>Preferences</Eyebrow>
      <View
        style={{
          backgroundColor: coral.surface,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: coral.border,
          overflow: "hidden",
        }}
      >
        <MoneyRow
          avatar={<Moon size={20} color={color.text} />}
          title="Dark Mode"
          subtitle="Switch between light and dark themes"
          amount=""
          rightElement={<Switch isSelected={isDarkMode} onSelectedChange={onThemeToggle} />}
        />
        <MoneyRow
          avatar={<DollarSign size={20} color={color.text} />}
          title="Currency"
          subtitle={preferredCurrencyCode}
          amount=""
          rightElement={
            <CurrencySelector value={preferredCurrencyCode} onChange={onCurrencyChange} />
          }
        />
      </View>
    </View>
  );
}
