import type { JSX } from "react";
import { useState } from "react";
import { View, Pressable, TextInput, Text } from "react-native";
import * as Haptics from "expo-haptics";
import * as icons from "lucide-react-native";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { ErrorState } from "@/components/ui/ErrorState";
import { useUI } from "@/components/ui";
import { MoneyRow, Eyebrow, useCoralColors } from "@/components/coral";
import { useExpenseComments, useAddComment } from "@/features/expenses/queries/useComments";

interface ExpenseCommentsProps {
  expenseId: string;
  currentUserId: string;
}

function fallbackUser(comment: any) {
  return (
    (comment.user as any) ?? {
      id: comment.user_id,
      name: "?",
      initials: "?",
      email: "",
      defaultCurrency: "USD",
      setupState: "complete",
    }
  );
}

function commentDate(createdAt: string) {
  return new Date(createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function ExpenseComments({ expenseId, currentUserId }: ExpenseCommentsProps): JSX.Element {
  const { color, radius } = useUI();
  const coral = useCoralColors();
  const { data: comments = [], isLoading, isError, refetch } = useExpenseComments(expenseId);
  const { mutateAsync: addComment } = useAddComment();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await addComment({ expenseId, userId: currentUserId, text: text.trim() });
      setText("");
    } catch {
      /* handled by query client */
    }
    setSending(false);
  };

  return (
    <View style={{ marginBottom: 28 }}>
      <Eyebrow style={{ marginTop: 0 }}>Comments</Eyebrow>
      <View
        style={{
          backgroundColor: coral.surface,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: coral.border,
          overflow: "hidden",
        }}
      >
        {isError ? (
          <View style={{ paddingVertical: 24, alignItems: "center" }}>
            <ErrorState onRetry={() => refetch()} />
          </View>
        ) : comments.length === 0 && !isLoading ? (
          <View style={{ paddingVertical: 24, alignItems: "center" }}>
            <Text
              style={{
                fontSize: 14,
                color: color.muted,
                fontFamily: "InstrumentSans_500Medium",
              }}
            >
              No comments yet
            </Text>
          </View>
        ) : (
          comments.map((comment) => (
            <MoneyRow
              key={comment.id}
              avatar={<AppUserAvatar user={fallbackUser(comment)} size="sm" />}
              title={comment.user?.name ?? "Unknown"}
              subtitle={comment.text}
              amount=""
              rightElement={
                <Text
                  style={{
                    fontSize: 11,
                    color: color.muted,
                    fontFamily: "InstrumentSans_500Medium",
                  }}
                >
                  {commentDate(comment.created_at)}
                </Text>
              }
            />
          ))
        )}

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderTopWidth: comments.length > 0 ? 1 : 0,
            borderTopColor: color.border,
          }}
        >
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Add a comment..."
            placeholderTextColor={color.muted}
            style={{
              flex: 1,
              fontSize: 14,
              color: color.text,
              fontFamily: "InstrumentSans_400Regular",
              paddingVertical: 8,
              paddingHorizontal: 8,
            }}
          />
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              handleSend();
            }}
            disabled={!text.trim() || sending}
            hitSlop={8}
            style={({ pressed }) => ({
              width: 36,
              height: 36,
              borderRadius: radius.pill,
              backgroundColor: text.trim() ? color.text : color.control,
              borderWidth: 1,
              borderColor: color.border,
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <icons.Send
              size={16}
              color={text.trim() ? color.textInverse : color.muted}
              strokeWidth={2}
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
