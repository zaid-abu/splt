import { createClient } from "jsr:@supabase/supabase-js@2";

interface ReceiptUpload {
  id: string;
  object_key: string;
}

Deno.serve(async (_req: Request) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({ error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const { data: rows, error: claimError } = await supabase.rpc("claim_receipt_cleanup", {
    p_limit: 50,
  });

  if (claimError) {
    console.error("Claim error:", claimError);
    return new Response(JSON.stringify({ error: claimError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  let cleaned = 0;
  let failed = 0;
  for (const row of (rows ?? []) as ReceiptUpload[]) {
    const { error: removeError } = await supabase.storage
      .from("expense-receipts")
      .remove([row.object_key]);

    const success = !removeError;
    const { error: completeError } = await supabase.rpc("complete_receipt_cleanup", {
      p_id: row.id,
      p_success: success,
      p_error: removeError?.message ?? null,
    });

    if (completeError) {
      console.error("Completion error:", completeError);
      failed += 1;
    } else if (success) {
      cleaned += 1;
    } else {
      failed += 1;
    }
  }

  return new Response(
    JSON.stringify({ cleaned, claimed: rows?.length ?? 0, failed_to_remove: failed }),
    { headers: { "Content-Type": "application/json" } }
  );
});
