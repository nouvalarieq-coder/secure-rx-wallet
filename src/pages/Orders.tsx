import { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Package, ExternalLink, Wallet, RefreshCw } from "lucide-react";
import { formatIDR, shortAddr } from "@/lib/format";
import { explorerUrl } from "@/lib/solana";
import { useWallet } from "@/contexts/WalletContext";
import { Navigate } from "react-router-dom";

export default function Orders() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setOrders(data ?? []);
      setLoading(false);

      const channel = supabase
        .channel("orders-rt")
        .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `user_id=eq.${user.id}` }, async () => {
          const { data } = await supabase.from("orders").select("*, order_items(*)").eq("user_id", user.id).order("created_at", { ascending: false });
          setOrders(data ?? []);
        })
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    })();
  }, [user]);

  if (authLoading) return <Layout><div className="grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div></Layout>;
  if (!user) return <Navigate to="/auth" replace />;

  const statusBadge = (s: string) => {
    if (s === "success") return <Badge className="bg-success text-success-foreground">Sukses</Badge>;
    if (s === "pending") return <Badge className="bg-warning text-warning-foreground">Pending</Badge>;
    return <Badge variant="destructive">Gagal</Badge>;
  };

  return (
    <Layout>
      <div className="container py-10">
        <h1 className="font-display text-3xl font-bold">Riwayat Transaksi</h1>
        <p className="text-muted-foreground mt-1">Semua pesanan Anda, fiat maupun crypto.</p>

        <WalletPanel />


        {loading ? (
          <div className="grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Package className="h-14 w-14 mx-auto opacity-30" />
            <p className="mt-3">Belum ada pesanan.</p>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {orders.map((o) => (
              <Card key={o.id} className="p-5 shadow-soft">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-xs text-muted-foreground">Pesanan #{o.id.slice(0, 8)}</div>
                    <div className="text-sm">{new Date(o.created_at).toLocaleString("id-ID")}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">{o.payment_method}</Badge>
                    {statusBadge(o.payment_status)}
                  </div>
                </div>

                <div className="mt-4 grid gap-2 text-sm">
                  {o.order_items?.map((it: any) => (
                    <div key={it.id} className="flex justify-between">
                      <span className="text-muted-foreground">{it.quantity}× {it.medicine_name}</span>
                      <span>{formatIDR(Number(it.unit_price) * it.quantity)}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                  <div className="font-display text-lg font-bold text-primary">{formatIDR(Number(o.total_amount))}</div>
                  {o.tx_signature && (
                    <a href={explorerUrl(o.tx_signature)} target="_blank" rel="noreferrer" className="text-xs text-primary inline-flex items-center gap-1 hover:underline font-mono">
                      {o.tx_signature.slice(0, 10)}…<ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

function WalletPanel() {
  const { address, connect, connecting } = useWallet();
  const [info, setInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    if (!address) return;
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("wallet-info", { body: { address } });
    if (!error) setInfo(data);
    setLoading(false);
  };

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [address]);

  if (!address) {
    return (
      <Card className="mt-6 p-5 bg-gradient-card">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2 font-display font-bold"><Wallet className="h-5 w-5 text-primary" /> Wallet Solana</div>
            <p className="text-xs text-muted-foreground mt-1">Hubungkan wallet untuk melihat saldo dan riwayat on-chain.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={connecting} onClick={() => connect("phantom")}>Phantom</Button>
            <Button variant="outline" size="sm" disabled={connecting} onClick={() => connect("solflare")}>Solflare</Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="mt-6 p-5 bg-gradient-card">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 font-display font-bold"><Wallet className="h-5 w-5 text-primary" /> Wallet Solana <Badge variant="outline" className="border-success/40 text-success">Devnet</Badge></div>
          <div className="font-mono text-xs text-muted-foreground mt-1">{shortAddr(address, 6)}</div>
          <div className="mt-2 font-display text-2xl font-bold text-primary">
            {info ? `${info.balanceSol?.toFixed(6)} SOL` : <Loader2 className="h-5 w-5 animate-spin" />}
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>
      {info?.transactions?.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="text-xs font-semibold text-muted-foreground mb-2">10 Transaksi Terakhir</div>
          <div className="space-y-1">
            {info.transactions.map((t: any) => (
              <a key={t.signature} href={explorerUrl(t.signature)} target="_blank" rel="noreferrer" className="flex items-center justify-between text-xs font-mono hover:bg-secondary/40 rounded px-2 py-1.5 transition-base">
                <span className="truncate">{t.signature.slice(0, 16)}…</span>
                <span className="flex items-center gap-2 text-muted-foreground">
                  {t.err ? <Badge variant="destructive" className="text-[10px]">err</Badge> : <Badge className="bg-success text-success-foreground text-[10px]">{t.confirmationStatus ?? "ok"}</Badge>}
                  {t.blockTime ? new Date(t.blockTime * 1000).toLocaleDateString("id-ID") : ""}
                  <ExternalLink className="h-3 w-3" />
                </span>
              </a>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
