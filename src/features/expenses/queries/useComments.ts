import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CommentsService } from "@/features/expenses/services/comments";

export function useExpenseComments(expenseId: string) {
  return useQuery({
    queryKey: ["expense-comments", expenseId],
    queryFn: () => CommentsService.fetchComments(expenseId),
    enabled: !!expenseId,
  });
}

export function useAddComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ expenseId, userId, text }: { expenseId: string; userId: string; text: string }) =>
      CommentsService.addComment(expenseId, userId, text),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["expense-comments", variables.expenseId] });
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commentId, expenseId }: { commentId: string; expenseId: string }) =>
      CommentsService.deleteComment(commentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["expense-comments", variables.expenseId] });
    },
  });
}
