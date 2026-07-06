import { supabase } from "@/services/supabase/client";
import type { Expense } from "@/types";
import {
  mapExpense,
  toExpenseInsert,
  toExpenseSplitInsert,
  toExpenseUpdate,
  type ExpenseRow,
} from "@/services/api/mappers";
import { handleSupabaseError } from "@/services/api/errors";

const expenseSelect = "*, paidByUser:users!paid_by(*), splits:expense_splits(*, user:users(*))";

export const expensesApi = {
  async fetchGroupExpenses(groupId: string, page: number = 0, limit: number = 20): Promise<Expense[]> {
    const offset = page * limit;
    const { data, error } = await supabase
      .from("expenses")
      .select(expenseSelect)
      .eq("group_id", groupId)
      .order("date", { ascending: false })
      .range(offset, offset + limit - 1)
      .returns<ExpenseRow[]>();

    if (error) handleSupabaseError(error, "Failed to fetch group expenses");
    return data?.map(mapExpense) ?? [];
  },

  async fetchUserExpenses(userId: string, page: number = 0, limit: number = 20): Promise<Expense[]> {
    const offset = page * limit;
    // 1. Get all expense IDs the user is part of
    const { data: splitsData, error: splitsError } = await supabase
      .from("expense_splits")
      .select("expense_id")
      .eq("user_id", userId);

    if (splitsError) handleSupabaseError(splitsError, "Failed to fetch user expense splits");

    if (!splitsData || splitsData.length === 0) return [];

    const expenseIds = splitsData.map((s) => s.expense_id);

    // 2. Fetch those expenses with ALL their splits
    const { data, error } = await supabase
      .from("expenses")
      .select(expenseSelect)
      .in("id", expenseIds)
      .order("date", { ascending: false })
      .range(offset, offset + limit - 1)
      .returns<ExpenseRow[]>();

    if (error) handleSupabaseError(error, "Failed to fetch group expenses");
    return data?.map(mapExpense) ?? [];
  },

  async fetchExpense(expenseId: string): Promise<Expense> {
    const { data, error } = await supabase
      .from("expenses")
      .select(expenseSelect)
      .eq("id", expenseId)
      .single()
      .returns<ExpenseRow>();

    if (error) handleSupabaseError(error, "Failed to fetch group expenses");
    return mapExpense(data);
  },

  async addExpense(expenseData: Partial<Expense>): Promise<Expense> {
    const { splits, ...coreData } = expenseData;

    // 1. Insert core expense
    const { data: expData, error: expError } = await supabase
      .from("expenses")
      .insert(toExpenseInsert(coreData))
      .select()
      .single();

    if (expError) handleSupabaseError(expError, "Failed to create expense");

    // 2. Insert splits if provided
    if (splits && splits.length > 0) {
      const splitsToInsert = splits.map((split) => toExpenseSplitInsert(expData.id, split));

      const { error: splitError } = await supabase.from("expense_splits").insert(splitsToInsert);

      if (splitError) handleSupabaseError(splitError, "Failed to create expense splits");
    }

    // 3. Return full expense via fetchExpense to get joined data
    return await this.fetchExpense(expData.id);
  },

  async updateExpense(expenseId: string, updates: Partial<Expense>): Promise<Expense> {
    const { splits, ...coreData } = updates;

    // 1. Update core expense
    if (Object.keys(coreData).length > 0) {
      const { error: expError } = await supabase
        .from("expenses")
        .update(toExpenseUpdate(coreData))
        .eq("id", expenseId);

      if (expError) handleSupabaseError(expError, "Failed to update expense");
    }

    // 2. Update splits if provided (simplified as delete and recreate)
    if (splits) {
      await supabase.from("expense_splits").delete().eq("expense_id", expenseId);

      if (splits.length > 0) {
        const splitsToInsert = splits.map((split) => toExpenseSplitInsert(expenseId, split));

        const { error: splitError } = await supabase.from("expense_splits").insert(splitsToInsert);

        if (splitError) handleSupabaseError(splitError, "Failed to update expense splits");
      }
    }

    // 3. Return updated expense
    return await this.fetchExpense(expenseId);
  },

  async deleteExpense(expenseId: string): Promise<void> {
    const { error } = await supabase.from("expenses").delete().eq("id", expenseId);
    if (error) handleSupabaseError(error, "Failed to fetch group expenses");
  },
};
