import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { connectWallet, disconnectWallet, WalletProvider as WName } from "@/lib/solana";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type Ctx = {
  address: string | null;
  walletName: WName | null;
  connecting: boolean;
  connect: (name: WName) => Promise<void>;
  disconnect: () => Promise<void>;
};

const WalletCtx = createContext<Ctx>({
  address: null,
  walletName: null,
  connecting: false,
  connect: async () => {},
  disconnect: async () => {},
});

const LS_KEY = "wallet_connection";

export function WalletProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [address, setAddress] = useState<string | null>(null);
  const [walletName, setWalletName] = useState<WName | null>(null);
  const [connecting, setConnecting] = useState(false);

  // Restore from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const { address, walletName } = JSON.parse(raw);
        if (address && walletName) {
          setAddress(address);
          setWalletName(walletName);
        }
      }
    } catch {}
  }, []);

  const connect = useCallback(async (name: WName) => {
    setConnecting(true);
    try {
      const addr = await connectWallet(name);
      setAddress(addr);
      setWalletName(name);
      localStorage.setItem(LS_KEY, JSON.stringify({ address: addr, walletName: name }));
      if (user) {
        await supabase.from("profiles").upsert(
          { id: user.id, wallet_address: addr },
          { onConflict: "id" }
        );
      }
      toast.success(`${name === "phantom" ? "Phantom" : "Solflare"} terhubung`);
    } catch (e: any) {
      toast.error(e.message ?? "Gagal connect wallet");
    } finally {
      setConnecting(false);
    }
  }, [user]);

  const disconnect = useCallback(async () => {
    if (walletName) await disconnectWallet(walletName);
    setAddress(null);
    setWalletName(null);
    localStorage.removeItem(LS_KEY);
    toast.success("Wallet terputus");
  }, [walletName]);

  return (
    <WalletCtx.Provider value={{ address, walletName, connecting, connect, disconnect }}>
      {children}
    </WalletCtx.Provider>
  );
}

export const useWallet = () => useContext(WalletCtx);
