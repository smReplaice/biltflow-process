import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Copy, Download, FileJson, Plus, Printer, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import type { Boq, BoqLine } from "@/lib/types";
import { boqTotals, byTrade, fmtMoney, fmtNum, uid } from "@/lib/boq-math";
import { Empty, HelpTip, PageHeader, Panel, StatusPill } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { pageHead } from "@/lib/meta";

export const Route = createFileRoute("/boq/$id")({
  head: pageHead("BOQ Detail", "Editable itemised Bill of Quantities with assumptions, approvals and exports."),
  component: BoqDetail,
});

function dl(name: string, text: string, type: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name; a.click();
}

function BoqDetail() {
  const { id } = Route.useParams();
  const { boqs, projects, updateBoq, reviseBoq } = useStore();
  const nav = useNavigate();
  const b = boqs.find((x) => x.id === id);
  if (!b) return <Empty title="BOQ not found" action={<Button asChild variant="outline"><Link to="/boq">Back to register</Link></Button>} />;
  const p = projects.find((x) => x.id === b.projectId)!;
  const cur = p?.currency ?? "INR";
  const t = boqTotals(b);
  const prev = boqs.filter((x) => x.projectId === b.projectId && x.name === b.name && x.version < b.version).sort((a, c) => c.version - a.version)[0];
  const locked = b.status === "Approved";
  const setLine = (lid: string, patch: Partial<BoqLine>) => updateBoq(b.id, { lines: b.lines.map((l) => (l.id === lid ? { ...l, ...patch } : l)) });
  const pct = (k: keyof Pick<Boq, "wastagePct" | "prelimsPct" | "contingencyPct" | "marginPct" | "taxPct">, label: string, tip: string) => (
    <div className="space-y-1"><Label className="flex items-center gap-1.5 text-xs">{label}<HelpTip text={tip} /></Label><Input type="number" disabled={locked} value={b[k]} onChange={(e) => updateBoq(b.id, { [k]: Math.max(0, Number(e.target.value)) })} className="num h-8" /></div>
  );

  const csv = () => dl(`${p.code}-${b.name}-v${b.version}.csv`, ["Ref,Trade,Description,Unit,Quantity,Rate,Amount", ...b.lines.map((l) => [l.ref, l.trade, `"${l.description}"`, l.unit, l.quantity, l.rate, (l.quantity * l.rate).toFixed(2)].join(",")), "", `Direct cost,,,,,,${t.direct.toFixed(2)}`, `Grand total,,,,,,${t.total.toFixed(2)}`].join("\n"), "text/csv");

  return (
    <>
      <Link to="/boq" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />BOQ Register</Link>
      <PageHeader title={`${b.name} · v${b.version}`} subtitle={`${p.name} · ${p.standard} · created ${new Date(b.createdAt).toLocaleString()} by ${b.createdBy}`}
        actions={<>
          <StatusPill status={b.status} />
          <Button variant="outline" onClick={csv}><Download className="size-4" />Excel (CSV)</Button>
          <Button variant="outline" onClick={() => dl(`${p.code}-v${b.version}.json`, JSON.stringify({ project: p, boq: b, totals: t }, null, 2), "application/json")}><FileJson className="size-4" />JSON</Button>
          <Button variant="outline" onClick={() => window.print()}><Printer className="size-4" />PDF</Button>
          <Button variant="outline" onClick={() => { const nid = reviseBoq(b.id); toast.success("New revision created"); nav({ to: "/boq/$id", params: { id: nid } }); }}><Copy className="size-4" />New revision</Button>
          {b.status === "Draft" && <Button onClick={() => { updateBoq(b.id, { status: "In Review" }); toast.success("Submitted for approval"); }}>Submit for approval</Button>}
          {b.status === "In Review" && <><Button variant="outline" onClick={() => updateBoq(b.id, { status: "Rejected" })}>Reject</Button><Button onClick={() => { updateBoq(b.id, { status: "Approved" }); toast.success("BOQ approved and locked"); }}>Approve</Button></>}
          {b.status === "Rejected" && <Button onClick={() => updateBoq(b.id, { status: "Draft" })}>Reopen as draft</Button>}
        </>} />

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="overflow-x-auto rounded-lg border bg-card shadow-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground"><tr>
              <th className="px-3 py-2.5">Ref</th><th className="px-3 py-2.5">Trade</th><th className="px-3 py-2.5">Description</th><th className="px-3 py-2.5">Unit</th>
              <th className="px-3 py-2.5 text-right">Quantity</th><th className="px-3 py-2.5 text-right">Rate</th><th className="px-3 py-2.5 text-right">Amount</th><th className="w-10" />
            </tr></thead>
            <tbody className="divide-y">{b.lines.map((l) => (
              <tr key={l.id} className={l.rate === 0 ? "bg-destructive/5" : ""}>
                <td className="num px-3 py-1.5 text-xs">{l.ref}</td>
                <td className="px-3 py-1.5 text-xs">{l.trade}</td>
                <td className="px-3 py-1.5"><Input disabled={locked} value={l.description} onChange={(e) => setLine(l.id, { description: e.target.value })} className="h-8 min-w-64 border-transparent shadow-none hover:border-input" /></td>
                <td className="px-3 py-1.5 text-xs">{l.unit}</td>
                <td className="px-3 py-1.5"><Input disabled={locked} type="number" value={l.quantity} onChange={(e) => setLine(l.id, { quantity: Number(e.target.value) })} className="num ml-auto h-8 w-28 text-right" /></td>
                <td className="px-3 py-1.5"><Input disabled={locked} type="number" value={l.rate} onChange={(e) => setLine(l.id, { rate: Number(e.target.value) })} className="num ml-auto h-8 w-28 text-right" /></td>
                <td className="num px-3 py-1.5 text-right font-medium">{fmtMoney(l.quantity * l.rate, cur)}</td>
                <td className="px-1">{!locked && <Button size="icon" variant="ghost" className="text-destructive" aria-label="Remove line" onClick={() => { updateBoq(b.id, { lines: b.lines.filter((x) => x.id !== l.id) }); toast("Line removed", { action: { label: "Undo", onClick: () => updateBoq(b.id, { lines: b.lines }) } }); }}><Trash2 className="size-4" /></Button>}</td>
              </tr>))}</tbody>
          </table>
          {!locked && <div className="border-t p-2"><Button size="sm" variant="ghost" onClick={() => updateBoq(b.id, { lines: [...b.lines, { id: uid("l"), ref: `X.${b.lines.length + 1}`, trade: "Concrete", description: "New item", unit: "m³", quantity: 0, rate: 0 }] })}><Plus className="size-4" />Add line</Button></div>}
          {b.lines.some((l) => l.rate === 0) && <div className="border-t bg-destructive/5 px-4 py-2 text-xs text-destructive">Highlighted lines have no matched rate — enter a rate or add one in the Costing Library.</div>}
        </div>

        <div className="space-y-6">
          <Panel title="Summary">
            <dl className="space-y-2 text-sm">
              {([["Direct cost", t.direct], ["Wastage", t.wastage], ["Preliminaries", t.prelims], ["Contingency", t.contingency], ["Margin", t.margin], ["Subtotal", t.subtotal], ["Tax", t.tax]] as const).map(([k, v]) => <div key={k} className="flex justify-between"><dt className="text-muted-foreground">{k}</dt><dd className="num">{fmtMoney(v, cur)}</dd></div>)}
              <div className="flex justify-between border-t pt-2 text-base font-semibold"><dt>Grand total</dt><dd className="num text-primary">{fmtMoney(t.total, cur)}</dd></div>
              <div className="flex justify-between text-xs text-muted-foreground"><dt>Per m² GFA</dt><dd className="num">{fmtMoney(t.total / p.gfa, cur)}</dd></div>
            </dl>
          </Panel>
          <Panel title="Assumptions">
            <div className="grid grid-cols-2 gap-3">
              {pct("wastagePct", "Wastage %", "Applied on direct cost.")}
              {pct("prelimsPct", "Prelims %", "Site setup, supervision and temporary works.")}
              {pct("contingencyPct", "Contingency %", "Applied after wastage and preliminaries.")}
              {pct("marginPct", "Margin %", "Overhead and profit.")}
              {pct("taxPct", "Tax %", "Applied on the subtotal.")}
            </div>
            {locked && <p className="mt-3 text-xs text-muted-foreground">Approved BOQs are locked. Create a new revision to make changes.</p>}
          </Panel>
          <Panel title="By trade">
            <ul className="space-y-1.5 text-sm">{byTrade(b).map((x) => <li key={x.trade} className="flex justify-between"><span>{x.trade}</span><span className="num">{fmtMoney(x.value, cur)}</span></li>)}</ul>
          </Panel>
          {prev && (
            <Panel title={`Change vs v${prev.version}`}>
              {(() => { const pt = boqTotals(prev).total; const d = t.total - pt; return <div className={`num text-lg font-semibold ${d > 0 ? "text-destructive" : "text-success"}`}>{d >= 0 ? "+" : ""}{fmtMoney(d, cur)} ({fmtNum((d / (pt || 1)) * 100, 1)}%)</div>; })()}
              <Link to="/history" className="mt-2 inline-block text-xs text-primary">Full comparison →</Link>
            </Panel>
          )}
        </div>
      </div>
    </>
  );
}
