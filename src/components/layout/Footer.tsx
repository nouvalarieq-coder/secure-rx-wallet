import { Pill } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border/60 bg-card mt-16">
      <div className="container py-10 grid gap-8 md:grid-cols-3 text-sm">
        <div>
          <div className="flex items-center gap-2 font-display font-bold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-primary text-primary-foreground">
              <Pill className="h-4 w-4" />
            </span>
            MediCrypto
          </div>
          <p className="mt-3 text-muted-foreground max-w-xs">
            Apotek online resmi BPOM dengan pembayaran aman via fiat & crypto Solana.
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Produk</h4>
          <ul className="space-y-2 text-muted-foreground">
            <li>Marketplace Obat</li>
            <li>Cek Keaslian (QR/BPOM)</li>
            <li>Pembayaran Crypto</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Keamanan</h4>
          <ul className="space-y-2 text-muted-foreground">
            <li>Verifikasi blockchain Solana (devnet)</li>
            <li>Enkripsi end-to-end</li>
            <li>Validasi BPOM</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} MediCrypto. Semua transaksi crypto berjalan di Solana Devnet.
      </div>
    </footer>
  );
}
