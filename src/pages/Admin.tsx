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
import { Plus, Pencil, Trash2, Pill, ShoppingBag, Wallet, ShieldAlert, Loader2, Download, ChevronDown, ExternalLink, Anchor } from "lucide-react";
import { formatIDR, shortAddr } from "@/lib/format";
import { explorerUrl, sendMemo, sha256Hex } from "@/lib/solana";
import { useWallet } from "@/contexts/WalletContext";
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
              <th className="py-2 pr-4">Nama</th><th className="pr-4">BPOM</th><th className="pr-4">Harga</th><th className="pr-4">Stok</th><th className="pr-4">On-Chain</th><th></th>
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
                  <td className="pr-4">
                    <OnChainCell medicine={m} onUpdated={load} />
                  </td>
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

function OnChainCell({ medicine, onUpdated }: { medicine: any; onUpdated: () => void }) {
  const { address, walletName, connect } = useWallet();
  const [busy, setBusy] = useState(false);

  const record = async () => {
    try {
      if (!address || !walletName) {
        await connect("phantom");
        return toast.info("Wallet terhubung, klik lagi untuk mencatat.");
      }
      setBusy(true);
      const payload = JSON.stringify({
        id: medicine.id, name: medicine.name, bpom: medicine.bpom_number,
        manufacturer: medicine.manufacturer, qr: medicine.qr_code,
      });
      const hash = await sha256Hex(payload);
      const memo = `MediCryp|${medicine.bpom_number ?? medicine.id}|${hash}`;
      const sig = await sendMemo({ walletName, fromPubkey: address, memo });
      const { error } = await supabase.from("medicines").update({
        onchain_hash: hash, onchain_signature: sig, onchain_recorded_at: new Date().toISOString(),
      }).eq("id", medicine.id);
      if (error) throw error;
      toast.success("Hash tercatat di Solana devnet");
      onUpdated();
    } catch (e: any) {
      toast.error(e.message ?? "Gagal mencatat on-chain");
    } finally {
      setBusy(false);
    }
  };

  if (medicine.onchain_signature) {
    return (
      <a href={explorerUrl(medicine.onchain_signature)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-success hover:underline font-mono">
        <Anchor className="h-3 w-3" /> {medicine.onchain_signature.slice(0, 8)}…<ExternalLink className="h-3 w-3" />
      </a>
    );
  }
  return (
    <Button variant="outline" size="sm" disabled={busy} onClick={record}>
      {busy ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Anchor className="h-3 w-3 mr-1" />}
      Catat
    </Button>
  );
}

function OrdersTab() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "fiat" | "crypto">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "success" | "pending" | "failed">("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("orders").select("*, order_items(*)").order("created_at", { ascending: false }).limit(200);
    let rows = data ?? [];
    const ids = Array.from(new Set(rows.map((r: any) => r.user_id)));
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id, full_name, wallet_address").in("id", ids);
      const map = new Map((profs ?? []).map((p: any) => [p.id, p]));
      rows = rows.map((r: any) => ({ ...r, profile: map.get(r.user_id) }));
    }
    setOrders(rows);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = orders.filter((o) =>
    (filter === "all" || o.payment_method === filter) &&
    (statusFilter === "all" || o.payment_status === statusFilter)
  );

  const totalRevenue = filtered.filter((o) => o.payment_status === "success").reduce((s, o) => s + Number(o.total_amount), 0);
  const cryptoCount = filtered.filter((o) => o.payment_method === "crypto").length;
  const fiatCount = filtered.filter((o) => o.payment_method === "fiat").length;

  const exportCsv = () => {
    const header = ["ID", "Tanggal", "Pembeli", "Metode", "Status", "Total (IDR)", "Wallet", "TX Signature", "Alamat", "Items"];
    const rows = filtered.map((o) => [
      o.id,
      new Date(o.created_at).toLocaleString("id-ID"),
      o.profile?.full_name ?? "-",
      o.payment_method,
      o.payment_status,
      Number(o.total_amount),
      o.wallet_address ?? "",
      o.tx_signature ?? "",
      (o.shipping_address ?? "").replace(/\n/g, " "),
      (o.order_items ?? []).map((i: any) => `${i.quantity}x ${i.medicine_name}`).join(" | "),
    ]);
    const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `rekap-transaksi-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("Rekap diunduh");
  };

  const status = (s: string) => s === "success" ? <Badge className="bg-success text-success-foreground">Sukses</Badge> : s === "pending" ? <Badge className="bg-warning text-warning-foreground">Pending</Badge> : <Badge variant="destructive">Gagal</Badge>;

  return (
    <Card className="mt-4 p-5">
      <div className="grid gap-3 sm:grid-cols-3 mb-5">
        <div className="rounded-xl border border-border p-4 bg-gradient-card">
          <div className="text-xs text-muted-foreground">Pendapatan (Sukses)</div>
          <div className="font-display text-xl font-bold text-primary mt-1">{formatIDR(totalRevenue)}</div>
        </div>
        <div className="rounded-xl border border-border p-4">
          <div className="text-xs text-muted-foreground">Transfer / E-Wallet</div>
          <div className="font-display text-xl font-bold mt-1">{fiatCount}</div>
        </div>
        <div className="rounded-xl border border-border p-4">
          <div className="text-xs text-muted-foreground">Crypto (Solana)</div>
          <div className="font-display text-xl font-bold mt-1">{cryptoCount}</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <h2 className="font-display font-bold mr-auto">Rekap Transaksi</h2>
        <select value={filter} onChange={(e) => setFilter(e.target.value as any)} className="h-9 rounded-md border border-border bg-background px-2 text-sm">
          <option value="all">Semua Metode</option>
          <option value="fiat">Transfer/E-Wallet</option>
          <option value="crypto">Crypto</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="h-9 rounded-md border border-border bg-background px-2 text-sm">
          <option value="all">Semua Status</option>
          <option value="success">Sukses</option>
          <option value="pending">Pending</option>
          <option value="failed">Gagal</option>
        </select>
        <Button size="sm" variant="outline" onClick={exportCsv}><Download className="h-4 w-4 mr-1" />Export CSV</Button>
      </div>

      {loading ? <Loader2 className="h-5 w-5 animate-spin mx-auto my-8" /> : filtered.length === 0 ? (
        <div className="text-center text-muted-foreground py-10 text-sm">Belum ada transaksi.</div>
      ) : (
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-muted-foreground border-b border-border">
              <th className="py-2 pr-2 w-6"></th><th className="pr-4">ID</th><th className="pr-4">Tanggal</th><th className="pr-4">Pembeli</th><th className="pr-4">Metode</th><th className="pr-4">Total</th><th>Status</th>
            </tr></thead>
            <tbody>
              {filtered.map((o) => (
                <FragmentRow key={o.id} o={o} expanded={expanded === o.id} onToggle={() => setExpanded(expanded === o.id ? null : o.id)} status={status} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function FragmentRow({ o, expanded, onToggle, status }: any) {
  return (
    <>
      <tr className="border-b border-border/60 hover:bg-secondary/30 cursor-pointer" onClick={onToggle}>
        <td className="py-3 pl-2 pr-1"><ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`} /></td>
        <td className="py-3 pr-4 font-mono text-xs">{o.id.slice(0, 8)}</td>
        <td className="pr-4">{new Date(o.created_at).toLocaleString("id-ID")}</td>
        <td className="pr-4">{o.profile?.full_name ?? <span className="text-muted-foreground">-</span>}</td>
        <td className="pr-4 capitalize">{o.payment_method}</td>
        <td className="pr-4 font-semibold">{formatIDR(Number(o.total_amount))}</td>
        <td>{status(o.payment_status)}</td>
      </tr>
      {expanded && (
        <tr className="border-b border-border/60 bg-secondary/20">
          <td></td>
          <td colSpan={6} className="py-4 pr-4">
            <div className="grid md:grid-cols-2 gap-4 text-xs">
              <div>
                <div className="font-semibold text-sm mb-1">Item Pesanan</div>
                <ul className="space-y-1">
                  {(o.order_items ?? []).map((i: any) => (
                    <li key={i.id} className="flex justify-between gap-3">
                      <span>{i.quantity}× {i.medicine_name}</span>
                      <span className="text-muted-foreground">{formatIDR(Number(i.unit_price) * i.quantity)}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-2">
                <div><span className="text-muted-foreground">Alamat: </span>{o.shipping_address ?? "-"}</div>
                {o.wallet_address && (
                  <div><span className="text-muted-foreground">Wallet pembeli: </span><span className="font-mono">{shortAddr(o.wallet_address, 6)}</span></div>
                )}
                {o.tx_signature && (
                  <div>
                    <span className="text-muted-foreground">TX: </span>
                    <a href={explorerUrl(o.tx_signature)} target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-1 font-mono">
                      {shortAddr(o.tx_signature, 8)} <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
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
