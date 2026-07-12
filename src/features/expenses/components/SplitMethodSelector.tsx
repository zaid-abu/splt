import type { JSX } from "react";
import { Pressable, View } from "react-native";
import { Typography } from "heroui-native";
import * as Haptics from "expo-haptics";
import * as icons from "lucide-react-native";
import { UI } from "@/components/ui/native-ui";
import { SPLIT_METHODS } from "@/features/expenses/constants";
import { styles } from "@/features/expenses/utils/styles";
import type { SplitMethod } from "@/types";

export function SplitMethodSelector({
  value,
  onChange,
}: {
  value: SplitMethod;
  onChange: (value: SplitMethod) => void;
}): JSX.Element {
  return (
    <View style={styles.methodGrid}>
      {SPLIT_METHODS.map((method) => {
        const Icon = (icons as any)[method.icon] || icons.Circle;
        const active = value === method.key;
        return (
          <Pressable
            key={method.key}
            accessibilityRole="button"
            onPress={() => {
              Haptics.selectionAsync();
              onChange(method.key);
            }}
            style={({ pressed }) => [
              styles.methodCard,
              active && styles.methodCardActive,
              pressed && styles.pressed,
            ]}
          >
            <View style={[styles.methodIcon, active && styles.methodIconActive]}>
              <Icon
                size={17}
                color={active ? UI.color.textInverse : UI.color.text}
                strokeWidth={1.8}
              />
            </View>
            <Typography style={styles.methodTitle}>{method.label}</Typography>
            <Typography style={styles.methodMeta}>{method.helper}</Typography>
          </Pressable>
        );
      })}
    </View>
  );
}
