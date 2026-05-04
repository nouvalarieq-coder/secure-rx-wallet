import { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package, ExternalLink } from "lucide-react";
import { formatIDR } from "@/lib/format";
import { explorerUrl } from "@/lib/solana";
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
