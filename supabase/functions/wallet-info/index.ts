import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const RPC = "https://api.devnet.solana.com";
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
    const url = new URL(req.url);
    const address = url.searchParams.get("address") ?? (await req.json().catch(() => ({}))).address;
    if (!address || typeof address !== "string" || address.length < 32) {
      return new Response(JSON.stringify({ error: "valid address required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const [balanceRes, sigs] = await Promise.all([
      rpc("getBalance", [address, { commitment: "confirmed" }]),
      rpc("getSignaturesForAddress", [address, { limit: 10 }]),
    ]);

    const lamports = balanceRes?.value ?? 0;
    const sol = lamports / LAMPORTS_PER_SOL;

    const transactions = (sigs ?? []).map((s: any) => ({
      signature: s.signature,
      slot: s.slot,
      blockTime: s.blockTime,
      err: s.err,
      memo: s.memo,
      confirmationStatus: s.confirmationStatus,
    }));

    return new Response(JSON.stringify({
      address,
      cluster: "devnet",
      balanceSol: sol,
      balanceLamports: lamports,
      transactions,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
