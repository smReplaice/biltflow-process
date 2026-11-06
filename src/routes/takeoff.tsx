import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CheckCheck, Flag, Search } from "lucide-react";
import { toast } from "sonner";
import { useActiveProject, useStore, suggestRate } from "@/lib/store";
import { fmtNum, fmtMoney, rateTotal } from "@/lib/boq-math";
import { Confidence, Empty, Kpi, PageHeader, StatusPill } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { pageHead } from "@/lib/meta";

export const Route = createFileRoute("/takeoff")({
  head: pageHead("Quantity Takeoff", "Review, correct, verify and map extracted quantities to cost rates."),
  component: Takeoff,
});

function Takeoff() {
  const project = useActiveProject();
  const { quantities, drawings, rates, updateQuantity } = useStore();
  const [q, setQ] = useState("");
  const [trade, setTrade] = useState("all");
  const [status, setStatus] = useState("all");
  const [sel, setSel] = useState<Set<string>>(new Set());
  const all = quantities.filter((x) => x.projectId === project.id);
  const list = useMemo(() => all.filter((x) => (trade === "all" || x.trade === trade) && (status === "all" || x.status === status) && x.element.toLowerCase().includes(q.toLowerCase())), [all, trade, status, q]);
  const trades = [...new Set(all.map((x) => x.trade))];
  const bulk = (s: "Verified" | "Flagged") => { sel.forEach((id) => updateQuantity(id, { status: s })); toast.success(`${sel.size} item(s) marked ${s.toLowerCase()}`); setSel(new Set()); };

  return (
    <>
      <PageHeader title="Quantity Takeoff" subtitle={`${project.name} · review extracted quantities before costing`}
        actions={<Button asChild><Link to="/boq">Generate BOQ →</Link></Button>} />
      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Items" value={all.length} />
        <Kpi label="Verified" value={all.filter((x) => x.status === "Verified").length} />
        <Kpi label="Pending" value={all.filter((x) => x.status === "Pending").length} />
        <Kpi label="Flagged" value={all.filter((x) => x.status === "Flagged").length} hint="Excluded from BOQ generation" />
      </div>
      <div className="sticky top-16 z-20 -mx-2 mb-3 flex flex-wrap items-center gap-3 bg-background/95 px-2 py-2 backdrop-blur">
        <div className="relative w-64"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search elements…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <Select value={trade} onValueChange={setTrade}><SelectTrigger className="w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All trades</SelectItem>{trades.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
        <Select value={status} onValueChange={setStatus}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem>{["Pending", "Verified", "Flagged"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
        {sel.size > 0 && <div className="ml-auto flex gap-2"><span className="self-center text-sm text-muted-foreground">{sel.size} selected</span><Button size="sm" onClick={() => bulk("Verified")}><CheckCheck className="size-4" />Verify</Button><Button size="sm" variant="outline" onClick={() => bulk("Flagged")}><Flag className="size-4" />Flag</Button></div>}
      </div>
      {list.length === 0 ? <Empty title="No quantities" body="Process drawings in the Drawing Library to extract quantities." action={<Button asChild variant="outline"><Link to="/drawings">Go to drawings</Link></Button>} /> : (
        <div className="overflow-x-auto rounded-lg border bg-card shadow-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="w-10 px-3 py-2.5"><Checkbox checked={sel.size === list.length} onCheckedChange={(c) => setSel(c ? new Set(list.map((x) => x.id)) : new Set())} aria-label="Select all" /></th>
                <th className="px-3 py-2.5">Element</th><th className="px-3 py-2.5">Trade</th><th className="px-3 py-2.5">Source drawing</th><th className="px-3 py-2.5">Level</th>
                <th className="px-3 py-2.5 text-right">Quantity</th><th className="px-3 py-2.5">Unit</th><th className="px-3 py-2.5">Confidence</th><th className="px-3 py-2.5">Mapped rate</th><th className="px-3 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {list.map((x) => {
                const r = suggestRate(x, rates);
                return (
                  <tr key={x.id} className="hover:bg-muted/30">
                    <td className="px-3 py-2"><Checkbox checked={sel.has(x.id)} onCheckedChange={(c) => { const n = new Set(sel); c ? n.add(x.id) : n.delete(x.id); setSel(n); }} aria-label={`Select ${x.element}`} /></td>
                    <td className="px-3 py-2 font-medium">{x.element}{x.note && <div className="text-[11px] font-normal text-warning-foreground">{x.note}</div>}</td>
                    <td className="px-3 py-2">{x.trade}</td>
                    <td className="max-w-48 truncate px-3 py-2 text-muted-foreground">{drawings.find((d) => d.id === x.drawingId)?.name ?? "—"}</td>
                    <td className="px-3 py-2">{x.level}</td>
                    <td className="px-3 py-2 text-right"><Input type="number" defaultValue={x.quantity} className="num ml-auto h-8 w-28 text-right" onBlur={(e) => { const v = Number(e.target.value); if (v !== x.quantity && v >= 0) { updateQuantity(x.id, { quantity: v }); toast.success("Quantity updated"); } }} /></td>
                    <td className="px-3 py-2">{x.unit}</td>
                    <td className="px-3 py-2"><Confidence value={x.confidence} /></td>
                    <td className="px-3 py-2 text-xs">{r ? <><div className="font-mono">{r.code}</div><div className="num text-muted-foreground">{fmtMoney(rateTotal(r))}/{r.unit}</div></> : <span className="text-destructive">No matching rate</span>}</td>
                    <td className="px-3 py-2">
                      <Select value={x.status} onValueChange={(v) => updateQuantity(x.id, { status: v as typeof x.status })}><SelectTrigger className="h-8 w-32 border-none p-0 shadow-none"><StatusPill status={x.status} /></SelectTrigger><SelectContent>{["Pending", "Verified", "Flagged"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="border-t px-4 py-2 text-xs text-muted-foreground">Total rows: <span className="num">{fmtNum(list.length, 0)}</span></div>
        </div>
      )}
    </>
  );
}
