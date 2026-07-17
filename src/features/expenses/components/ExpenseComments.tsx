import type { JSX } from "react";
import { useState } from "react";
import { View, Pressable, TextInput } from "react-native";
import { Typography } from "heroui-native";
import * as Haptics from "expo-haptics";
import * as icons from "lucide-react-native";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { ErrorState } from "@/components/ui/ErrorState";
import { useUI, GlassSection, GlassRow } from "@/components/ui";
import { useExpenseComments, useAddComment } from "@/features/expenses/queries/useComments";

interface ExpenseCommentsProps {
  expenseId: string;
  currentUserId: string;
}

function fallbackUser(comment: any) {
  return (comment.user as any) ?? {
    id: comment.user_id,
    name: "?",
    initials: "?",
    email: "",
    defaultCurrency: "USD",
  };
}

function commentDate(createdAt: string) {
  return new Date(createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
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
    <GlassSection title="Comments">
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
          <GlassRow
            key={comment.id}
            icon={<AppUserAvatar user={fallbackUser(comment)} size="sm" />}
            title={comment.user?.name ?? "Unknown"}
            subtitle={comment.text}
            end={
              <Typography
                style={{
                  fontSize: 11,
                  color: color.muted,
                  fontFamily: "IBMPlexSans_500Medium",
                }}
              >
                {commentDate(comment.created_at)}
              </Typography>
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
    </GlassSection>
  );
}
