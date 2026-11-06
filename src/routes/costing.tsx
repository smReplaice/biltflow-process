import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Download, Pencil, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import type { CostRate, Trade } from "@/lib/types";
import { fmtMoney, rateTotal, uid } from "@/lib/boq-math";
import { PageHeader } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { pageHead } from "@/lib/meta";

export const Route = createFileRoute("/costing")({
  head: pageHead("Costing Library", "Trade cost sheets with material, labour and plant rates used to price BOQs."),
  component: Costing,
});

const TRADES: Trade[] = ["Concrete", "Reinforcement", "Formwork", "Masonry", "Plastering", "Flooring", "Doors & Windows", "Painting", "Waterproofing", "Earthwork"];

function download(name: string, text: string, type: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name; a.click();
}

function Costing() {
  const { rates, upsertRate, deleteRate } = useStore();
  const [trade, setTrade] = useState<string>("all");
  const [edit, setEdit] = useState<CostRate | null>(null);
  const file = useRef<HTMLInputElement>(null);
  const list = rates.filter((r) => trade === "all" || r.trade === trade);

  const importCsv = async (f?: File) => {
    if (!f) return;
    const rows = (await f.text()).trim().split(/\r?\n/).slice(1);
    let n = 0;
    for (const row of rows) {
      const [code = "", tr = "", description = "", unit = "", m = "", l = "", p = ""] = row.split(",").map((s) => s.trim());
      if (!code || !TRADES.includes(tr as Trade) || isNaN(+m)) continue;
      const existing = rates.find((r) => r.code === code);
      upsertRate({ id: existing?.id ?? uid("r"), code, trade: tr as Trade, description, unit, material: +m, labour: +l || 0, plant: +p || 0, sheetVersion: "imported" });
      n++;
    }
    toast[n ? "success" : "error"](n ? `Imported ${n} rate(s)` : "No valid rows. Expected: code,trade,description,unit,material,labour,plant");
  };

  return (
    <>
      <PageHeader title="Costing Library" subtitle={`Rate sheet v2.3 · ${rates.length} rates`} actions={<>
        <Button variant="outline" onClick={() => download("rates.csv", "code,trade,description,unit,material,labour,plant\n" + rates.map((r) => [r.code, r.trade, r.description, r.unit, r.material, r.labour, r.plant].join(",")).join("\n"), "text/csv")}><Download className="size-4" />Export CSV</Button>
        <Button variant="outline" onClick={() => file.current?.click()}><Upload className="size-4" />Import CSV</Button>
        <input ref={file} type="file" accept=".csv" className="hidden" onChange={(e) => importCsv(e.target.files?.[0])} />
        <Button onClick={() => setEdit({ id: uid("r"), code: "", trade: "Concrete", description: "", unit: "m³", material: 0, labour: 0, plant: 0, sheetVersion: "v2.3" })}><Plus className="size-4" />Add rate</Button>
      </>} />
      <div className="mb-4 flex flex-wrap gap-2">
        {["all", ...TRADES].map((t) => <Button key={t} size="sm" variant={trade === t ? "default" : "outline"} onClick={() => setTrade(t)}>{t === "all" ? "All trades" : t}</Button>)}
      </div>
      <div className="overflow-x-auto rounded-lg border bg-card shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground"><tr>
            <th className="px-4 py-2.5">Code</th><th className="px-4 py-2.5">Trade</th><th className="px-4 py-2.5">Description</th><th className="px-4 py-2.5">Unit</th>
            <th className="px-4 py-2.5 text-right">Material</th><th className="px-4 py-2.5 text-right">Labour</th><th className="px-4 py-2.5 text-right">Plant</th><th className="px-4 py-2.5 text-right">All-in rate</th><th className="w-24" />
          </tr></thead>
          <tbody className="divide-y">{list.map((r) => (
            <tr key={r.id} className="hover:bg-muted/30">
              <td className="px-4 py-2.5 font-mono text-xs">{r.code}</td><td className="px-4 py-2.5">{r.trade}</td><td className="px-4 py-2.5">{r.description}</td><td className="px-4 py-2.5">{r.unit}</td>
              <td className="num px-4 py-2.5 text-right">{fmtMoney(r.material)}</td><td className="num px-4 py-2.5 text-right">{fmtMoney(r.labour)}</td><td className="num px-4 py-2.5 text-right">{fmtMoney(r.plant)}</td>
              <td className="num px-4 py-2.5 text-right font-semibold">{fmtMoney(rateTotal(r))}</td>
              <td className="px-2"><div className="flex"><Button size="icon" variant="ghost" onClick={() => setEdit(r)} aria-label="Edit"><Pencil className="size-4" /></Button><Button size="icon" variant="ghost" className="text-destructive" aria-label="Delete" onClick={() => { deleteRate(r.id); toast("Rate deleted", { action: { label: "Undo", onClick: () => upsertRate(r) } }); }}><Trash2 className="size-4" /></Button></div></td>
            </tr>))}</tbody>
        </table>
      </div>
      {edit && <RateDialog rate={edit} onClose={() => setEdit(null)} onSave={(r) => { upsertRate(r); setEdit(null); toast.success("Rate saved"); }} />}
    </>
  );
}

function RateDialog({ rate, onClose, onSave }: { rate: CostRate; onClose: () => void; onSave: (r: CostRate) => void }) {
  const [r, setR] = useState(rate);
  const valid = r.code.trim() && r.description.trim() && r.unit.trim() && r.material >= 0 && r.labour >= 0 && r.plant >= 0;
  const num = (k: "material" | "labour" | "plant") => <div className="space-y-1.5"><Label className="capitalize">{k}</Label><Input type="number" min={0} value={r[k]} onChange={(e) => setR({ ...r, [k]: Number(e.target.value) })} /></div>;
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{rate.code ? `Edit ${rate.code}` : "Add rate"}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5"><Label>Code</Label><Input value={r.code} onChange={(e) => setR({ ...r, code: e.target.value.toUpperCase() })} placeholder="CON-045" /></div>
          <div className="space-y-1.5"><Label>Trade</Label><Select value={r.trade} onValueChange={(v) => setR({ ...r, trade: v as Trade })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TRADES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
          <div className="col-span-2 space-y-1.5"><Label>Description</Label><Input value={r.description} onChange={(e) => setR({ ...r, description: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Unit</Label><Input value={r.unit} onChange={(e) => setR({ ...r, unit: e.target.value })} placeholder="m³, m², MT, nos" /></div>
          {num("material")}{num("labour")}{num("plant")}
        </div>
        <div className="text-sm text-muted-foreground">All-in rate: <span className="num font-semibold text-foreground">{fmtMoney(rateTotal(r))}</span></div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button disabled={!valid} onClick={() => onSave(r)}>Save rate</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
