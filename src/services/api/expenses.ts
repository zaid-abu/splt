import { supabase } from "@/services/supabase/client";
import type { Expense } from "@/types";
import {
  mapExpense,
  toExpenseInsert,
  toExpenseSplitInsert,
  toExpenseUpdate,
  type ExpenseRow,
} from "./mappers";

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
    const { data, error } = await supabase
      .from("expenses")
      .select("*, paidByUser:users!paid_by(*), splits:expense_splits!inner(*, user:users(*))")
      .eq("expense_splits.user_id", userId)
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
    
    // 1. Insert core expense
    const { data: expData, error: expError } = await supabase
      .from("expenses")
      .insert(toExpenseInsert(coreData))
      .select()
      .single();

    if (expError) throw expError;

    // 2. Insert splits if provided
    if (splits && splits.length > 0) {
      const splitsToInsert = splits.map((split) => toExpenseSplitInsert(expData.id, split));
      
      const { error: splitError } = await supabase
        .from("expense_splits")
        .insert(splitsToInsert);
        
      if (splitError) throw splitError;
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

      if (expError) throw expError;
    }

    // 2. Update splits if provided (simplified as delete and recreate)
    if (splits) {
      await supabase.from("expense_splits").delete().eq("expense_id", expenseId);
      
      if (splits.length > 0) {
        const splitsToInsert = splits.map((split) => toExpenseSplitInsert(expenseId, split));
        
        const { error: splitError } = await supabase
          .from("expense_splits")
          .insert(splitsToInsert);
          
        if (splitError) throw splitError;
      }
    }

    // 3. Return updated expense
    return await this.fetchExpense(expenseId);
  },

  async deleteExpense(expenseId: string): Promise<void> {
    const { error } = await supabase.from("expenses").delete().eq("id", expenseId);
    if (error) throw error;
  },
};
