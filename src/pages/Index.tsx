import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Shield, Wallet, ScanLine, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import hero from "@/assets/hero.jpg";

const features = [
  { icon: Shield, title: "Resmi BPOM", desc: "Setiap obat memiliki nomor izin BPOM yang dapat divalidasi." },
  { icon: Wallet, title: "Bayar Crypto Solana", desc: "Hubungkan Phantom atau Solflare. Transaksi diverifikasi blockchain." },
  { icon: ScanLine, title: "Cek Obat Palsu", desc: "Scan QR code atau masukkan nomor BPOM untuk verifikasi instan." },
];

export default function Index() {
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
              className="relative rounded-3xl shadow-lg-soft border border-border/60 bg-card"
            />
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
