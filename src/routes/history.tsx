import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { boqTotals, fmtMoney, fmtNum } from "@/lib/boq-math";
import { Empty, PageHeader, Panel } from "@/components/app/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { pageHead } from "@/lib/meta";

export const Route = createFileRoute("/history")({
  head: pageHead("History & Versions", "Audit trail and BOQ revision comparison with cost impact analysis."),
  component: History,
});

function History() {
  const { audit, boqs, projects } = useStore();
  const [entity, setEntity] = useState("all");
  const [a, setA] = useState(boqs[1]?.id ?? "");
  const [b, setB] = useState(boqs[0]?.id ?? "");
  const A = boqs.find((x) => x.id === a), B = boqs.find((x) => x.id === b);
  const rows = A && B ? diff(A.lines, B.lines) : [];
  const label = (id: string) => { const x = boqs.find((y) => y.id === id)!; return `${projects.find((p) => p.id === x.projectId)?.code} · ${x.name} v${x.version}`; };

  return (
    <>
      <PageHeader title="History & Versions" subtitle="Every change to projects, drawings, quantities, rates and BOQs" />
      <Tabs defaultValue="audit">
        <TabsList><TabsTrigger value="audit">Audit trail</TabsTrigger><TabsTrigger value="compare">Compare revisions</TabsTrigger></TabsList>
        <TabsContent value="audit" className="mt-4">
          <Select value={entity} onValueChange={setEntity}><SelectTrigger className="mb-4 w-48"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All entities</SelectItem>{["Project", "Drawing", "Quantity", "Costing", "BOQ"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select>
          <div className="overflow-x-auto rounded-lg border bg-card shadow-card">
            <table className="w-full text-sm"><thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-4 py-2.5">When</th><th className="px-4 py-2.5">User</th><th className="px-4 py-2.5">Entity</th><th className="px-4 py-2.5">Action</th><th className="px-4 py-2.5">Detail</th></tr></thead>
              <tbody className="divide-y">{audit.filter((x) => entity === "all" || x.entity === entity).map((x) => (
                <tr key={x.id}><td className="whitespace-nowrap px-4 py-2.5 text-muted-foreground">{new Date(x.at).toLocaleString()}</td><td className="px-4 py-2.5">{x.user}</td><td className="px-4 py-2.5">{x.entity}</td><td className="px-4 py-2.5 font-medium">{x.action}</td><td className="px-4 py-2.5">{x.detail}</td></tr>
              ))}</tbody></table>
          </div>
        </TabsContent>
        <TabsContent value="compare" className="mt-4">
          {boqs.length < 2 ? <Empty title="Need at least two BOQs" body="Create a new revision from any BOQ to compare." /> : (
            <>
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <Select value={a} onValueChange={setA}><SelectTrigger className="w-80"><SelectValue placeholder="Base" /></SelectTrigger><SelectContent>{boqs.map((x) => <SelectItem key={x.id} value={x.id}>{label(x.id)}</SelectItem>)}</SelectContent></Select>
                <span className="text-muted-foreground">→</span>
                <Select value={b} onValueChange={setB}><SelectTrigger className="w-80"><SelectValue placeholder="Compare" /></SelectTrigger><SelectContent>{boqs.map((x) => <SelectItem key={x.id} value={x.id}>{label(x.id)}</SelectItem>)}</SelectContent></Select>
              </div>
              {A && B && (() => {
                const ta = boqTotals(A).total, tb = boqTotals(B).total, d = tb - ta;
                return (
                  <Panel title={`Impact: ${fmtMoney(ta)} → ${fmtMoney(tb)}`} action={<span className={cn("num font-semibold", d > 0 ? "text-destructive" : "text-success")}>{d >= 0 ? "+" : ""}{fmtMoney(d)} ({fmtNum((d / (ta || 1)) * 100, 1)}%)</span>}>
                    <table className="w-full text-sm"><thead className="text-left text-xs uppercase text-muted-foreground"><tr><th className="py-2">Item</th><th className="py-2 text-right">Base qty</th><th className="py-2 text-right">New qty</th><th className="py-2 text-right">Base amount</th><th className="py-2 text-right">New amount</th><th className="py-2 text-right">Δ</th></tr></thead>
                      <tbody className="divide-y">{rows.map((r) => (
                        <tr key={r.key} className={r.delta === 0 ? "text-muted-foreground" : ""}><td className="py-2">{r.key}{r.kind !== "changed" && <span className="ml-2 rounded bg-muted px-1.5 text-[10px] uppercase">{r.kind}</span>}</td><td className="num py-2 text-right">{fmtNum(r.qa)}</td><td className="num py-2 text-right">{fmtNum(r.qb)}</td><td className="num py-2 text-right">{fmtMoney(r.aa)}</td><td className="num py-2 text-right">{fmtMoney(r.ab)}</td><td className={cn("num py-2 text-right", r.delta > 0 ? "text-destructive" : r.delta < 0 ? "text-success" : "")}>{fmtMoney(r.delta)}</td></tr>
                      ))}</tbody></table>
                  </Panel>
                );
              })()}
            </>
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}

function diff(a: { description: string; quantity: number; rate: number }[], b: typeof a) {
  const keys = [...new Set([...a, ...b].map((l) => l.description))];
  return keys.map((key) => {
    const x = a.find((l) => l.description === key), y = b.find((l) => l.description === key);
    const aa = x ? x.quantity * x.rate : 0, ab = y ? y.quantity * y.rate : 0;
    return { key, kind: !x ? "added" : !y ? "removed" : "changed", qa: x?.quantity ?? 0, qb: y?.quantity ?? 0, aa, ab, delta: ab - aa };
  });
}
