import { createClient } from "jsr:@supabase/supabase-js@2"

interface ReceiptUpload {
  id: string
  object_key: string
  status: string
}

Deno.serve(async (_req: Request) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({ error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  // Fetch staged rows older than 24 hours and all cleanup_pending rows
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { data: rows, error: fetchError } = await supabase
    .from("receipt_uploads")
    .select("id, object_key, status")
    .or(
      `and(status.eq.staged,created_at.lt.${cutoff}),status.eq.cleanup_pending`,
    )

  if (fetchError) {
    console.error("Fetch error:", fetchError)
    return new Response(
      JSON.stringify({ error: fetchError.message }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }

  if (!rows || rows.length === 0) {
    return new Response(
      JSON.stringify({ cleaned: 0 }),
      { headers: { "Content-Type": "application/json" } },
    )
  }

  const objectKeys = rows.map((r: ReceiptUpload) => r.object_key)
  const ids = rows.map((r: ReceiptUpload) => r.id)

  // Remove objects from storage
  const { data: removeData, error: removeError } = await supabase.storage
    .from("expense-receipts")
    .remove(objectKeys)

  if (removeError) {
    console.error("Storage remove error:", removeError)
    return new Response(
      JSON.stringify({ error: removeError.message }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }

  // Only mark rows as cleaned if storage API confirms success
  const successfullyRemovedKeys = new Set(
    (removeData ?? []).map((item: { bucket_id: string; name: string }) => item.name),
  )

  const cleanedIds = rows
    .filter((r: ReceiptUpload) => successfullyRemovedKeys.has(r.object_key))
    .map((r: ReceiptUpload) => r.id)

  const { error: updateError } = await supabase
    .from("receipt_uploads")
    .update({ status: "cleaned", cleaned_at: new Date().toISOString() })
    .in("id", cleanedIds)

  if (updateError) {
    console.error("Update error:", updateError)
    return new Response(
      JSON.stringify({ error: updateError.message }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }

  return new Response(
    JSON.stringify({
      cleaned: cleanedIds.length,
      total_fetched: rows.length,
      failed_to_remove: rows.length - cleanedIds.length,
    }),
    { headers: { "Content-Type": "application/json" } },
  )
})
