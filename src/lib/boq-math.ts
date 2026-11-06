import type { Boq, CostRate } from "./types";

export const rateTotal = (r: Pick<CostRate, "material" | "labour" | "plant">) =>
  r.material + r.labour + r.plant;

/** Totals for a BOQ. Wastage applies to direct cost; prelims, contingency and margin
 * apply cumulatively on the running subtotal; tax applies last. */
export function boqTotals(b: Pick<Boq, "lines" | "wastagePct" | "prelimsPct" | "contingencyPct" | "marginPct" | "taxPct">) {
  const direct = b.lines.reduce((s, l) => s + l.quantity * l.rate, 0);
  const wastage = direct * (b.wastagePct / 100);
  const afterWastage = direct + wastage;
  const prelims = afterWastage * (b.prelimsPct / 100);
  const contingency = (afterWastage + prelims) * (b.contingencyPct / 100);
  const preMargin = afterWastage + prelims + contingency;
  const margin = preMargin * (b.marginPct / 100);
  const subtotal = preMargin + margin;
  const tax = subtotal * (b.taxPct / 100);
  return { direct, wastage, prelims, contingency, margin, subtotal, tax, total: subtotal + tax };
}

export function byTrade(b: Pick<Boq, "lines">) {
  const m = new Map<string, number>();
  for (const l of b.lines) m.set(l.trade, (m.get(l.trade) ?? 0) + l.quantity * l.rate);
  return [...m.entries()].map(([trade, value]) => ({ trade, value })).sort((a, b) => b.value - a.value);
}

export const fmtMoney = (n: number, currency = "INR") =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);

export const fmtCompact = (n: number, currency = "INR") =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency, notation: "compact", maximumFractionDigits: 1 }).format(n);

export const fmtNum = (n: number, d = 2) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: d }).format(n);

export const uid = (p = "id") => `${p}_${Math.random().toString(36).slice(2, 9)}`;
