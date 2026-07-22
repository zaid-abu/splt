import { supabase } from "@/services/supabase/client";
import type { Expense } from "@/types";
import { mapExpense, type ExpenseRow } from "@/services/api/mappers";
import type { ExpenseMutationInput, ReceiptMimeType } from "@/features/money/types";

const expenseSelect = "*, paidByUser:users!paid_by(*), splits:expense_splits(*, user:users(*))";

const ALLOWED_MIME_TYPES: ReceiptMimeType[] = [
  "image/jpeg",
  "image/png",
  "image/heic",
  "application/pdf",
];
const MAX_RECEIPT_BYTES = 10_485_760;

function toSplitsJson(splits: ExpenseMutationInput["splits"]) {
  return splits.map((s) => ({
    // Keep this payload aligned with the JSON contract consumed by the
    // create/update expense RPCs. Database column names are snake_case, but
    // the RPC receives the domain-shaped camelCase object.
    userId: s.userId,
    amountMinor: s.amountMinor,
    percentageUnits: s.percentageUnits ?? null,
    shareUnits: s.shareUnits ?? null,
    position: s.position,
  }));
}

function extractRpcError(error: unknown): never {
  if (error instanceof Error && /^BALANCE_CHANGED:(\d+)$/.test(error.message)) {
    const match = error.message.match(/^BALANCE_CHANGED:(\d+)$/)!;
    throw { code: "balance-changed", currentMinor: parseInt(match[1], 10) };
  }
  throw error;
}

function getGroupAndFriendship(context: ExpenseMutationInput["context"]) {
  if (context.type === "group") {
    return { groupId: context.groupId, friendshipId: null };
  }
  return { groupId: null, friendshipId: context.friendshipId };
}

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
    const { data: splitsData, error: splitsError } = await supabase
      .from("expense_splits")
      .select("expense_id")
      .eq("user_id", userId);

    if (splitsError) throw splitsError;

    if (!splitsData || splitsData.length === 0) return [];

    const expenseIds = splitsData.map((s) => s.expense_id);

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

  async createExpense(input: ExpenseMutationInput): Promise<Expense> {
    const { groupId, friendshipId } = getGroupAndFriendship(input.context);

    const { data, error } = await supabase.rpc("create_expense_v2", {
      p_client_operation_id: input.clientOperationId,
      p_group_id: groupId as any,
      p_friendship_id: friendshipId as any,
      p_title: input.title,
      p_amount_minor: input.amountMinor,
      p_currency: input.currency,
      p_category: input.category,
      p_paid_by: input.paidBy,
      p_split_method: input.splitMethod,
      p_date: input.date.toISOString(),
      p_notes: input.notes ?? "",
      p_receipt_key: (input.receiptKey || null) as any,
      p_splits: toSplitsJson(input.splits),
    });

    if (error) extractRpcError(error);
    return this.fetchExpense(data);
  },

  async updateExpense(
    expenseId: string,
    input: Omit<ExpenseMutationInput, "clientOperationId" | "context">
  ): Promise<Expense> {
    const { data, error } = await supabase.rpc("update_expense_v2", {
      p_expense_id: expenseId,
      p_title: input.title,
      p_amount_minor: input.amountMinor,
      p_currency: input.currency,
      p_category: input.category,
      p_paid_by: input.paidBy,
      p_split_method: input.splitMethod,
      p_date: input.date.toISOString(),
      p_notes: input.notes ?? "",
      p_receipt_key: (input.receiptKey || null) as any,
      p_splits: toSplitsJson(input.splits),
    });

    if (error) extractRpcError(error);
    return this.fetchExpense(data);
  },

  async deleteExpense(expenseId: string): Promise<void> {
    const { error } = await supabase.rpc("delete_expense_v2", {
      p_expense_id: expenseId,
    });
    if (error) throw error;
  },

  async uploadStagedReceipt(input: {
    operationId: string;
    uri: string;
    mimeType: ReceiptMimeType;
  }): Promise<string> {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) throw authError ?? new Error("Not authenticated");

    const { operationId, uri, mimeType } = input;

    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      throw new Error(`Unsupported MIME type: ${mimeType}`);
    }

    const response = await fetch(uri);
    const blob = await response.blob();

    if (blob.size > MAX_RECEIPT_BYTES) {
      throw new Error(`File too large (max 10 MB)`);
    }

    const key = `staging/${user.id}/${operationId}/receipt`;

    const { error: regError } = await supabase.rpc("register_receipt_upload", {
      p_client_operation_id: operationId,
      p_object_key: key,
      p_mime_type: mimeType,
      p_size_bytes: blob.size,
    });

    if (regError) throw regError;

    const { error: uploadError } = await supabase.storage
      .from("expense-receipts")
      .upload(key, blob, { contentType: mimeType, upsert: true });

    if (uploadError) {
      await supabase.storage
        .from("expense-receipts")
        .remove([key])
        .catch(() => {});
      throw uploadError;
    }

    return key;
  },

  async removeStagedReceipt(key: string): Promise<void> {
    const { error } = await supabase.storage.from("expense-receipts").remove([key]);
    if (error) throw error;
  },

  async createReceiptSignedUrl(_expenseId: string, key: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from("expense-receipts")
      .createSignedUrl(key, 300);
    if (error) throw error;
    return data.signedUrl;
  },

  async registerReceiptUpload(input: {
    operationId: string;
    objectKey: string;
    mimeType: ReceiptMimeType;
    sizeBytes: number;
  }): Promise<string> {
    const { data, error } = await supabase.rpc("register_receipt_upload", {
      p_client_operation_id: input.operationId,
      p_object_key: input.objectKey,
      p_mime_type: input.mimeType,
      p_size_bytes: input.sizeBytes,
    });
    if (error) throw error;
    return data;
  },
};
