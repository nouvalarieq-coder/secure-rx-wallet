import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Loader2, Package, ShieldCheck, Building2, ChevronLeft, ShoppingCart } from "lucide-react";
import { formatIDR } from "@/lib/format";
import { useCart } from "@/store/cart";
import { toast } from "sonner";

export default function ProductDetail() {
  const { id } = useParams();
  const [med, setMed] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const add = useCart((s) => s.add);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("medicines").select("*").eq("id", id).maybeSingle();
      if (error) toast.error(error.message);
      setMed(data);
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <Layout><div className="grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div></Layout>;
  if (!med) return <Layout><div className="container py-20 text-center">Produk tidak ditemukan. <Link to="/marketplace" className="text-primary">Kembali</Link></div></Layout>;

  return (
    <Layout>
      <div className="container py-8">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4"><ChevronLeft className="h-4 w-4 mr-1" />Kembali</Button>
        <div className="grid lg:grid-cols-2 gap-10">
          <Card className="aspect-square bg-secondary/40 grid place-items-center overflow-hidden">
            {med.image_url ? (
              <img src={med.image_url} alt={med.name} className="h-full w-full object-cover" />
            ) : (
              <Package className="h-24 w-24 text-muted-foreground/40" />
            )}
          </Card>
          <div>
            {med.category && <Badge variant="secondary">{med.category}</Badge>}
            <h1 className="mt-3 font-display text-3xl md:text-4xl font-bold">{med.name}</h1>
            <div className="mt-4 font-display text-3xl font-bold text-primary">{formatIDR(Number(med.price))}</div>

            <p className="mt-6 text-muted-foreground leading-relaxed">{med.description}</p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4 text-success" />BPOM</div>
                <div className="mt-1 font-mono text-sm font-semibold">{med.bpom_number}</div>
              </div>
              <div className="rounded-xl border border-border p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground"><Building2 className="h-4 w-4" />Produsen</div>
                <div className="mt-1 text-sm font-semibold">{med.manufacturer}</div>
              </div>
            </div>

            {med.requires_prescription && (
              <div className="mt-4 rounded-xl bg-warning/10 border border-warning/30 p-4 text-sm text-warning-foreground">
                <strong className="text-warning">Resep dokter diperlukan.</strong>{" "}
                <span className="text-muted-foreground">Mohon unggah resep saat checkout.</span>
              </div>
            )}

            <div className="mt-6 text-sm text-muted-foreground">Stok tersedia: <strong className="text-foreground">{med.stock}</strong></div>

            <div className="mt-6 flex items-center gap-3">
              <div className="flex items-center rounded-xl border border-border">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-2 hover:bg-secondary">−</button>
                <div className="px-4 font-semibold">{qty}</div>
                <button onClick={() => setQty(Math.min(med.stock, qty + 1))} className="px-3 py-2 hover:bg-secondary">+</button>
              </div>
              <Button
                size="lg" className="flex-1 bg-gradient-primary"
                disabled={med.stock <= 0}
                onClick={() => {
                  add({ id: med.id, name: med.name, price: Number(med.price), image_url: med.image_url }, qty);
                  toast.success(`${qty}× ${med.name} ditambahkan ke keranjang`);
                }}
              >
                <ShoppingCart className="h-4 w-4 mr-2" /> Tambah ke Keranjang
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
