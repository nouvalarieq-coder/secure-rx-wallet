export const formatIDR = (v: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(v);

export const shortAddr = (a: string, n = 4) =>
  a ? `${a.slice(0, n)}…${a.slice(-n)}` : "";
