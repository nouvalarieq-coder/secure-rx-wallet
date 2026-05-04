import { useEffect, useRef, useState } from "react";
import Layout from "@/components/layout/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScanLine, ShieldCheck, ShieldAlert, ShieldQuestion, Camera, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Html5Qrcode } from "html5-qrcode";

type Result = {
  status: "asli" | "palsu" | "tidak_ditemukan";
  medicine?: any;
  query: string;
  type: "qr" | "bpom";
};

export default function Verify() {
  const { user } = useAuth();
  const [bpom, setBpom] = useState("");
  const [qr, setQr] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const validate = async (type: "qr" | "bpom", value: string) => {
    if (!value.trim()) return toast.error("Mohon isi nilai untuk diverifikasi");
    setLoading(true);
    try {
      const column = type === "qr" ? "qr_code" : "bpom_number";
      const { data } = await supabase.from("medicines").select("*").eq(column, value.trim()).maybeSingle();
      let status: Result["status"] = "tidak_ditemukan";
      if (data) status = data.is_active ? "asli" : "palsu";
      const r: Result = { status, medicine: data, query: value, type };
      setResult(r);
      // Log
      await supabase.from("fake_drug_reports").insert({
        user_id: user?.id ?? null,
        query_value: value.trim(),
        query_type: type,
        result: status,
        medicine_id: data?.id ?? null,
      });
    } finally {
      setLoading(false);
    }
  };

  const startScan = async () => {
    setScanning(true);
    setTimeout(async () => {
      try {
        const el = document.getElementById("qr-reader");
        if (!el) return;
        const scanner = new Html5Qrcode("qr-reader");
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: 240 },
          async (decoded) => {
            setQr(decoded);
            await stopScan();
            await validate("qr", decoded);
          },
          () => {}
        );
      } catch (e: any) {
        toast.error("Tidak bisa akses kamera: " + e.message);
        setScanning(false);
      }
    }, 50);
  };

  const stopScan = async () => {
    try { await scannerRef.current?.stop(); scannerRef.current?.clear(); } catch {}
    scannerRef.current = null;
    setScanning(false);
  };

  useEffect(() => () => { stopScan(); }, []);

  return (
    <Layout>
      <div className="container max-w-3xl py-12">
        <div className="text-center">
          <div className="inline-grid h-14 w-14 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-lg-soft">
            <ScanLine className="h-7 w-7" />
          </div>
          <h1 className="mt-4 font-display text-3xl md:text-4xl font-bold">Cek Keaslian Obat</h1>
          <p className="text-muted-foreground mt-2">Scan QR Code obat atau masukkan nomor izin BPOM untuk verifikasi instan.</p>
        </div>

        <Card className="mt-8 p-6 shadow-md-soft">
          <Tabs defaultValue="qr">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="qr"><ScanLine className="h-4 w-4 mr-2" />QR Code</TabsTrigger>
              <TabsTrigger value="bpom"><ShieldCheck className="h-4 w-4 mr-2" />Nomor BPOM</TabsTrigger>
            </TabsList>

            <TabsContent value="qr" className="space-y-4 pt-4">
              {!scanning ? (
                <>
                  <Label>Kode QR Obat</Label>
                  <div className="flex gap-2">
                    <Input value={qr} onChange={(e) => setQr(e.target.value)} placeholder="QR-PARA-500-001" />
                    <Button onClick={() => validate("qr", qr)} disabled={loading}>
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verifikasi"}
                    </Button>
                  </div>
                  <Button variant="outline" className="w-full" onClick={startScan}>
                    <Camera className="h-4 w-4 mr-2" /> Buka Kamera & Scan
                  </Button>
                </>
              ) : (
                <div className="space-y-3">
                  <div id="qr-reader" className="rounded-xl overflow-hidden bg-black aspect-square max-w-sm mx-auto" />
                  <Button variant="outline" className="w-full" onClick={stopScan}><X className="h-4 w-4 mr-2" />Tutup Scanner</Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="bpom" className="space-y-4 pt-4">
              <Label>Nomor Izin BPOM</Label>
              <div className="flex gap-2">
                <Input value={bpom} onChange={(e) => setBpom(e.target.value.toUpperCase())} placeholder="DBL1234567890A1" />
                <Button onClick={() => validate("bpom", bpom)} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verifikasi"}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </Card>

        {result && <ResultCard r={result} />}
      </div>
    </Layout>
  );
}

function ResultCard({ r }: { r: Result }) {
  if (r.status === "asli") {
    return (
      <Card className="mt-6 p-6 border-success/40 bg-success/5 shadow-md-soft animate-fade-in">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-success text-success-foreground shrink-0"><ShieldCheck className="h-6 w-6" /></div>
          <div className="flex-1">
            <div className="text-xs uppercase tracking-wide text-success font-bold">Obat Asli ✓</div>
            <h3 className="font-display text-xl font-bold mt-1">{r.medicine.name}</h3>
            <p className="text-muted-foreground text-sm mt-1">{r.medicine.description}</p>
            <div className="mt-4 grid sm:grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-card border border-border p-3">
                <div className="text-xs text-muted-foreground">BPOM</div>
                <div className="font-mono font-semibold">{r.medicine.bpom_number}</div>
              </div>
              <div className="rounded-lg bg-card border border-border p-3">
                <div className="text-xs text-muted-foreground">Produsen</div>
                <div className="font-semibold">{r.medicine.manufacturer}</div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }
  if (r.status === "palsu") {
    return (
      <Card className="mt-6 p-6 border-destructive/40 bg-destructive/5 shadow-md-soft animate-fade-in">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-destructive text-destructive-foreground shrink-0"><ShieldAlert className="h-6 w-6" /></div>
          <div>
            <div className="text-xs uppercase tracking-wide text-destructive font-bold">Obat Tidak Aktif / Palsu ✗</div>
            <h3 className="font-display text-xl font-bold mt-1">Hati-hati!</h3>
            <p className="text-muted-foreground text-sm mt-1">Obat dengan kode <strong>{r.query}</strong> ditandai tidak aktif atau telah ditarik. Jangan konsumsi.</p>
          </div>
        </div>
      </Card>
    );
  }
  return (
    <Card className="mt-6 p-6 border-warning/40 bg-warning/5 shadow-md-soft animate-fade-in">
      <div className="flex items-start gap-4">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-warning text-warning-foreground shrink-0"><ShieldQuestion className="h-6 w-6" /></div>
        <div>
          <div className="text-xs uppercase tracking-wide text-warning font-bold">Tidak Ditemukan</div>
          <h3 className="font-display text-xl font-bold mt-1">Obat tidak terdaftar</h3>
          <p className="text-muted-foreground text-sm mt-1">Kode <strong>{r.query}</strong> tidak ditemukan di database resmi. Mohon laporkan ke pihak berwenang.</p>
        </div>
      </div>
    </Card>
  );
}
