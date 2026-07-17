import type { JSX } from "react";
import { View, Pressable, Image } from "react-native";
import { Typography } from "heroui-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { CategoryIconBadge } from "@/components/ui/CategoryIconBadge";
import { useUI, GlassHeroBalance } from "@/components/ui";
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

  const metrics: Array<{ label: string; value: string }> = [
    { label: "Date", value: dateStr },
    {
      label: "Paid by",
      value: paidByLabel,
    },
  ];
  if (groupName) {
    metrics.push({ label: "Group", value: groupName });
  }

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
        <Typography
          style={{
            fontSize: 28,
            color: color.text,
            fontFamily: "Sora_600SemiBold",
            lineHeight: 34,
          }}
        >
          {title}
        </Typography>
        <CategoryIconBadge category={category} size="lg" />
      </View>

      <GlassHeroBalance
        label={categoryLabel}
        amount={formattedAmount}
        metrics={metrics}
      >
        {notes ? (
          <Typography
            style={{
              marginTop: 16,
              fontSize: 14,
              color: color.muted,
              fontFamily: "IBMPlexSans_500Medium",
              lineHeight: 22,
            }}
          >
            &quot;{notes}&quot;
          </Typography>
        ) : null}

        {receiptUrl ? (
          <View style={{ marginTop: 16, alignItems: "center" }}>
            <Pressable
              accessibilityRole="imagebutton"
              accessibilityLabel="View receipt"
              onPress={() => {
                // Open full-screen image — uses router or Linking
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
            <Typography
              style={{
                marginTop: 8,
                fontSize: 13,
                color: color.muted,
                fontFamily: "IBMPlexSans_500Medium",
              }}
            >
              Receipt
            </Typography>
          </View>
        ) : null}
      </GlassHeroBalance>
    </Animated.View>
  );
}
