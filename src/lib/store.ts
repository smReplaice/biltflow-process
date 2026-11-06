import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuditEvent, Boq, BoqLine, CostRate, Drawing, Project, QuantityItem } from "./types";
import { seedAudit, seedBoqs, seedDrawings, seedProjects, seedQuantities, seedRates } from "./seed";
import { rateTotal, uid } from "./boq-math";

const USER = "Ananya Rao";

interface State {
  projects: Project[];
  drawings: Drawing[];
  quantities: QuantityItem[];
  rates: CostRate[];
  boqs: Boq[];
  audit: AuditEvent[];
  activeProjectId: string;
  setActiveProject: (id: string) => void;
  log: (e: Omit<AuditEvent, "id" | "at" | "user">) => void;
  addProject: (p: Omit<Project, "id" | "createdAt">) => string;
  addDrawings: (ds: Omit<Drawing, "id">[]) => void;
  updateDrawing: (id: string, patch: Partial<Drawing>) => void;
  deleteDrawing: (id: string) => void;
  addQuantities: (qs: Omit<QuantityItem, "id">[]) => void;
  updateQuantity: (id: string, patch: Partial<QuantityItem>) => void;
  upsertRate: (r: CostRate) => void;
  deleteRate: (id: string) => void;
  generateBoq: (projectId: string, name: string) => string;
  updateBoq: (id: string, patch: Partial<Boq>) => void;
  reviseBoq: (id: string) => string;
  resetDemo: () => void;
}

const seed = () => ({
  projects: seedProjects,
  drawings: seedDrawings,
  quantities: seedQuantities,
  rates: seedRates,
  boqs: seedBoqs,
  audit: seedAudit,
  activeProjectId: "p1",
});

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      ...seed(),
      setActiveProject: (id) => set({ activeProjectId: id }),
      log: (e) => set((s) => ({ audit: [{ ...e, id: uid("a"), at: new Date().toISOString(), user: USER }, ...s.audit] })),
      addProject: (p) => {
        const id = uid("p");
        set((s) => ({ projects: [{ ...p, id, createdAt: new Date().toISOString() }, ...s.projects], activeProjectId: id }));
        get().log({ entity: "Project", action: "Created", detail: `${p.name} (${p.code})`, projectId: id });
        return id;
      },
      addDrawings: (ds) => {
        set((s) => ({ drawings: [...ds.map((x) => ({ ...x, id: uid("d") })), ...s.drawings] }));
        if (ds[0]) get().log({ entity: "Drawing", action: "Uploaded", detail: `${ds.length} drawing(s) uploaded`, projectId: ds[0].projectId });
      },
      updateDrawing: (id, patch) => set((s) => ({ drawings: s.drawings.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      deleteDrawing: (id) => {
        const dr = get().drawings.find((x) => x.id === id);
        set((s) => ({ drawings: s.drawings.filter((x) => x.id !== id), quantities: s.quantities.filter((x) => x.drawingId !== id) }));
        if (dr) get().log({ entity: "Drawing", action: "Deleted", detail: dr.name, projectId: dr.projectId });
      },
      addQuantities: (qs) => set((s) => ({ quantities: [...s.quantities, ...qs.map((x) => ({ ...x, id: uid("q") }))] })),
      updateQuantity: (id, patch) => {
        const prev = get().quantities.find((x) => x.id === id);
        set((s) => ({ quantities: s.quantities.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
        if (prev && (patch.status || patch.quantity !== undefined))
          get().log({ entity: "Quantity", action: patch.status ?? "Edited", detail: `${prev.element}${patch.quantity !== undefined ? `: ${prev.quantity} → ${patch.quantity} ${prev.unit}` : ""}`, projectId: prev.projectId });
      },
      upsertRate: (r) => {
        const exists = get().rates.some((x) => x.id === r.id);
        set((s) => ({ rates: exists ? s.rates.map((x) => (x.id === r.id ? r : x)) : [...s.rates, r] }));
        get().log({ entity: "Costing", action: exists ? "Rate updated" : "Rate added", detail: `${r.code} ${r.description}` });
      },
      deleteRate: (id) => set((s) => ({ rates: s.rates.filter((x) => x.id !== id) })),
      generateBoq: (projectId, name) => {
        const s = get();
        const p = s.projects.find((x) => x.id === projectId)!;
        const qs = s.quantities.filter((x) => x.projectId === projectId && x.status !== "Flagged");
        const tradeIdx = new Map<string, number>();
        const lines: BoqLine[] = qs.map((qi) => {
          const rate = suggestRate(qi, s.rates);
          const t = tradeIdx.get(qi.trade) ?? tradeIdx.size + 1;
          tradeIdx.set(qi.trade, t);
          const n = qs.filter((x, i) => x.trade === qi.trade && i <= qs.indexOf(qi)).length;
          return { id: uid("l"), ref: `${t}.${n}`, trade: qi.trade, description: rate ? `${qi.element} — ${rate.description}` : qi.element, unit: qi.unit, quantity: qi.quantity, rate: rate ? rateTotal(rate) : 0, quantityId: qi.id, rateId: rate?.id };
        });
        const id = uid("b");
        const version = s.boqs.filter((b) => b.projectId === projectId && b.name === name).length + 1;
        set({ boqs: [{ id, projectId, name, version, status: "Draft", lines, wastagePct: p.wastagePct, prelimsPct: 6, contingencyPct: p.contingencyPct, marginPct: p.marginPct, taxPct: p.taxPct, createdAt: new Date().toISOString(), createdBy: USER }, ...s.boqs] });
        get().log({ entity: "BOQ", action: "Generated", detail: `${name} v${version} — ${lines.length} lines`, projectId });
        return id;
      },
      updateBoq: (id, patch) => {
        const b = get().boqs.find((x) => x.id === id);
        set((s) => ({ boqs: s.boqs.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
        if (b && patch.status) get().log({ entity: "BOQ", action: patch.status, detail: `${b.name} v${b.version}`, projectId: b.projectId });
      },
      reviseBoq: (id) => {
        const s = get();
        const b = s.boqs.find((x) => x.id === id)!;
        const version = Math.max(...s.boqs.filter((x) => x.projectId === b.projectId && x.name === b.name).map((x) => x.version)) + 1;
        const nid = uid("b");
        set({ boqs: [{ ...b, id: nid, version, status: "Draft", createdAt: new Date().toISOString(), createdBy: USER, lines: b.lines.map((l) => ({ ...l, id: uid("l") })) }, ...s.boqs] });
        get().log({ entity: "BOQ", action: "Revised", detail: `${b.name} v${version} created from v${b.version}`, projectId: b.projectId });
        return nid;
      },
      resetDemo: () => set(seed()),
    }),
    { name: "biltflow-boq-v1" },
  ),
);

export function suggestRate(q: Pick<QuantityItem, "trade" | "unit" | "element">, rates: CostRate[]) {
  const cands = rates.filter((r) => r.trade === q.trade && r.unit === q.unit);
  const grade = q.element.match(/M\d{2}/)?.[0];
  return (grade && cands.find((r) => r.description.includes(grade))) || cands[0];
}

export const useActiveProject = () => {
  const { projects, activeProjectId } = useStore();
  return (projects.find((p) => p.id === activeProjectId) ?? projects[0])!;
};
