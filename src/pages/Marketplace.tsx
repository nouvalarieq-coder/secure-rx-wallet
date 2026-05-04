import { useEffect, useMemo, useState } from "react";
import Layout from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Loader2, Plus, Package } from "lucide-react";
import { Link } from "react-router-dom";
import { formatIDR } from "@/lib/format";
import { useCart } from "@/store/cart";
import { toast } from "sonner";

type Medicine = {
  id: string; name: string; description: string | null; price: number; stock: number;
  category: string | null; bpom_number: string | null; image_url: string | null;
  manufacturer: string | null; requires_prescription: boolean;
};

export default function Marketplace() {
  const [items, setItems] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");
  const add = useCart((s) => s.add);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("medicines")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (error) toast.error(error.message);
      setItems((data ?? []) as Medicine[]);
      setLoading(false);
    })();
  }, []);

  const categories = useMemo(
    () => Array.from(new Set(items.map((i) => i.category).filter(Boolean) as string[])),
    [items]
  );

  const filtered = items.filter((i) => {
    const matchQ = q ? (i.name.toLowerCase().includes(q.toLowerCase()) || i.bpom_number?.toLowerCase().includes(q.toLowerCase())) : true;
    const matchC = cat === "all" ? true : i.category === cat;
    return matchQ && matchC;
  });

  return (
    <Layout>
      <div className="container py-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold">Marketplace Obat</h1>
            <p className="text-muted-foreground mt-1">{items.length} produk tersedia, semua bersertifikat BPOM.</p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari obat / BPOM…" className="pl-10" />
            </div>
            <Select value={cat} onValueChange={setCat}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Kategori" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">Tidak ada obat ditemukan.</div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((m) => (
              <Card key={m.id} className="group overflow-hidden shadow-soft hover:shadow-md-soft transition-base bg-gradient-card border-border/60">
                <Link to={`/product/${m.id}`} className="block aspect-[4/3] bg-secondary/40 grid place-items-center overflow-hidden">
                  {m.image_url ? (
                    <img src={m.image_url} alt={m.name} className="h-full w-full object-cover group-hover:scale-105 transition-base" loading="lazy" />
                  ) : (
                    <Package className="h-12 w-12 text-muted-foreground/40" />
                  )}
                </Link>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <Link to={`/product/${m.id}`} className="font-semibold leading-tight hover:text-primary transition-base line-clamp-2">{m.name}</Link>
                    {m.requires_prescription && <Badge variant="outline" className="text-warning border-warning/40 shrink-0">Resep</Badge>}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">{m.category} · BPOM {m.bpom_number}</div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="font-display text-lg font-bold text-primary">{formatIDR(Number(m.price))}</div>
                    <Button size="sm" onClick={() => { add({ id: m.id, name: m.name, price: Number(m.price), image_url: m.image_url }); toast.success(`${m.name} ditambahkan`); }} disabled={m.stock <= 0}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">Stok: {m.stock}</div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
