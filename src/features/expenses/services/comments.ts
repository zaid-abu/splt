import { supabase } from "@/services/supabase/client";
import type { ExpenseComment, User } from "@/types";
import type { Database } from "@/services/supabase/database.types";

type DbExpenseComment = Database["public"]["Tables"]["expense_comments"]["Row"];

export interface ExpenseCommentWithUser extends ExpenseComment {
  user?: Pick<User, "id" | "name" | "initials">;
}

function mapExpenseCommentWithUser(
  row: DbExpenseComment & { user?: Pick<User, "id" | "name" | "initials"> | null }
): ExpenseCommentWithUser {
  return {
    id: row.id,
    expenseId: row.expense_id,
    userId: row.user_id,
    text: row.text,
    createdAt: new Date(row.created_at),
    user: row.user ?? undefined,
  };
}

export const CommentsService = {
  async fetchComments(expenseId: string): Promise<ExpenseCommentWithUser[]> {
    const { data, error } = await supabase
      .from("expense_comments")
      .select("*, user:users(id, name, initials)")
      .eq("expense_id", expenseId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return (data ?? []).map(mapExpenseCommentWithUser);
  },

  async addComment(expenseId: string, text: string): Promise<ExpenseCommentWithUser> {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) throw authError ?? new Error("Not authenticated");

    const { data, error } = await supabase
      .from("expense_comments")
      .insert({
        expense_id: expenseId,
        user_id: user.id,
        text,
      })
      .select("*, user:users(id, name, initials)")
      .single();

    if (error) throw error;
    return mapExpenseCommentWithUser(data);
  },

  async deleteComment(commentId: string): Promise<void> {
    const { error } = await supabase.from("expense_comments").delete().eq("id", commentId);

    if (error) throw error;
  },
};
