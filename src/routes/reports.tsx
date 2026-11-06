import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useStore } from "@/lib/store";
import { boqTotals, fmtCompact, fmtMoney } from "@/lib/boq-math";
import { Kpi, PageHeader, Panel } from "@/components/app/ui";
import { pageHead } from "@/lib/meta";

export const Route = createFileRoute("/reports")({
  head: pageHead("Reports & Analytics", "Cost per square metre, trade breakdowns and revision trends across projects."),
  component: Reports,
});

function Reports() {
  const { projects, boqs, quantities } = useStore();
  const perProject = projects.map((p) => {
    const latest = boqs.filter((b) => b.projectId === p.id).sort((a, b) => b.version - a.version)[0];
    const t = latest ? boqTotals(latest) : null;
    return { name: p.code, total: t?.total ?? 0, direct: t?.direct ?? 0, perSqm: t ? t.total / p.gfa : 0 };
  });
  const trend = [...boqs].sort((a, b) => a.createdAt.localeCompare(b.createdAt)).map((b) => ({ name: `${b.name.split(" ")[0]} v${b.version}`, total: boqTotals(b).total }));
  const verifiedPct = quantities.length ? Math.round((quantities.filter((q) => q.status === "Verified").length / quantities.length) * 100) : 0;

  return (
    <>
      <PageHeader title="Reports & Analytics" subtitle="Based on the latest BOQ revision per project" />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Portfolio value" value={fmtCompact(perProject.reduce((s, x) => s + x.total, 0))} />
        <Kpi label="Avg cost / m²" value={fmtMoney(perProject.filter((x) => x.perSqm).reduce((s, x, _, arr) => s + x.perSqm / arr.length, 0))} />
        <Kpi label="Verified quantities" value={`${verifiedPct}%`} />
        <Kpi label="Approved BOQs" value={boqs.filter((b) => b.status === "Approved").length} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Direct cost vs total by project"><div className="h-72"><ResponsiveContainer><BarChart data={perProject}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="name" fontSize={11} /><YAxis fontSize={11} tickFormatter={(v) => fmtCompact(v)} /><Tooltip formatter={(v: number) => fmtMoney(v)} /><Legend /><Bar dataKey="direct" name="Direct" fill="var(--chart-2)" radius={[4, 4, 0, 0]} /><Bar dataKey="total" name="Total incl. tax" fill="var(--chart-1)" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></Panel>
        <Panel title="BOQ revision trend"><div className="h-72"><ResponsiveContainer><LineChart data={trend}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="name" fontSize={11} /><YAxis fontSize={11} tickFormatter={(v) => fmtCompact(v)} /><Tooltip formatter={(v: number) => fmtMoney(v)} /><Line dataKey="total" stroke="var(--chart-1)" strokeWidth={2} dot /></LineChart></ResponsiveContainer></div></Panel>
        <Panel title="Cost per m² GFA" className="lg:col-span-2"><div className="h-64"><ResponsiveContainer><BarChart data={perProject}><XAxis dataKey="name" fontSize={11} /><YAxis fontSize={11} tickFormatter={(v) => fmtCompact(v)} /><Tooltip formatter={(v: number) => fmtMoney(v)} /><Bar dataKey="perSqm" name="Per m²" fill="var(--chart-3)" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></Panel>
      </div>
    </>
  );
}
