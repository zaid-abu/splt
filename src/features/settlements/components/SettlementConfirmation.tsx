import type { JSX } from "react";
import { View, Pressable, TextInput, ScrollView } from "react-native";
import { Typography, Spinner } from "heroui-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useUI } from "@/components/ui";

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

  return (
    <>
      <View style={{ paddingHorizontal: 24, marginBottom: 16, alignItems: "center" }}>
        <Pressable onPress={onToggleOptional} style={{ padding: 8 }}>
          <Typography
            style={{ fontSize: 13, color: color.brand, fontFamily: "IBMPlexSans_500Medium" }}
          >
            {showOptional ? "Hide Options" : "+ Add Note or Group"}
          </Typography>
        </Pressable>

        {showOptional && (
          <Animated.View
            entering={FadeIn}
            exiting={FadeOut}
            style={{ width: "100%", marginTop: 16, gap: 16 }}
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
                fontFamily: "IBMPlexSans_500Medium",
                backgroundColor: color.surface,
              }}
            />

            {sharedGroups.length > 0 && !isGroupRoute && (
              <View>
                <Typography
                  style={{
                    fontSize: 12,
                    color: color.muted,
                    fontFamily: "IBMPlexSans_500Medium",
                    marginBottom: 8,
                    marginLeft: 4,
                  }}
                >
                  Link to Group
                </Typography>
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
                      backgroundColor: !selectedGroupId ? color.brand : color.surface,
                    }}
                  >
                    <Typography
                      style={{
                        fontSize: 13,
                        color: !selectedGroupId ? color.textInverse : color.text,
                        fontFamily: "IBMPlexSans_600SemiBold",
                      }}
                    >
                      None
                    </Typography>
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
                          backgroundColor: isSelected ? color.brand : color.surface,
                        }}
                      >
                        <Typography
                          style={{
                            fontSize: 13,
                            color: isSelected ? color.textInverse : color.text,
                            fontFamily: "IBMPlexSans_600SemiBold",
                          }}
                        >
                          {g.name}
                        </Typography>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            )}
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
    <View style={{ paddingHorizontal: 24, paddingBottom: Math.max(bottomInset, 24), paddingTop: 12, backgroundColor: color.bg, borderTopWidth: 1, borderTopColor: color.border }}>
      <View
        style={{
          backgroundColor: color.subtle,
          borderWidth: 1,
          borderColor: color.border,
          borderRadius: radius.lg,
          paddingHorizontal: 16,
          paddingVertical: 12,
          marginBottom: 12,
        }}
      >
        <Typography
          style={{
            fontSize: 13,
            color: color.muted,
            fontFamily: "IBMPlexSans_500Medium",
            marginBottom: 4,
          }}
        >
          Recording payment
        </Typography>
        <Typography
          style={{
            fontSize: 15,
            color: color.text,
            fontFamily: "IBMPlexSans_600SemiBold",
          }}
        >
          {leftName} pays {rightName}
        </Typography>
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
        })}
      >
        {isAddingSettlement ? (
          <Spinner color={color.textInverse} size="sm" />
        ) : (
          <Typography
            style={{
              fontSize: 16,
              color: color.textInverse,
              fontFamily: "IBMPlexSans_600SemiBold",
              letterSpacing: 1,
            }}
          >
            Record {settlementCurrencyObj.symbol}
            {parsedAmount.toFixed(2)}
          </Typography>
        )}
      </Pressable>
    </View>
  );
}
