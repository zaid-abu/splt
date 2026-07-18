import type { JSX } from "react";
import { View, Pressable, Image, Text } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { CategoryIconBadge } from "@/components/ui/CategoryIconBadge";
import { useUI } from "@/components/ui";
import { BalanceHero, StatPair } from "@/components/coral";
import type { Expense, User } from "@/types";

interface ExpenseSummaryProps {
  categoryLabel: string;
  title: string;
  category: Expense["category"];
  formattedAmount: string;
  dateStr: string;
  paidByLabel: string;
  paidByUser: User;
  groupName?: string;
  notes?: string;
  receiptUrl?: string;
}

export function ExpenseSummary({
  categoryLabel,
  title,
  category,
  formattedAmount,
  dateStr,
  paidByLabel,
  paidByUser,
  groupName,
  notes,
  receiptUrl,
}: ExpenseSummaryProps): JSX.Element {
  const { color, radius, space } = useUI();

  return (
    <Animated.View
      entering={FadeInDown.duration(400)}
      style={{
        paddingHorizontal: space.page,
        paddingTop: 32,
        paddingBottom: 32,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 16,
        }}
      >
        <Text
          style={{
            fontSize: 28,
            color: color.text,
            fontFamily: "InstrumentSans_600SemiBold",
            lineHeight: 34,
          }}
        >
          {title}
        </Text>
        <CategoryIconBadge category={category} size="lg" />
      </View>

      <BalanceHero label={categoryLabel} value={formattedAmount}>
        <View style={{ flexDirection: "row", gap: 12, marginVertical: 12 }}>
          <StatPair
            left={{ label: "Date", value: dateStr }}
            right={{ label: "Paid by", value: paidByLabel }}
          />
          {groupName ? (
            <View
              style={{
                flex: 1,
                backgroundColor: color.surface,
                borderWidth: 1,
                borderColor: color.border,
                borderRadius: 14,
                padding: 14,
                marginTop: 12,
              }}
            >
              <Text
                style={{
                  fontFamily: "InstrumentSans_600SemiBold",
                  fontSize: 16,
                  color: color.text,
                }}
              >
                {groupName}
              </Text>
              <Text
                style={{
                  fontFamily: "InstrumentSans_400Regular",
                  fontSize: 12,
                  color: color.muted,
                  marginTop: 5,
                }}
              >
                Group
              </Text>
            </View>
          ) : null}
        </View>

        {notes ? (
          <Text
            style={{
              marginTop: 16,
              fontSize: 14,
              color: color.muted,
              fontFamily: "InstrumentSans_500Medium",
              lineHeight: 22,
            }}
          >
            &quot;{notes}&quot;
          </Text>
        ) : null}

        {receiptUrl ? (
          <View style={{ marginTop: 16, alignItems: "center" }}>
            <Pressable
              accessibilityRole="imagebutton"
              accessibilityLabel="View receipt"
              onPress={() => {
                // Open full-screen image
              }}
              style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
            >
              <Image
                source={{ uri: receiptUrl }}
                style={{
                  width: "100%",
                  height: 200,
                  borderRadius: radius.md,
                }}
                resizeMode="contain"
              />
            </Pressable>
            <Text
              style={{
                marginTop: 8,
                fontSize: 13,
                color: color.muted,
                fontFamily: "InstrumentSans_500Medium",
              }}
            >
              Receipt
            </Text>
          </View>
        ) : null}
      </BalanceHero>
    </Animated.View>
  );
}
