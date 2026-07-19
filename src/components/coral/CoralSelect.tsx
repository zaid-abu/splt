import React, { useCallback, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { ChevronDown, Check } from "lucide-react-native";
import { useCoralColors } from "./useCoral";
import { CoralSheet } from "./CoralSheet";

export type SelectOption = { value: string; label: string };

type CoralSelectProps = {
  options: SelectOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  label?: string;
};

export function CoralSelect({
  options,
  value,
  onValueChange,
  placeholder = "Select...",
  label,
}: CoralSelectProps) {
  const coral = useCoralColors();
  const [isOpen, setIsOpen] = useState(false);

  const selectedLabel = options.find((o) => o.value === value)?.label;

  const handleSelect = useCallback(
    (optionValue: string) => {
      onValueChange?.(optionValue);
      setIsOpen(false);
    },
    [onValueChange]
  );

  return (
    <View style={{ gap: 7 }}>
      {label ? (
        <Text
          style={{
            fontFamily: "InstrumentSans_500Medium",
            fontSize: 13,
            fontWeight: "500",
            letterSpacing: 0.02 * 13,
            color: coral.muted,
          }}
        >
          {label}
        </Text>
      ) : null}

      <Pressable
        onPress={() => setIsOpen(true)}
        accessibilityRole="button"
        style={({ pressed }) => ({
          minHeight: 48,
          borderWidth: 1,
          borderColor: coral.border,
          borderRadius: 14,
          backgroundColor: coral.surface,
          paddingHorizontal: 15,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Text
          numberOfLines={1}
          style={{
            fontFamily: "InstrumentSans_400Regular",
            fontSize: 16,
            color: selectedLabel ? coral.foreground : coral.muted,
            flex: 1,
          }}
        >
          {selectedLabel ?? placeholder}
        </Text>
        <ChevronDown size={18} color={coral.muted} strokeWidth={1.6} />
      </Pressable>

      <CoralSheet visible={isOpen} onClose={() => setIsOpen(false)}>
        <View style={{ paddingHorizontal: 4, paddingBottom: 8 }}>
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                onPress={() => handleSelect(option.value)}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  borderRadius: 12,
                  backgroundColor: pressed ? coral.border : "transparent",
                })}
              >
                <Text
                  style={{
                    fontFamily: isSelected
                      ? "InstrumentSans_600SemiBold"
                      : "InstrumentSans_400Regular",
                    fontSize: 16,
                    color: coral.foreground,
                  }}
                >
                  {option.label}
                </Text>
                {isSelected ? <Check size={18} color={coral.foreground} strokeWidth={2} /> : null}
              </Pressable>
            );
          })}
        </View>
      </CoralSheet>
    </View>
  );
}
