import { supabase } from "@/services/supabase/client";
import type { Expense } from "@/types";
import {
  mapExpense,
  toExpenseInsert,
  toExpenseSplitInsert,
  toExpenseUpdate,
  type ExpenseRow,
} from "@/services/api/mappers";

const expenseSelect = "*, paidByUser:users!paid_by(*), splits:expense_splits(*, user:users(*))";

export const expensesApi = {
  async fetchGroupExpenses(groupId: string): Promise<Expense[]> {
    const { data, error } = await supabase
      .from("expenses")
      .select(expenseSelect)
      .eq("group_id", groupId)
      .order("date", { ascending: false })
      .returns<ExpenseRow[]>();

    if (error) throw error;
    return data?.map(mapExpense) ?? [];
  },

  async fetchUserExpenses(userId: string): Promise<Expense[]> {
    // 1. Get all expense IDs the user is part of
    const { data: splitsData, error: splitsError } = await supabase
      .from("expense_splits")
      .select("expense_id")
      .eq("user_id", userId);

    if (splitsError) throw splitsError;

    if (!splitsData || splitsData.length === 0) return [];

    const expenseIds = splitsData.map((s) => s.expense_id);

    // 2. Fetch those expenses with ALL their splits
    const { data, error } = await supabase
      .from("expenses")
      .select(expenseSelect)
      .in("id", expenseIds)
      .order("date", { ascending: false })
      .returns<ExpenseRow[]>();

    if (error) throw error;
    return data?.map(mapExpense) ?? [];
  },

  async fetchExpense(expenseId: string): Promise<Expense> {
    const { data, error } = await supabase
      .from("expenses")
      .select(expenseSelect)
      .eq("id", expenseId)
      .single()
      .returns<ExpenseRow>();

    if (error) throw error;
    return mapExpense(data);
  },

  async addExpense(expenseData: Partial<Expense>): Promise<Expense> {
    const { splits, ...coreData } = expenseData;

    // Insert core expense with minimal select (no joins — RLS may block reading
    // a row with paid_by !== auth.uid() before splits exist for the policy check)
    const { data: expData, error: expError } = await supabase
      .from("expenses")
      .insert(toExpenseInsert(coreData))
      .select()
      .single();

    if (expError) throw expError;

    // Insert splits if provided
    if (splits && splits.length > 0) {
      const splitsToInsert = splits.map((split) => toExpenseSplitInsert(expData.id, split));
      const { error: splitError } = await supabase.from("expense_splits").insert(splitsToInsert);
      if (splitError) throw splitError;
    }

    // Fetch full expense with joins (splits now exist, so RLS can find them)
    return await this.fetchExpense(expData.id);
  },

  async updateExpense(expenseId: string, updates: Partial<Expense>): Promise<Expense> {
    const { splits, ...coreData } = updates;

    // Update core expense and return with joins
    if (Object.keys(coreData).length > 0) {
      const { data: updatedData, error: expError } = await supabase
        .from("expenses")
        .update(toExpenseUpdate(coreData))
        .eq("id", expenseId)
        .select(expenseSelect)
        .single()
        .returns<ExpenseRow>();

      if (expError) throw expError;

      // If no splits to update, return immediately
      if (!splits) return mapExpense(updatedData);
    }

    // Update splits if provided (delete and recreate)
    if (splits) {
      await supabase.from("expense_splits").delete().eq("expense_id", expenseId);
      if (splits.length > 0) {
        const splitsToInsert = splits.map((split) => toExpenseSplitInsert(expenseId, split));
        const { error: splitError } = await supabase.from("expense_splits").insert(splitsToInsert);
        if (splitError) throw splitError;
      }
    }

    // Re-fetch to get joined split data
    return await this.fetchExpense(expenseId);
  },

  async deleteExpense(expenseId: string): Promise<void> {
    const { error } = await supabase.from("expenses").delete().eq("id", expenseId);
    if (error) throw error;
  },
};
