import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const RPC = "https://api.devnet.solana.com";
const MERCHANT = "8FE27ioQh3T7o22QsYVT5Re8NBHaBDLqGSgxz1LU3uhM";
const LAMPORTS_PER_SOL = 1_000_000_000;

async function rpc(method: string, params: unknown[]) {
  const res = await fetch(RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message);
  return json.result;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { signature, expectedAmountSol, orderId } = await req.json();
    if (!signature || typeof signature !== "string") {
      return new Response(JSON.stringify({ error: "signature required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the parsed transaction from devnet
    const tx = await rpc("getTransaction", [
      signature,
      { encoding: "jsonParsed", maxSupportedTransactionVersion: 0, commitment: "confirmed" },
    ]);

    if (!tx) {
      return new Response(JSON.stringify({ ok: false, status: "not_found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const failed = tx.meta?.err != null;
    // Validate that a SystemProgram transfer to MERCHANT exists with sufficient amount
    let transferredLamports = 0;
    const ixs = tx.transaction?.message?.instructions ?? [];
    for (const ix of ixs) {
      if (ix.program === "system" && ix.parsed?.type === "transfer" && ix.parsed?.info?.destination === MERCHANT) {
        transferredLamports += Number(ix.parsed.info.lamports ?? 0);
      }
    }
    const amountSol = transferredLamports / LAMPORTS_PER_SOL;
    const expected = Number(expectedAmountSol ?? 0);
    const amountOk = expected > 0 ? amountSol + 1e-6 >= expected : transferredLamports > 0;
    const verified = !failed && amountOk && transferredLamports > 0;

    // Optionally update order using service-role
    if (orderId) {
      const admin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      await admin.from("orders").update({
        payment_status: verified ? "success" : (failed ? "failed" : "pending"),
        tx_signature: signature,
      }).eq("id", orderId);
    }

    return new Response(JSON.stringify({
      ok: verified,
      status: verified ? "success" : (failed ? "failed" : "pending"),
      amountSol,
      slot: tx.slot,
      merchant: MERCHANT,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
