import type { JSX } from "react";
import {  View, Pressable, TextInput, ScrollView, Text , ActivityIndicator } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useUI } from "@/components/ui";
import { Eyebrow, useCoralColors } from "@/components/coral";

interface SettlementConfirmationProps {
  showOptional: boolean;
  note: string;
  sharedGroups: any[];
  isGroupRoute: boolean;
  selectedGroupId: string | undefined;
  onToggleOptional: () => void;
  onNoteChange: (text: string) => void;
  onGroupSelect: (groupId: string | undefined) => void;
}

export function SettlementConfirmation({
  showOptional,
  note,
  sharedGroups,
  isGroupRoute,
  selectedGroupId,
  onToggleOptional,
  onNoteChange,
  onGroupSelect,
}: SettlementConfirmationProps): JSX.Element {
  const { color, radius } = useUI();
  const coral = useCoralColors();

  return (
    <>
      <View style={{ paddingHorizontal: 24, marginBottom: 16, alignItems: "center" }}>
        <Pressable onPress={onToggleOptional} style={{ padding: 8 }}>
          <Text style={{ fontSize: 13, color: color.brand, fontFamily: "InstrumentSans_500Medium" }}>
            {showOptional ? "Hide Options" : "+ Add Note or Group"}
          </Text>
        </Pressable>

        {showOptional && (
          <Animated.View
            entering={FadeIn}
            exiting={FadeOut}
            style={{ width: "100%", marginTop: 16, gap: 16 }}
          >
            <Eyebrow style={{ marginTop: 0 }}>Details</Eyebrow>
            <View
              style={{
                backgroundColor: coral.surface,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: coral.border,
                overflow: "hidden",
                padding: 16,
              }}
            >
              <TextInput
                placeholder="Add a note..."
                placeholderTextColor={color.muted}
                value={note}
                onChangeText={onNoteChange}
                style={{
                  borderWidth: 1,
                  borderColor: color.border,
                  padding: 16,
                  borderRadius: radius.lg,
                  fontSize: 15,
                  fontFamily: "InstrumentSans_500Medium",
                  backgroundColor: "transparent",
                }}
              />

              {sharedGroups.length > 0 && !isGroupRoute && (
                <View>
                  <Text
                    style={{
                      fontSize: 12,
                      color: color.muted,
                      fontFamily: "InstrumentSans_500Medium",
                      marginBottom: 8,
                      marginLeft: 4,
                    }}
                  >
                    Link to Group
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 8 }}
                  >
                    <Pressable
                      onPress={() => onGroupSelect(undefined)}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        borderWidth: 1,
                        borderRadius: radius.pill,
                        borderColor: !selectedGroupId ? color.brand : color.border,
                        backgroundColor: !selectedGroupId ? color.brand : "transparent",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          color: !selectedGroupId ? color.textInverse : color.text,
                          fontFamily: "InstrumentSans_600SemiBold",
                        }}
                      >
                        None
                      </Text>
                    </Pressable>
                    {sharedGroups.map((g) => {
                      const isSelected = selectedGroupId === g.id;
                      return (
                        <Pressable
                          key={g.id}
                          onPress={() => onGroupSelect(g.id)}
                          style={{
                            paddingHorizontal: 16,
                            paddingVertical: 10,
                            borderWidth: 1,
                            borderRadius: radius.pill,
                            borderColor: isSelected ? color.brand : color.border,
                            backgroundColor: isSelected ? color.brand : "transparent",
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 13,
                              color: isSelected ? color.textInverse : color.text,
                              fontFamily: "InstrumentSans_600SemiBold",
                            }}
                          >
                            {g.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>
              )}
            </View>
          </Animated.View>
        )}
      </View>

      <View style={{ flex: 1 }} />
    </>
  );
}

interface SettlementStickySubmitProps {
  leftName: string;
  rightName: string;
  parsedAmount: number;
  settlementCurrencyObj: { symbol: string };
  isAddingSettlement: boolean;
  onSubmit: () => Promise<boolean>;
  bottomInset: number;
}

export function SettlementStickySubmit({
  leftName,
  rightName,
  parsedAmount,
  settlementCurrencyObj,
  isAddingSettlement,
  onSubmit,
  bottomInset,
}: SettlementStickySubmitProps): JSX.Element {
  const { color, radius } = useUI();

  return (
    <View
      style={{
        paddingHorizontal: 24,
        paddingBottom: Math.max(bottomInset, 24),
        paddingTop: 12,
        backgroundColor: color.bg,
        borderTopWidth: 1,
        borderTopColor: color.border,
      }}
    >
      <View
        style={{
          borderRadius: radius.lg,
          padding: 0,
          backgroundColor: color.surface,
          borderWidth: 1,
          borderColor: color.border,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 12,
            marginBottom: 12,
          }}
        >
          <Text
            style={{
              fontSize: 13,
              color: color.muted,
              fontFamily: "InstrumentSans_500Medium",
              marginBottom: 4,
            }}
          >
            Recording payment
          </Text>
          <Text
            style={{
              fontSize: 15,
              color: color.text,
              fontFamily: "InstrumentSans_600SemiBold",
            }}
          >
            {leftName} pays {rightName}
          </Text>
        </View>
      </View>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onSubmit();
        }}
        disabled={isAddingSettlement || !parsedAmount}
        style={({ pressed }) => ({
          backgroundColor: color.brand,
          height: 56,
          borderRadius: radius.pill,
          justifyContent: "center",
          alignItems: "center",
          opacity: pressed || isAddingSettlement || !parsedAmount ? 0.8 : 1,
          marginTop: 12,
        })}
      >
        {isAddingSettlement ? (
          <ActivityIndicator color={color.textInverse} size="small" />
        ) : (
          <Text
            style={{
              fontSize: 16,
              color: color.textInverse,
              fontFamily: "InstrumentSans_600SemiBold",
              letterSpacing: 1,
            }}
          >
            Record {settlementCurrencyObj.symbol}
            {parsedAmount.toFixed(2)}
          </Text>
        )}
      </Pressable>
    </View>
  );
}
