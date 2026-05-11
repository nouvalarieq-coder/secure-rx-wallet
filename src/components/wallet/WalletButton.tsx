import { Wallet, LogOut, Copy, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useWallet } from "@/contexts/WalletContext";
import { shortAddr } from "@/lib/format";
import { toast } from "sonner";

export default function WalletButton() {
  const { address, walletName, connecting, connect, disconnect } = useWallet();

  if (!address) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={connecting} className="gap-2">
            {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
            <span className="hidden sm:inline">Connect Wallet</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel>Pilih Wallet</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => connect("phantom")}>
            <Wallet className="mr-2 h-4 w-4 text-primary" /> Phantom
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => connect("solflare")}>
            <Wallet className="mr-2 h-4 w-4 text-primary" /> Solflare
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  const copy = () => {
    navigator.clipboard.writeText(address);
    toast.success("Alamat disalin");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 border-success/40 bg-success/5">
          <span className="h-2 w-2 rounded-full bg-success" />
          <span className="font-mono text-xs">{shortAddr(address, 4)}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          {walletName === "phantom" ? "Phantom" : "Solflare"} · Devnet
        </DropdownMenuLabel>
        <DropdownMenuLabel className="font-mono text-xs break-all pt-0">{address}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={copy}>
          <Copy className="mr-2 h-4 w-4" /> Salin alamat
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={`https://explorer.solana.com/address/${address}?cluster=devnet`} target="_blank" rel="noreferrer">
            <ExternalLink className="mr-2 h-4 w-4" /> Lihat di Explorer
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={disconnect}>
          <LogOut className="mr-2 h-4 w-4" /> Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
