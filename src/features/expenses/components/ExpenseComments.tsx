import type { JSX } from "react";
import { useState } from "react";
import { View, Pressable, TextInput, Text, ActivityIndicator } from "react-native";
import * as Haptics from "expo-haptics";
import * as icons from "lucide-react-native";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { ErrorState } from "@/components/ui/ErrorState";
import { useUI } from "@/components/ui";
import { MoneyRow, Eyebrow, useCoralColors } from "@/components/coral";
import { useAppToast } from "@/hooks/useAppToast";
import {
  useExpenseComments,
  useAddComment,
  useDeleteComment,
} from "@/features/expenses/queries/useComments";

interface ExpenseCommentsProps {
  expenseId: string;
  currentUserId: string;
  groupCreatedBy?: string;
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

export function ExpenseComments({
  expenseId,
  currentUserId,
  groupCreatedBy,
}: ExpenseCommentsProps): JSX.Element {
  const { color, radius } = useUI();
  const coral = useCoralColors();
  const { toast } = useAppToast();
  const { data: comments = [], isLoading, isError, refetch } = useExpenseComments(expenseId);
  const { mutateAsync: addComment } = useAddComment();
  const { mutateAsync: deleteComment } = useDeleteComment();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    const currentText = text;
    try {
      await addComment({ expenseId, userId: currentUserId, text: currentText.trim() });
      setText("");
    } catch {
      setText(currentText);
      toast.show({
        label: "Failed to add comment",
        description: "Please try again.",
        variant: "danger",
        placement: "top",
      });
    }
    setSending(false);
  };

  const handleDelete = async (commentId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDeletingId(commentId);
    try {
      await deleteComment({ commentId, expenseId });
    } catch {
      /* handled by query client */
    }
    setDeletingId(null);
  };

  const canDeleteComment = (commentUserId: string) => {
    if (commentUserId === currentUserId) return true;
    if (groupCreatedBy && currentUserId === groupCreatedBy) return true;
    return false;
  };

  if (isLoading) {
    return (
      <View style={{ marginBottom: 28 }}>
        <Eyebrow style={{ marginTop: 0 }}>Comments</Eyebrow>
        <View
          style={{
            backgroundColor: coral.surface, borderRadius: 16, borderWidth: 1,
            borderColor: coral.border, paddingVertical: 24, alignItems: "center",
          }}
        >
          <ActivityIndicator size="small" color={coral.muted} />
        </View>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={{ marginBottom: 28 }}>
        <Eyebrow style={{ marginTop: 0 }}>Comments</Eyebrow>
        <View
          style={{
            backgroundColor: coral.surface, borderRadius: 16, borderWidth: 1,
            borderColor: coral.border, paddingVertical: 24, alignItems: "center",
          }}
        >
          <ErrorState onRetry={() => refetch()} />
        </View>
      </View>
    );
  }

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
        {comments.length === 0 ? (
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
          comments.map((comment) => {
            const isDeleting = deletingId === comment.id;
            const showDelete = !isDeleting && canDeleteComment(comment.userId);

            return (
              <MoneyRow
                key={comment.id}
                avatar={<AppUserAvatar user={fallbackUser(comment)} size="sm" />}
                title={comment.user?.name ?? "Unknown"}
                subtitle={comment.text}
                amount=""
                rightElement={
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Text
                      style={{
                        fontSize: 11,
                        color: color.muted,
                        fontFamily: "InstrumentSans_500Medium",
                      }}
                    >
                      {commentDate(comment.created_at)}
                    </Text>
                    {showDelete && (
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => handleDelete(comment.id)}
                        hitSlop={8}
                        style={({ pressed }) => ({
                          opacity: pressed ? 0.6 : 1,
                          padding: 4,
                        })}
                      >
                        <icons.Trash2 size={14} color={coral.negative} strokeWidth={1.5} />
                      </Pressable>
                    )}
                    {isDeleting && (
                      <ActivityIndicator size="small" color={coral.muted} />
                    )}
                  </View>
                }
              />
            );
          })
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
            {sending ? (
              <ActivityIndicator size="small" color={color.muted} />
            ) : (
              <icons.Send
                size={16}
                color={text.trim() ? color.textInverse : color.muted}
                strokeWidth={2}
              />
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}
