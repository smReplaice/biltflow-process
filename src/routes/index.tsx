import { createFileRoute, Link } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, FileStack, FileSpreadsheet, Gauge, Loader2, Ruler, ShieldCheck, Wallet, FolderKanban } from "lucide-react";
import { useStore } from "@/lib/store";
import { boqTotals, byTrade, fmtCompact, fmtNum } from "@/lib/boq-math";
import { Kpi, PageHeader, Panel, StatusPill, Confidence } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/meta";

export const Route = createFileRoute("/")({
  head: pageHead("Overview Dashboard", "Portfolio overview of drawings, quantities and BOQs across construction projects."),
  component: Dashboard,
});

const C = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

function Dashboard() {
  const { projects, drawings, quantities, boqs, audit } = useStore();
  const statusData = ["Processed", "Processing", "Needs Review", "Uploaded", "Failed"].map((s) => ({ name: s, value: drawings.filter((d) => d.status === s).length })).filter((x) => x.value);
  const costByProject = projects.map((p) => ({ name: p.code, value: boqs.filter((b) => b.projectId === p.id).reduce((m, b) => Math.max(m, boqTotals(b).total), 0) }));
  const latest = boqs[0];
  const tradeCost = latest ? byTrade(latest) : [];
  const qtyByTrade = Object.entries(quantities.reduce<Record<string, number>>((a, q) => ((a[q.trade] = (a[q.trade] ?? 0) + 1), a), {})).map(([trade, n]) => ({ trade, n }));
  const conf = [["<75%", 0, 0.75], ["75–90%", 0.75, 0.9], ["≥90%", 0.9, 1.01]].map(([n, lo, hi]) => ({ name: n as string, value: quantities.filter((q) => q.confidence >= (lo as number) && q.confidence < (hi as number)).length }));
  const totalValue = costByProject.reduce((s, x) => s + x.value, 0);
  const pending = quantities.filter((q) => q.status !== "Verified");

  return (
    <>
      <PageHeader title="Overview Dashboard" subtitle="Takeoff and estimation activity across all projects"
        actions={<><Button variant="outline" asChild><Link to="/drawings">Drawing library</Link></Button><Button asChild><Link to="/new-takeoff">New takeoff</Link></Button></>} />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Projects" value={projects.length} icon={<FolderKanban className="size-4" />} />
        <Kpi label="Drawings uploaded" value={drawings.length} icon={<FileStack className="size-4" />} />
        <Kpi label="Processing" value={drawings.filter((d) => d.status === "Processing").length} icon={<Loader2 className="size-4" />} />
        <Kpi label="Needs review" value={drawings.filter((d) => d.status === "Needs Review" || d.status === "Failed").length} icon={<AlertTriangle className="size-4" />} />
        <Kpi label="Quantities extracted" value={quantities.length} hint={`${quantities.filter((q) => q.status === "Verified").length} verified`} icon={<Ruler className="size-4" />} />
        <Kpi label="BOQs generated" value={boqs.length} icon={<FileSpreadsheet className="size-4" />} />
        <Kpi label="Awaiting approval" value={boqs.filter((b) => b.status === "In Review" || b.status === "Draft").length} icon={<ShieldCheck className="size-4" />} />
        <Kpi label="Est. portfolio value" value={fmtCompact(totalValue)} hint="Latest BOQ per project" icon={<Wallet className="size-4" />} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Panel title="Drawing processing status">
          <div className="h-56"><ResponsiveContainer><PieChart><Pie data={statusData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>{statusData.map((_, i) => <Cell key={i} fill={C[i % 5]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div>
          <div className="flex flex-wrap gap-3 text-xs">{statusData.map((s, i) => <span key={s.name} className="flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ background: C[i % 5] }} />{s.name} ({s.value})</span>)}</div>
        </Panel>
        <Panel title={`Cost by trade — ${latest?.name ?? "no BOQ"}`} className="lg:col-span-2">
          <div className="h-64"><ResponsiveContainer><BarChart data={tradeCost}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="trade" fontSize={11} /><YAxis fontSize={11} tickFormatter={(v) => fmtCompact(v)} /><Tooltip formatter={(v: number) => fmtCompact(v)} /><Bar dataKey="value" fill="var(--chart-1)" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
        </Panel>
        <Panel title="Estimated cost by project">
          <div className="h-56"><ResponsiveContainer><BarChart data={costByProject} layout="vertical"><XAxis type="number" fontSize={11} tickFormatter={(v) => fmtCompact(v)} /><YAxis type="category" dataKey="name" fontSize={11} width={70} /><Tooltip formatter={(v: number) => fmtCompact(v)} /><Bar dataKey="value" fill="var(--chart-3)" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></div>
        </Panel>
        <Panel title="Quantity items by trade">
          <div className="h-56"><ResponsiveContainer><BarChart data={qtyByTrade}><XAxis dataKey="trade" fontSize={10} interval={0} angle={-30} textAnchor="end" height={60} /><YAxis fontSize={11} allowDecimals={false} /><Tooltip /><Bar dataKey="n" name="Items" fill="var(--chart-2)" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
        </Panel>
        <Panel title="Extraction confidence" action={<Gauge className="size-4 text-muted-foreground" />}>
          <div className="h-56"><ResponsiveContainer><BarChart data={conf}><XAxis dataKey="name" fontSize={11} /><YAxis fontSize={11} allowDecimals={false} /><Tooltip /><Bar dataKey="value" name="Items" radius={[4, 4, 0, 0]}>{conf.map((_, i) => <Cell key={i} fill={["var(--destructive)", "var(--warning)", "var(--success)"][i]} />)}</Bar></BarChart></ResponsiveContainer></div>
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Pending quantity verifications" action={<Link to="/takeoff" className="text-xs text-primary">Open takeoff →</Link>}>
          <ul className="divide-y">{pending.slice(0, 6).map((q) => (
            <li key={q.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <div className="min-w-0"><div className="truncate font-medium">{q.element}</div><div className="num text-xs text-muted-foreground">{fmtNum(q.quantity)} {q.unit} · {q.level}</div></div>
              <div className="flex items-center gap-3"><Confidence value={q.confidence} /><StatusPill status={q.status} /></div>
            </li>))}</ul>
        </Panel>
        <Panel title="Processing activity" action={<Link to="/history" className="text-xs text-primary">Full audit trail →</Link>}>
          <ul className="space-y-3">{audit.slice(0, 7).map((a) => (
            <li key={a.id} className="flex gap-3 text-sm">
              <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
              <div><div><span className="font-medium">{a.entity} {a.action.toLowerCase()}</span> — <span className="text-muted-foreground">{a.detail}</span></div><div className="text-xs text-muted-foreground">{a.user} · {new Date(a.at).toLocaleString()}</div></div>
            </li>))}</ul>
        </Panel>
      </div>
    </>
  );
}
