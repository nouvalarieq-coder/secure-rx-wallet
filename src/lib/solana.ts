// Solana wallet integration: Phantom & Solflare on devnet
import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  clusterApiUrl,
} from "@solana/web3.js";

export const SOLANA_NETWORK = "devnet";
export const SOLANA_RPC = clusterApiUrl(SOLANA_NETWORK);

// Demo merchant wallet (devnet). User can replace via .env later.
export const MERCHANT_WALLET = "8FE27ioQh3T7o22QsYVT5Re8NBHaBDLqGSgxz1LU3uhM";

// Approx IDR per 1 SOL on devnet (placeholder rate)
export const IDR_PER_SOL = 2_500_000;

export const connection = new Connection(SOLANA_RPC, "confirmed");

export type WalletProvider = "phantom" | "solflare";

type AnyWindow = typeof window & {
  phantom?: { solana?: any };
  solana?: any;
  solflare?: any;
};

export function getProvider(name: WalletProvider) {
  if (typeof window === "undefined") return null;
  const w = window as AnyWindow;
  if (name === "phantom") {
    const p = w.phantom?.solana ?? (w.solana?.isPhantom ? w.solana : null);
    return p;
  }
  if (name === "solflare") {
    return w.solflare ?? null;
  }
  return null;
}

export async function connectWallet(name: WalletProvider): Promise<string> {
  const provider = getProvider(name);
  if (!provider) {
    const url = name === "phantom" ? "https://phantom.app/" : "https://solflare.com/";
    window.open(url, "_blank");
    throw new Error(`${name} wallet tidak ditemukan. Silakan install terlebih dahulu.`);
  }
  const resp = await provider.connect();
  const pk = resp?.publicKey?.toString?.() ?? provider.publicKey?.toString?.();
  if (!pk) throw new Error("Gagal mendapatkan address wallet.");
  return pk;
}

export async function disconnectWallet(name: WalletProvider) {
  const provider = getProvider(name);
  try { await provider?.disconnect?.(); } catch {}
}

export function idrToSol(idr: number) {
  return Number((idr / IDR_PER_SOL).toFixed(6));
}

export async function sendSolPayment(opts: {
  walletName: WalletProvider;
  fromPubkey: string;
  amountSol: number;
}): Promise<string> {
  const provider = getProvider(opts.walletName);
  if (!provider) throw new Error("Wallet tidak terhubung.");

  const fromPk = new PublicKey(opts.fromPubkey);
  const toPk = new PublicKey(MERCHANT_WALLET);
  const lamports = Math.round(opts.amountSol * LAMPORTS_PER_SOL);

  const { blockhash } = await connection.getLatestBlockhash("confirmed");
  const tx = new Transaction({ feePayer: fromPk, recentBlockhash: blockhash }).add(
    SystemProgram.transfer({ fromPubkey: fromPk, toPubkey: toPk, lamports })
  );

  const signed = await provider.signAndSendTransaction(tx);
  const signature: string = signed?.signature ?? signed;
  await connection.confirmTransaction(signature, "confirmed");
  return signature;
}

export async function verifyTransaction(signature: string): Promise<boolean> {
  try {
    const status = await connection.getSignatureStatus(signature, { searchTransactionHistory: true });
    const conf = status.value?.confirmationStatus;
    return conf === "confirmed" || conf === "finalized";
  } catch {
    return false;
  }
}

export function explorerUrl(sig: string) {
  return `https://explorer.solana.com/tx/${sig}?cluster=devnet`;
}
