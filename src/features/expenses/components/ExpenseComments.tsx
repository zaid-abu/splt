import type { JSX } from "react";
import { useState } from "react";
import { View, Pressable, TextInput } from "react-native";
import { Typography } from "heroui-native";
import * as Haptics from "expo-haptics";
import * as icons from "lucide-react-native";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { ErrorState } from "@/components/ui/ErrorState";
import { useUI } from "@/components/ui";
import { useExpenseComments, useAddComment } from "@/features/expenses/queries/useComments";

interface ExpenseCommentsProps {
  expenseId: string;
  currentUserId: string;
}

export function ExpenseComments({
  expenseId,
  currentUserId,
}: ExpenseCommentsProps): JSX.Element {
  const { color, radius } = useUI();
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
    <View
      style={{
        backgroundColor: color.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: color.border,
        overflow: "hidden",
      }}
    >
      {isError ? (
        <View style={{ paddingVertical: 24, alignItems: "center" }}>
          <ErrorState onRetry={() => refetch()} />
        </View>
      ) : comments.length === 0 && !isLoading ? (
        <View style={{ paddingVertical: 24, alignItems: "center" }}>
          <Typography
            style={{
              fontSize: 14,
              color: color.muted,
              fontFamily: "IBMPlexSans_500Medium",
            }}
          >
            No comments yet
          </Typography>
        </View>
      ) : (
        comments.map((comment) => (
          <View
            key={comment.id}
            style={{
              flexDirection: "row",
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderBottomWidth: 1,
              borderBottomColor: color.border,
            }}
          >
            <AppUserAvatar
              user={
                (comment.user as any) ?? {
                  id: comment.user_id,
                  name: "?",
                  initials: "?",
                  email: "",
                  defaultCurrency: "USD",
                }
              }
              size="sm"
            />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Typography
                  style={{
                    fontSize: 14,
                    color: color.text,
                    fontFamily: "IBMPlexSans_600SemiBold",
                  }}
                >
                  {comment.user?.name ?? "Unknown"}
                </Typography>
                <Typography
                  style={{
                    fontSize: 11,
                    color: color.muted,
                    fontFamily: "IBMPlexSans_500Medium",
                  }}
                >
                  {new Date(comment.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </Typography>
              </View>
              <Typography
                style={{
                  marginTop: 2,
                  fontSize: 14,
                  color: color.text,
                  fontFamily: "IBMPlexSans_400Regular",
                  lineHeight: 20,
                }}
              >
                {comment.text}
              </Typography>
            </View>
          </View>
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
            fontFamily: "IBMPlexSans_400Regular",
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
  );
}
