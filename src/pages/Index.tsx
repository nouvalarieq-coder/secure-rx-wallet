import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Wallet,
  ScanLine,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  ShoppingCart,
  Pill,
  TrendingUp,
  Package,
  HeartPulse,
  Stethoscope,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatIDR } from "@/lib/format";
import hero from "@/assets/hero.jpg";

type Medicine = {
  id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  image_url?: string | null;
};

const features = [
  { icon: Shield, title: "Resmi BPOM", desc: "Setiap obat memiliki nomor izin BPOM yang dapat divalidasi." },
  { icon: Wallet, title: "Bayar Crypto Solana", desc: "Hubungkan Phantom atau Solflare. Transaksi diverifikasi blockchain." },
  { icon: ScanLine, title: "Cek Obat Palsu", desc: "Scan QR code atau masukkan nomor BPOM untuk verifikasi instan." },
];

const steps = [
  { icon: ShoppingCart, title: "Pilih Obat", desc: "Jelajahi marketplace dan tambahkan obat ke keranjang." },
  { icon: Wallet, title: "Pilih Pembayaran", desc: "Bayar dengan transfer fiat atau crypto via Solana." },
  { icon: CheckCircle2, title: "Verifikasi Blockchain", desc: "Setiap transaksi tercatat permanen di blockchain devnet." },
];

const categories = [
  { name: "Vitamin", icon: HeartPulse },
  { name: "Analgesik", icon: Pill },
  { name: "Antibiotik", icon: Stethoscope },
  { name: "Pencernaan", icon: TrendingUp },
  { name: "Antialergi", icon: Shield },
  { name: "Kardiovaskular", icon: Package },
];

