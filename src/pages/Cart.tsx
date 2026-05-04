import Layout from "@/components/layout/Layout";
import { useCart } from "@/store/cart";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatIDR } from "@/lib/format";
import { Trash2, Package, ShoppingBag } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export default function Cart() {
  const { items, setQty, remove, total } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground/30" />
          <h1 className="mt-4 font-display text-2xl font-bold">Keranjang kosong</h1>
          <p className="text-muted-foreground mt-1">Yuk mulai belanja obat resmi BPOM.</p>
          <Button asChild className="mt-6"><Link to="/marketplace">Lihat Marketplace</Link></Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-10">
        <h1 className="font-display text-3xl font-bold mb-6">Keranjang</h1>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-3">
            {items.map((it) => (
              <Card key={it.id} className="p-4 flex items-center gap-4">
                <div className="h-20 w-20 rounded-lg bg-secondary grid place-items-center shrink-0 overflow-hidden">
                  {it.image_url ? <img src={it.image_url} alt={it.name} className="h-full w-full object-cover" /> : <Package className="h-8 w-8 text-muted-foreground/40" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{it.name}</div>
                  <div className="text-sm text-primary font-bold">{formatIDR(it.price)}</div>
                </div>
                <div className="flex items-center rounded-lg border border-border">
                  <button onClick={() => setQty(it.id, it.quantity - 1)} className="px-3 py-1 hover:bg-secondary">−</button>
                  <div className="px-3 font-semibold">{it.quantity}</div>
                  <button onClick={() => setQty(it.id, it.quantity + 1)} className="px-3 py-1 hover:bg-secondary">+</button>
                </div>
                <Button variant="ghost" size="icon" onClick={() => remove(it.id)}><Trash2 className="h-4 w-4" /></Button>
              </Card>
            ))}
          </div>
          <Card className="p-6 h-fit shadow-md-soft">
            <h2 className="font-display text-lg font-bold">Ringkasan</h2>
            <div className="mt-4 space-y-2 text-sm">
              {items.map((i) => (
                <div key={i.id} className="flex justify-between">
                  <span className="text-muted-foreground truncate">{i.quantity}× {i.name}</span>
                  <span>{formatIDR(i.price * i.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-border flex justify-between font-display text-lg font-bold">
              <span>Total</span><span className="text-primary">{formatIDR(total())}</span>
            </div>
            <Button className="w-full mt-6 bg-gradient-primary" size="lg" onClick={() => navigate("/checkout")}>Checkout</Button>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
