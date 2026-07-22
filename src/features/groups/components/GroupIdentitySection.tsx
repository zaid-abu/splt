import type { JSX } from "react";
import {  View, ScrollView, Pressable, TextInput , Text } from "react-native";
import * as Haptics from "expo-haptics";
import * as icons from "lucide-react-native";
import { useUI } from "@/components/ui";
import { Eyebrow, useCoralColors } from "@/components/coral";
import { GROUP_ICONS } from "@/constants/icons";

function IconShell({
  IconComponent,
  size = 44,
  selected,
}: {
  IconComponent: any;
  size?: number;
  selected?: boolean;
}): JSX.Element {
  const { color, radius } = useUI();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius.lg,
        backgroundColor: selected ? color.text : color.control,
        borderWidth: 1,
        borderColor: selected ? color.text : color.border,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <IconComponent
        size={size === 44 ? 20 : 28}
        color={selected ? color.textInverse : color.text}
        strokeWidth={1.5}
      />
    </View>
  );
}

export interface GroupIdentitySectionProps {
  icon: string;
  onIconChange: (icon: string) => void;
  name: string;
  onNameChange: (v: string) => void;
  nameError: string;
  description: string;
  onDescriptionChange: (v: string) => void;
}

export function GroupIdentitySection({
  icon,
  onIconChange,
  name,
  onNameChange,
  nameError,
  description,
  onDescriptionChange,
}: GroupIdentitySectionProps): JSX.Element {
  const { color } = useUI();
  const coral = useCoralColors();
  const SelectedIconComponent = (icons as any)[icon] || icons.HelpCircle;

  return (
    <View style={{ marginBottom: 28 }}>
      <Eyebrow style={{ marginTop: 0 }}>Identity</Eyebrow>
      <View
        style={{
          backgroundColor: coral.surface,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: coral.border,
          overflow: "hidden",
          padding: 20,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 32, gap: 16 }}>
          <IconShell IconComponent={SelectedIconComponent} size={64} selected />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 10 }}
          >
            {GROUP_ICONS.map((i) => {
              const IconComponent = (icons as any)[i] || icons.HelpCircle;
              const isSelected = icon === i;
              if (isSelected) return null;
              return (
                <Pressable
                  key={i}
                  accessibilityRole="button"
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onIconChange(i);
                  }}
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.65 : 1,
                  })}
                >
                  <IconShell IconComponent={IconComponent} />
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <TextInput
          value={name}
          onChangeText={(v) => {
            onNameChange(v);
          }}
          placeholder="Group Name"
          placeholderTextColor={color.muted}
          autoCapitalize="words"
          style={{
            fontSize: 28,
            color: color.text,
            fontFamily: "InstrumentSans_600SemiBold",
            borderBottomWidth: 1,
            borderBottomColor: color.border,
            paddingBottom: 14,
            marginBottom: nameError ? 8 : 24,
          }}
        />
        {nameError ? (
          <Text
            style={{
              marginBottom: 16,
              color: color.danger,
              fontSize: 13,
              fontFamily: "InstrumentSans_500Medium",
            }}
          >
            {nameError}
          </Text>
        ) : null}

        <TextInput
          value={description}
          onChangeText={onDescriptionChange}
          placeholder="Description (Optional)"
          placeholderTextColor={color.muted}
          multiline
          style={{
            fontSize: 16,
            color: color.text,
            fontFamily: "InstrumentSans_400Regular",
            borderBottomWidth: 1,
            borderBottomColor: color.border,
            paddingBottom: 14,
          }}
        />
      </View>
    </View>
  );
}