export default function Index() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [stats, setStats] = useState({ products: 0, categories: 0 });

  useEffect(() => {
    supabase.from("medicines").select("id, name, price, category, stock, image_url").order("stock", { ascending: false }).limit(8).then(({ data }) => {
      if (data) setMedicines(data);
    });
    supabase.from("medicines").select("*", { count: "exact", head: true }).then(({ count }) => {
      if (count !== null) setStats((s) => ({ ...s, products: count }));
    });
  }, []);

  return (
    <Layout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-soft">
        <div className="container py-16 md:py-24 grid lg:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-in">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-soft">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Apotek + Web3 di Indonesia
            </span>
            <h1 className="mt-6 font-display text-4xl md:text-6xl font-extrabold leading-[1.05] tracking-tight">
              Obat Asli, <span className="bg-gradient-primary bg-clip-text text-transparent">Pembayaran Crypto</span> yang Aman.
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-xl">
              MediCrypto menghadirkan marketplace obat resmi BPOM dengan opsi bayar fiat
              maupun crypto Solana. Semua transaksi tercatat di blockchain.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-gradient-primary shadow-lg-soft">
                <Link to="/marketplace">Belanja Sekarang <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/verify">Cek Keaslian Obat</Link>
              </Button>
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" /> 100% BPOM</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" /> Solana Devnet</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" /> Verifikasi Realtime</div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-8 bg-primary/10 blur-3xl rounded-full" aria-hidden />
            <img
              src={hero}
              alt="Obat-obatan dan tablet digital dengan jaringan Solana"
              width={1536} height={1024}
              className="relative rounded-3xl shadow-lg-soft border border-border/60 bg-card w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-card">
        <div className="container py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="font-display text-2xl md:text-3xl font-bold text-primary">{stats.products}+</div>
              <div className="text-sm text-muted-foreground mt-1">Produk Tersedia</div>
            </div>
            <div>
              <div className="font-display text-2xl md:text-3xl font-bold text-primary">{categories.length}+</div>
              <div className="text-sm text-muted-foreground mt-1">Kategori Obat</div>
            </div>
            <div>
              <div className="font-display text-2xl md:text-3xl font-bold text-primary">2</div>
              <div className="text-sm text-muted-foreground mt-1">Metode Pembayaran</div>
            </div>
            <div>
              <div className="font-display text-2xl md:text-3xl font-bold text-primary">100%</div>
              <div className="text-sm text-muted-foreground mt-1">Terverifikasi BPOM</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container py-16 md:py-20">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl font-bold">Dirancang untuk kepercayaan.</h2>
          <p className="mt-3 text-muted-foreground">Tiga lapisan perlindungan untuk setiap obat yang Anda beli.</p>
        </div>
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="group rounded-2xl border border-border bg-gradient-card p-6 shadow-soft hover:shadow-md-soft transition-base">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary group-hover:bg-gradient-primary group-hover:text-primary-foreground transition-base">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold">{f.title}</h3>
              <p className="mt-2 text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="container py-16 md:py-20">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-display text-3xl md:text-4xl font-bold">Produk Unggulan</h2>
            <p className="mt-2 text-muted-foreground">Obat-obatan terlaris dan stok terbanyak.</p>
          </div>
          <Button asChild variant="outline">
            <Link to="/marketplace">Lihat Semua <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {medicines.map((m) => (
            <Link
              key={m.id}
              to={`/product/${m.id}`}
              className="group rounded-2xl border border-border bg-gradient-card overflow-hidden shadow-soft hover:shadow-md-soft transition-base"
            >
              <div className="aspect-[4/3] overflow-hidden bg-muted">
                {m.image_url ? (
                  <img src={m.image_url} alt={m.name} className="w-full h-full object-cover group-hover:scale-105 transition-base" />
                ) : (
                  <div className="grid place-items-center h-full text-muted-foreground"><Pill className="h-10 w-10 opacity-30" /></div>
                )}
              </div>
              <div className="p-4">
                <div className="text-[11px] uppercase tracking-wide text-primary font-semibold">{m.category}</div>
                <h3 className="mt-1 font-display text-base font-semibold truncate">{m.name}</h3>
                <div className="mt-2 flex items-center justify-between">
                  <span className="font-bold text-primary">{formatIDR(m.price)}</span>
                  <span className="text-xs text-muted-foreground">Stok {m.stock}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="container py-16 md:py-20">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl font-bold">Cara Kerja</h2>
          <p className="mt-3 text-muted-foreground">Tiga langkah mudah berbelanja obat dengan MediCrypto.</p>
        </div>
        <div className="mt-12 grid md:grid-cols-3 gap-8 relative">
          {steps.map((s, i) => (
            <div key={s.title} className="relative text-center">
              <div className="inline-grid h-14 w-14 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-soft mb-4">
                <s.icon className="h-7 w-7" />
              </div>
              <div className="absolute top-7 left-[60%] w-[80%] hidden md:block border-t-2 border-dashed border-border" aria-hidden />
              <h3 className="font-display text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-muted-foreground text-sm max-w-xs mx-auto">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="container py-16 md:py-20">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-center mb-10">Jelajahi Kategori</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((c) => (
            <Link
              key={c.name}
              to={`/marketplace?category=${encodeURIComponent(c.name)}`}
              className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-gradient-card p-6 shadow-soft hover:shadow-md-soft hover:border-primary/30 transition-base"
            >
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
                <c.icon className="h-6 w-6" />
              </div>
              <span className="font-semibold text-sm">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container pb-20">
        <div className="rounded-3xl bg-gradient-hero p-10 md:p-16 text-primary-foreground relative overflow-hidden">
          <div className="absolute inset-0 opacity-20" aria-hidden style={{
            backgroundImage: "radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 80% 60%, white 1px, transparent 1px)",
            backgroundSize: "40px 40px"
          }} />
          <div className="relative max-w-2xl">
            <h2 className="font-display text-3xl md:text-4xl font-bold">Siap mencoba bayar obat dengan Solana?</h2>
            <p className="mt-3 opacity-90">Connect wallet Phantom atau Solflare Anda. Berjalan di devnet — gratis dan aman untuk dicoba.</p>
            <Button asChild size="lg" variant="secondary" className="mt-6">
              <Link to="/marketplace">Mulai Belanja</Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
