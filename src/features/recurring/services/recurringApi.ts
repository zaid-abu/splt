import { supabase } from "@/services/supabase/client";
import type { RecurringExpense, RecurringOccurrence, RecurringFormValues } from "@/types";
import {
  mapRecurringExpense,
  mapRecurringOccurrence,
  toRecurringExpenseInsert,
  toRecurringExpenseUpdate,
} from "@/services/api/mappers";
import type { Tables } from "@/services/supabase/database.types";

type DbRecurringExpense = Tables<"recurring_expenses">;
type DbRecurringOccurrence = Tables<"recurring_occurrences">;

const rpc = supabase.rpc as unknown as (
  name: string,
  params?: Record<string, unknown>
) => Promise<{ data: unknown; error: Error | null }>;

export const recurringApi = {
  async fetchGroupRecurringExpenses(groupId: string): Promise<RecurringExpense[]> {
    const { data, error } = await supabase
      .from("recurring_expenses")
      .select("*")
      .eq("group_id", groupId)
      .order("created_at", { ascending: false })
      .returns<DbRecurringExpense[]>();

    if (error) throw error;
    return data?.map(mapRecurringExpense) ?? [];
  },
  async fetchRecurringExpenses(userId: string): Promise<RecurringExpense[]> {
    const { data: memberships, error: membershipError } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("user_id", userId);

    if (membershipError) throw membershipError;

    const groupIds = memberships.map((m) => m.group_id);
    if (groupIds.length === 0) return [];

    const { data, error } = await supabase
      .from("recurring_expenses")
      .select("*")
      .in("group_id", groupIds)
      .order("created_at", { ascending: false })
      .returns<DbRecurringExpense[]>();

    if (error) throw error;
    return data?.map(mapRecurringExpense) ?? [];
  },

  async fetchRecurringExpense(id: string): Promise<RecurringExpense> {
    const { data, error } = await supabase
      .from("recurring_expenses")
      .select("*")
      .eq("id", id)
      .single()
      .returns<DbRecurringExpense>();

    if (error) throw error;
    return mapRecurringExpense(data);
  },

  async createRecurringExpense(
    input: RecurringFormValues,
    createdBy: string
  ): Promise<RecurringExpense> {
    const { data, error } = await rpc("create_recurring_expense_v2", {
      p_input: toRecurringExpenseInsert(input, createdBy),
    });
    if (error) throw error;
    return recurringApi.fetchRecurringExpense(data as string);
  },

  async updateRecurringExpense(
    id: string,
    input: Partial<RecurringFormValues>
  ): Promise<RecurringExpense> {
    const { data, error } = await rpc("update_recurring_expense_v2", {
      p_id: id,
      p_input: toRecurringExpenseUpdate(input),
    });
    if (error) throw error;
    return recurringApi.fetchRecurringExpense(data as string);
  },

  async setRecurringStatus(id: string, status: "active" | "paused"): Promise<void> {
    const { error } = await rpc("set_recurring_expense_status_v2", { p_id: id, p_status: status });
    if (error) throw error;
  },

  async deleteRecurringExpense(id: string): Promise<void> {
    const { error } = await rpc("delete_recurring_expense_v2", { p_id: id });
    if (error) throw error;
  },

  async fetchOccurrences(id: string): Promise<RecurringOccurrence[]> {
    const { data, error } = await supabase
      .from("recurring_occurrences")
      .select("*")
      .eq("recurring_expense_id", id)
      .order("scheduled_for", { ascending: true })
      .returns<DbRecurringOccurrence[]>();

    if (error) throw error;
    return data?.map(mapRecurringOccurrence) ?? [];
  },

  async reviewOccurrence(occurrenceId: string, action: "generate" | "skip"): Promise<void> {
    const { error } = await rpc("review_recurring_occurrence_v2", {
      p_occurrence_id: occurrenceId,
      p_action: action,
    });
    if (error) throw error;
  },
};
