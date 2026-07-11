import { supabase } from "@/services/supabase/client";

const BUCKET = "receipts";

export async function uploadReceipt(expenseId: string, uri: string): Promise<string> {
  const ext = uri.split(".").pop() ?? "jpg";
  const filePath = `${expenseId}/receipt.${ext}`;

  const response = await fetch(uri);
  const blob = await response.blob();

  const { error } = await supabase.storage.from(BUCKET).upload(filePath, blob, {
    upsert: true,
    contentType: blob.type,
  });

  if (error) throw error;

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
  return urlData.publicUrl;
}

export async function getReceiptUrl(expenseId: string): Promise<string | null> {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(`${expenseId}/receipt`);
  return data.publicUrl ?? null;
}

export async function deleteReceipt(expenseId: string): Promise<void> {
  await supabase.storage.from(BUCKET).remove([`${expenseId}/receipt`]);
}
