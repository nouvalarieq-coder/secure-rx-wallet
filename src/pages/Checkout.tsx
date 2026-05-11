import { useState } from "react";
import Layout from "@/components/layout/Layout";
import { useCart } from "@/store/cart";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Wallet, CreditCard, ShieldCheck, ExternalLink, CheckCircle2 } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import { formatIDR, shortAddr } from "@/lib/format";
import { connectWallet, idrToSol, IDR_PER_SOL, MERCHANT_WALLET, sendSolPayment, explorerUrl, verifyTransaction, WalletProvider } from "@/lib/solana";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function Checkout() {
  const { user } = useAuth();
  const { items, total, clear } = useCart();
  const navigate = useNavigate();

  const [method, setMethod] = useState<"fiat" | "crypto">("fiat");
  const [walletName, setWalletName] = useState<WalletProvider>("phantom");
  const [walletAddr, setWalletAddr] = useState<string>("");
  const [shipping, setShipping] = useState("");
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState<{ sig?: string; orderId: string } | null>(null);

  if (!user) return <Navigate to="/auth" replace />;
  if (items.length === 0 && !done) return <Navigate to="/cart" replace />;

  const totalIdr = total();
  const totalSol = idrToSol(totalIdr);

  const onConnect = async (name: WalletProvider) => {
    try {
      setWalletName(name);
      const addr = await connectWallet(name);
      setWalletAddr(addr);
      toast.success(`${name} terhubung`);
      // Save to profile
      await supabase.from("profiles").upsert({ id: user.id, wallet_address: addr }, { onConflict: "id" });
    } catch (e: any) {
      toast.error(e.message ?? "Gagal connect wallet");
    }
  };

  const createOrder = async (paymentStatus: "pending" | "success" | "failed", txSig?: string) => {
    const { data: order, error } = await supabase.from("orders").insert({
      user_id: user.id,
      total_amount: totalIdr,
      payment_method: method,
      payment_status: paymentStatus,
      tx_signature: txSig ?? null,
      wallet_address: method === "crypto" ? walletAddr : null,
      shipping_address: shipping,
    }).select().single();
    if (error) throw error;

    const { error: e2 } = await supabase.from("order_items").insert(
      items.map((i) => ({
        order_id: order.id,
        medicine_id: i.id,
        medicine_name: i.name,
        quantity: i.quantity,
        unit_price: i.price,
      }))
    );
    if (e2) throw e2;
    return order.id as string;
  };

  const onCheckout = async () => {
    if (!shipping.trim()) return toast.error("Mohon isi alamat pengiriman");
    setProcessing(true);
    try {
      if (method === "fiat") {
        // Simulate fiat payment success
        const id = await createOrder("success");
        clear();
        setDone({ orderId: id });
        toast.success("Pembayaran berhasil");
      } else {
        if (!walletAddr) { toast.error("Hubungkan wallet terlebih dahulu"); setProcessing(false); return; }
        toast.info("Mengirim transaksi ke Solana devnet…");
        const sig = await sendSolPayment({ walletName, fromPubkey: walletAddr, amountSol: totalSol });
        toast.success("Transaksi terkirim, memverifikasi…");
        const ok = await verifyTransaction(sig);
        const id = await createOrder(ok ? "success" : "pending", sig);
        clear();
        setDone({ orderId: id, sig });
        toast.success(ok ? "Pembayaran crypto terverifikasi!" : "Transaksi terkirim, menunggu konfirmasi");
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.message ?? "Gagal memproses pembayaran");
    } finally {
      setProcessing(false);
    }
  };

  if (done) {
    return (
      <Layout>
        <div className="container max-w-xl py-16">
          <Card className="p-8 text-center shadow-md-soft">
            <div className="inline-grid h-16 w-16 place-items-center rounded-full bg-success/15 text-success">
              <CheckCircle2 className="h-9 w-9" />
            </div>
            <h1 className="mt-4 font-display text-2xl font-bold">Pesanan Berhasil!</h1>
            <p className="text-muted-foreground mt-1">ID Pesanan: <span className="font-mono">{done.orderId.slice(0, 8)}</span></p>
            {done.sig && (
              <a href={explorerUrl(done.sig)} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1 text-primary text-sm hover:underline">
                Lihat di Solana Explorer <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
            <div className="mt-8 flex gap-3 justify-center">
              <Button onClick={() => navigate("/orders")}>Lihat Riwayat</Button>
              <Button variant="outline" onClick={() => navigate("/marketplace")}>Belanja Lagi</Button>
            </div>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-10">
        <h1 className="font-display text-3xl font-bold mb-6">Checkout</h1>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <h2 className="font-display text-lg font-bold mb-4">Alamat Pengiriman</h2>
              <Label>Alamat lengkap</Label>
              <Textarea value={shipping} onChange={(e) => setShipping(e.target.value)} placeholder="Jl. Sudirman No. 123, Jakarta Pusat, 10220" rows={3} />
            </Card>

            <Card className="p-6">
              <h2 className="font-display text-lg font-bold mb-4">Metode Pembayaran</h2>
              <RadioGroup value={method} onValueChange={(v) => setMethod(v as any)} className="grid sm:grid-cols-2 gap-3">
                <label className={`rounded-xl border p-4 cursor-pointer transition-base ${method==="fiat" ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border hover:bg-secondary/40"}`}>
                  <RadioGroupItem value="fiat" className="sr-only" />
                  <div className="flex items-center gap-2 font-semibold"><CreditCard className="h-5 w-5 text-primary" />Transfer / E-Wallet</div>
                  <p className="text-xs text-muted-foreground mt-1">BCA, OVO, GoPay, Dana</p>
                </label>
                <label className={`rounded-xl border p-4 cursor-pointer transition-base ${method==="crypto" ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border hover:bg-secondary/40"}`}>
                  <RadioGroupItem value="crypto" className="sr-only" />
                  <div className="flex items-center gap-2 font-semibold"><Wallet className="h-5 w-5 text-primary" />Crypto (Solana)</div>
                  <p className="text-xs text-muted-foreground mt-1">Phantom · Solflare · Devnet</p>
                </label>
              </RadioGroup>

              {method === "crypto" && (
                <div className="mt-6 space-y-4 rounded-xl border border-border bg-gradient-soft p-5">
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <div className="text-muted-foreground">Pembayaran setara</div>
                      <div className="font-display text-2xl font-bold text-primary">{totalSol} SOL</div>
                      <div className="text-xs text-muted-foreground">≈ {formatIDR(IDR_PER_SOL)} per SOL</div>
                    </div>
                    <Badge variant="outline" className="border-success/40 text-success">Devnet</Badge>
                  </div>

                  <div className="text-xs text-muted-foreground">Wallet merchant tujuan:</div>
                  <div className="font-mono text-xs break-all rounded-lg bg-card border border-border p-2">{MERCHANT_WALLET}</div>

                  {!walletAddr ? (
                    <div className="grid grid-cols-2 gap-3">
                      <Button variant="outline" onClick={() => onConnect("phantom")}>
                        <Wallet className="h-4 w-4 mr-2" />Phantom
                      </Button>
                      <Button variant="outline" onClick={() => onConnect("solflare")}>
                        <Wallet className="h-4 w-4 mr-2" />Solflare
                      </Button>
                    </div>
                  ) : (
                    <div className="rounded-lg bg-success/10 border border-success/30 p-3 text-sm flex items-center justify-between">
                      <div>
                        <div className="text-success font-semibold flex items-center gap-1"><ShieldCheck className="h-4 w-4" />Wallet terhubung</div>
                        <div className="font-mono text-xs text-muted-foreground mt-0.5">{shortAddr(walletAddr, 6)}</div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setWalletAddr("")}>Ganti</Button>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>

          <Card className="p-6 h-fit shadow-md-soft">
            <h2 className="font-display text-lg font-bold">Pesanan Anda</h2>
            <div className="mt-4 space-y-2 text-sm max-h-64 overflow-auto">
              {items.map((i) => (
                <div key={i.id} className="flex justify-between gap-3">
                  <span className="text-muted-foreground truncate">{i.quantity}× {i.name}</span>
                  <span className="shrink-0">{formatIDR(i.price * i.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-border space-y-2">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>{formatIDR(totalIdr)}</span></div>
              <div className="flex justify-between font-display text-lg font-bold"><span>Total</span><span className="text-primary">{formatIDR(totalIdr)}</span></div>
            </div>
            <Button className="w-full mt-6 bg-gradient-primary" size="lg" onClick={onCheckout} disabled={processing}>
              {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {method === "crypto" ? "Bayar dengan Solana" : "Bayar Sekarang"}
            </Button>
            <p className="text-[11px] text-muted-foreground mt-3 text-center">
              Dengan melanjutkan, Anda menyetujui Syarat & Ketentuan SolMedika.
            </p>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
