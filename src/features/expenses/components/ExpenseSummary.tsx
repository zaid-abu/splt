import type { JSX } from "react";
import { View, Pressable, Image } from "react-native";
import { Typography } from "heroui-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { CategoryIconBadge } from "@/components/ui/CategoryIconBadge";
import { useUI } from "@/components/ui";
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
        borderBottomWidth: 1,
        borderBottomColor: color.border,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 24,
        }}
      >
        <View style={{ flex: 1 }}>
          <Typography
            style={{
              fontSize: 12,
              color: color.muted,
              fontFamily: "IBMPlexSans_600SemiBold",
              textTransform: "uppercase",
              letterSpacing: 2,
              marginBottom: 8,
            }}
          >
            {categoryLabel}
          </Typography>
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
        </View>
        <CategoryIconBadge category={category} size="lg" />
      </View>

      <View style={{ marginBottom: 24 }}>
        <Typography
          style={{
            fontSize: 48,
            lineHeight: 54,
            color: color.textStrong,
            fontFamily: "IBMPlexSans_600SemiBold",
            letterSpacing: -1.5,
          }}
        >
          {formattedAmount}
        </Typography>
      </View>

      <View style={{ gap: 16 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography
            style={{
              fontSize: 16,
              color: color.muted,
              fontFamily: "IBMPlexSans_500Medium",
            }}
          >
            Date
          </Typography>
          <Typography
            style={{
              fontSize: 16,
              color: color.text,
              fontFamily: "IBMPlexSans_600SemiBold",
            }}
          >
            {dateStr}
          </Typography>
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography
            style={{
              fontSize: 16,
              color: color.muted,
              fontFamily: "IBMPlexSans_500Medium",
            }}
          >
            Paid by
          </Typography>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <AppUserAvatar user={paidByUser} size="sm" />
            <Typography
              style={{
                fontSize: 16,
                color: color.text,
                fontFamily: "IBMPlexSans_600SemiBold",
              }}
            >
              {paidByLabel}
            </Typography>
          </View>
        </View>

        {groupName && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography
              style={{
                fontSize: 16,
                color: color.muted,
                fontFamily: "IBMPlexSans_500Medium",
              }}
            >
              Group
            </Typography>
            <Typography
              style={{
                fontSize: 16,
                color: color.text,
                fontFamily: "IBMPlexSans_600SemiBold",
              }}
            >
              {groupName}
            </Typography>
          </View>
        )}

        {notes && (
          <View
            style={{
              marginTop: 8,
              paddingTop: 16,
              borderTopWidth: 1,
              borderTopColor: color.border,
            }}
          >
            <Typography
              style={{
                fontSize: 14,
                color: color.muted,
                fontFamily: "IBMPlexSans_500Medium",
                lineHeight: 22,
              }}
            >
              &quot;{notes}&quot;
            </Typography>
          </View>
        )}

        {receiptUrl && (
          <View
            style={{
              marginTop: 8,
              paddingTop: 16,
              borderTopWidth: 1,
              borderTopColor: color.border,
              alignItems: "center",
            }}
          >
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
        )}
      </View>
    </Animated.View>
  );
}
