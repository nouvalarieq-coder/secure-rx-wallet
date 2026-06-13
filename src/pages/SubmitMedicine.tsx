import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, Pill } from "lucide-react";
import { toast } from "sonner";
import { formatIDR } from "@/lib/format";

const empty = {
  name: "",
  description: "",
  price: 0,
  stock: 0,
  category: "",
  bpom_number: "",
  manufacturer: "",
  requires_prescription: false,
};

export default function SubmitMedicine() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<any>(empty);
  const [busy, setBusy] = useState(false);
  const [mine, setMine] = useState<any[]>([]);
  const [loadingMine, setLoadingMine] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  const loadMine = async () => {
    if (!user) return;
    setLoadingMine(true);
    const { data } = await supabase
      .from("medicines")
      .select("*")
      .eq("submitted_by", user.id)
      .order("created_at", { ascending: false });
    setMine(data ?? []);
    setLoadingMine(false);
  };

  useEffect(() => { loadMine(); }, [user]);

  const submit = async () => {
    if (!user) return;
    if (!form.name.trim()) return toast.error("Nama obat wajib diisi");
    setBusy(true);
    const { error } = await supabase.from("medicines").insert({
      ...form,
      price: Number(form.price),
      stock: Number(form.stock),
      submitted_by: user.id,
      approval_status: "pending",
      is_active: false,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Obat diajukan, menunggu persetujuan admin");
    setForm(empty);
    loadMine();
  };

  const statusBadge = (s: string) =>
    s === "approved" ? <Badge className="bg-success text-success-foreground">Disetujui</Badge>
      : s === "rejected" ? <Badge variant="destructive">Ditolak</Badge>
      : <Badge className="bg-warning text-warning-foreground">Menunggu</Badge>;

  return (
    <Layout>
      <div className="container py-10 max-w-4xl">
        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold">Ajukan Obat Baru</h1>
          <p className="text-muted-foreground mt-1">
            Pengajuan kamu akan ditinjau admin sebelum tampil di marketplace.
          </p>
        </div>

        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <Label>Nama Obat *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Deskripsi</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Harga (IDR)</Label>
                <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </div>
              <div>
                <Label>Stok</Label>
                <Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Kategori</Label>
                <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
              </div>
              <div>
                <Label>Produsen</Label>
                <Input value={form.manufacturer} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Nomor BPOM</Label>
              <Input value={form.bpom_number} onChange={(e) => setForm({ ...form, bpom_number: e.target.value })} />
            </div>
            <Button onClick={submit} disabled={busy} className="w-full">
              {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Ajukan Obat
            </Button>
          </div>
        </Card>

        <div className="mt-10">
          <h2 className="font-display text-xl font-bold mb-3">Pengajuan Saya</h2>
          <Card className="p-5">
            {loadingMine ? (
              <Loader2 className="h-5 w-5 animate-spin mx-auto my-6" />
            ) : mine.length === 0 ? (
              <div className="text-center text-muted-foreground py-6 text-sm">Belum ada pengajuan.</div>
            ) : (
              <ul className="divide-y divide-border">
                {mine.map((m) => (
                  <li key={m.id} className="py-3 flex items-center gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary"><Pill className="h-4 w-4" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{m.name}</div>
                      <div className="text-xs text-muted-foreground">{formatIDR(Number(m.price))} · stok {m.stock}</div>
                    </div>
                    {statusBadge(m.approval_status)}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </Layout>
  );
}
