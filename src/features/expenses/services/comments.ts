import { supabase } from "@/services/supabase/client";
import type { User } from "@/types";

export interface ExpenseComment {
  id: string;
  expense_id: string;
  user_id: string;
  text: string;
  created_at: string;
  user?: Pick<User, "id" | "name" | "initials">;
}

export const CommentsService = {
  async fetchComments(expenseId: string): Promise<ExpenseComment[]> {
    const { data, error } = await (supabase as any)
      .from("expense_comments")
      .select("*, user:users(id, name, initials)")
      .eq("expense_id", expenseId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return (data ?? []) as unknown as ExpenseComment[];
  },

  async addComment(expenseId: string, userId: string, text: string): Promise<ExpenseComment> {
    const { data, error } = await (supabase as any)
      .from("expense_comments")
      .insert({ expense_id: expenseId, user_id: userId, text })
      .select("*, user:users(id, name, initials)")
      .single();

    if (error) throw error;
    return data as unknown as ExpenseComment;
  },

  async deleteComment(commentId: string): Promise<void> {
    const { error } = await (supabase as any).from("expense_comments").delete().eq("id", commentId);
    if (error) throw error;
  },
};
