import { useMemo } from "react";
import { View, LayoutAnimation, Platform, UIManager } from "react-native";
import { Typography } from "heroui-native";
import { evaluatePasswordStrength } from "@/utils/passwordStrength";
import { UI } from "@/components/ui/native-ui";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface PasswordStrengthMeterProps {
  password: string;
}

const FILL_COLORS = [UI.color.border, UI.color.muted, "#6E6D68", UI.color.text];

const LABEL_COLORS = [UI.color.muted, UI.color.muted, "#6E6D68", UI.color.text];

export function PasswordStrengthMeter({
  password,
}: PasswordStrengthMeterProps): React.JSX.Element | null {
  const result = useMemo(() => evaluatePasswordStrength(password), [password]);

  const showMeter = password.length > 0;

  if (!showMeter) return null;

  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

  return (
    <View style={{ marginTop: -16, marginBottom: 8 }}>
      <View style={{ flexDirection: "row", gap: 6, marginBottom: 6 }}>
        {[0, 1, 2].map((index) => (
          <View
            key={index}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              backgroundColor: index < result.score ? FILL_COLORS[result.score] : UI.color.border,
            }}
          />
        ))}
      </View>
      <Typography
        style={{
          fontSize: 12,
          fontFamily: "IBMPlexSans_500Medium",
          color: LABEL_COLORS[result.score],
        }}
      >
        {result.label}
      </Typography>
    </View>
  );
}
