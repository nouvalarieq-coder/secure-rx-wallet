import { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Pill, ShoppingBag, Wallet, ShieldAlert, Loader2 } from "lucide-react";
import { formatIDR } from "@/lib/format";
import { toast } from "sonner";

export default function Admin() {
  return (
    <Layout>
      <div className="container py-10">
        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Kelola obat, pantau transaksi & laporan obat palsu.</p>
        </div>

        <Stats />

        <Tabs defaultValue="meds" className="mt-8">
          <TabsList>
            <TabsTrigger value="meds"><Pill className="h-4 w-4 mr-2" />Obat</TabsTrigger>
            <TabsTrigger value="orders"><ShoppingBag className="h-4 w-4 mr-2" />Transaksi</TabsTrigger>
            <TabsTrigger value="reports"><ShieldAlert className="h-4 w-4 mr-2" />Laporan Palsu</TabsTrigger>
          </TabsList>
          <TabsContent value="meds"><MedicinesTab /></TabsContent>
          <TabsContent value="orders"><OrdersTab /></TabsContent>
          <TabsContent value="reports"><ReportsTab /></TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

function Stats() {
  const [s, setS] = useState({ meds: 0, orders: 0, crypto: 0, reports: 0 });
  useEffect(() => {
    (async () => {
      const [m, o, c, r] = await Promise.all([
        supabase.from("medicines").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id", { count: "exact", head: true }).eq("payment_method", "crypto"),
        supabase.from("fake_drug_reports").select("id", { count: "exact", head: true }),
      ]);
      setS({ meds: m.count ?? 0, orders: o.count ?? 0, crypto: c.count ?? 0, reports: r.count ?? 0 });
    })();
  }, []);
  const cards = [
    { icon: Pill, label: "Total Obat", value: s.meds },
    { icon: ShoppingBag, label: "Total Transaksi", value: s.orders },
    { icon: Wallet, label: "Pembayaran Crypto", value: s.crypto },
    { icon: ShieldAlert, label: "Cek Keaslian", value: s.reports },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <Card key={c.label} className="p-5 bg-gradient-card">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><c.icon className="h-5 w-5" /></div>
            <div>
              <div className="text-xs text-muted-foreground">{c.label}</div>
              <div className="font-display text-2xl font-bold">{c.value}</div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function MedicinesTab() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const empty = { name: "", description: "", price: 0, stock: 0, category: "", bpom_number: "", qr_code: "", manufacturer: "", requires_prescription: false, is_active: true };
  const [form, setForm] = useState<any>(empty);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("medicines").select("*").order("created_at", { ascending: false });
    setItems(data ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    const payload = { ...form, price: Number(form.price), stock: Number(form.stock) };
    let err;
    if (editing) ({ error: err } = await supabase.from("medicines").update(payload).eq("id", editing.id));
    else ({ error: err } = await supabase.from("medicines").insert(payload));
    if (err) return toast.error(err.message);
    toast.success(editing ? "Obat diperbarui" : "Obat ditambahkan");
    setOpen(false); setEditing(null); setForm(empty); load();
  };
  const del = async (id: string) => {
    if (!confirm("Hapus obat ini?")) return;
    const { error } = await supabase.from("medicines").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Dihapus"); load();
  };

  return (
    <Card className="mt-4 p-5">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-display font-bold">Daftar Obat</h2>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditing(null); setForm(empty); } }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" />Tambah Obat</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editing ? "Edit" : "Tambah"} Obat</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Nama</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Deskripsi</Label><Textarea value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Harga (IDR)</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
                <div><Label>Stok</Label><Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Kategori</Label><Input value={form.category ?? ""} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
                <div><Label>Produsen</Label><Input value={form.manufacturer ?? ""} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>BPOM</Label><Input value={form.bpom_number ?? ""} onChange={(e) => setForm({ ...form, bpom_number: e.target.value })} /></div>
                <div><Label>QR Code</Label><Input value={form.qr_code ?? ""} onChange={(e) => setForm({ ...form, qr_code: e.target.value })} /></div>
              </div>
            </div>
            <DialogFooter><Button onClick={save}>Simpan</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {loading ? <Loader2 className="h-5 w-5 animate-spin mx-auto my-8" /> : (
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-muted-foreground border-b border-border">
              <th className="py-2 pr-4">Nama</th><th className="pr-4">BPOM</th><th className="pr-4">Harga</th><th className="pr-4">Stok</th><th></th>
            </tr></thead>
            <tbody>
              {items.map((m) => (
                <tr key={m.id} className="border-b border-border/60">
                  <td className="py-3 pr-4">
                    <div className="font-medium">{m.name}</div>
                    <div className="text-xs text-muted-foreground">{m.category}</div>
                  </td>
                  <td className="pr-4 font-mono text-xs">{m.bpom_number}</td>
                  <td className="pr-4">{formatIDR(Number(m.price))}</td>
                  <td className="pr-4">{m.stock}</td>
                  <td className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => { setEditing(m); setForm(m); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => del(m.id)}><Trash2 className="h-4 w-4" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function OrdersTab() {
  const [orders, setOrders] = useState<any[]>([]);
  useEffect(() => { (async () => {
    const { data } = await supabase.from("orders").select("*, order_items(*)").order("created_at", { ascending: false }).limit(100);
    setOrders(data ?? []);
  })(); }, []);
  const status = (s: string) => s === "success" ? <Badge className="bg-success text-success-foreground">Sukses</Badge> : s === "pending" ? <Badge className="bg-warning text-warning-foreground">Pending</Badge> : <Badge variant="destructive">Gagal</Badge>;
  return (
    <Card className="mt-4 p-5">
      <h2 className="font-display font-bold mb-4">Transaksi Terbaru</h2>
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-muted-foreground border-b border-border"><th className="py-2 pr-4">ID</th><th className="pr-4">Tanggal</th><th className="pr-4">Metode</th><th className="pr-4">Total</th><th>Status</th></tr></thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-border/60">
                <td className="py-3 pr-4 font-mono text-xs">{o.id.slice(0, 8)}</td>
                <td className="pr-4">{new Date(o.created_at).toLocaleDateString("id-ID")}</td>
                <td className="pr-4 capitalize">{o.payment_method}</td>
                <td className="pr-4">{formatIDR(Number(o.total_amount))}</td>
                <td>{status(o.payment_status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function ReportsTab() {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => { (async () => {
    const { data } = await supabase.from("fake_drug_reports").select("*").order("created_at", { ascending: false }).limit(100);
    setItems(data ?? []);
  })(); }, []);
  const badge = (r: string) => r === "asli" ? <Badge className="bg-success text-success-foreground">Asli</Badge> : r === "palsu" ? <Badge variant="destructive">Palsu</Badge> : <Badge className="bg-warning text-warning-foreground">Tdk Ditemukan</Badge>;
  return (
    <Card className="mt-4 p-5">
      <h2 className="font-display font-bold mb-4">Log Pengecekan Obat</h2>
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-muted-foreground border-b border-border"><th className="py-2 pr-4">Tanggal</th><th className="pr-4">Tipe</th><th className="pr-4">Query</th><th>Hasil</th></tr></thead>
          <tbody>
            {items.map((r) => (
              <tr key={r.id} className="border-b border-border/60">
                <td className="py-3 pr-4">{new Date(r.created_at).toLocaleString("id-ID")}</td>
                <td className="pr-4 uppercase text-xs">{r.query_type}</td>
                <td className="pr-4 font-mono text-xs">{r.query_value}</td>
                <td>{badge(r.result)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
