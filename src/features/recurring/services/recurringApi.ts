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

export const recurringApi = {
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
    const { data, error } = await supabase
      .from("recurring_expenses")
      .insert(toRecurringExpenseInsert(input, createdBy))
      .select()
      .single()
      .returns<DbRecurringExpense>();

    if (error) throw error;
    return mapRecurringExpense(data);
  },

  async updateRecurringExpense(
    id: string,
    input: Partial<RecurringFormValues>
  ): Promise<RecurringExpense> {
    const { data, error } = await supabase
      .from("recurring_expenses")
      .update(toRecurringExpenseUpdate(input))
      .eq("id", id)
      .select()
      .single()
      .returns<DbRecurringExpense>();

    if (error) throw error;
    return mapRecurringExpense(data);
  },

  async setRecurringStatus(id: string, status: "active" | "paused"): Promise<void> {
    const { error } = await supabase.from("recurring_expenses").update({ status }).eq("id", id);

    if (error) throw error;
  },

  async deleteRecurringExpense(id: string): Promise<void> {
    const { error } = await supabase.from("recurring_expenses").delete().eq("id", id);

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
    const { data: occurrence, error: fetchError } = await supabase
      .from("recurring_occurrences")
      .select("id, recurring_expense_id, scheduled_for")
      .eq("id", occurrenceId)
      .single();

    if (fetchError) throw fetchError;

    const { error } = await supabase
      .from("recurring_occurrences")
      .update({ status: action === "generate" ? "generated" : "skipped" })
      .eq("id", occurrenceId);

    if (error) throw error;

    const { data: recurring, error: recError } = await supabase
      .from("recurring_expenses")
      .select("*")
      .eq("id", occurrence.recurring_expense_id)
      .single();

    if (recError) throw recError;

    const { data: nextDate, error: nextError } = await supabase.rpc("next_recurring_date", {
      p_frequency: recurring.frequency,
      p_interval: recurring.interval_value,
      p_current_date: occurrence.scheduled_for,
      p_day_of_week: recurring.day_of_week ?? undefined,
      p_day_of_month: recurring.day_of_month ?? undefined,
    });

    if (nextError) throw nextError;

    await supabase
      .from("recurring_expenses")
      .update({ next_run_date: nextDate })
      .eq("id", occurrence.recurring_expense_id);
  },
};
