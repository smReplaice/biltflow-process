import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Search } from "lucide-react";
import { useStore } from "@/lib/store";
import { boqTotals, fmtCompact, fmtNum } from "@/lib/boq-math";
import { Empty, PageHeader, StatusPill } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { pageHead } from "@/lib/meta";

export const Route = createFileRoute("/projects")({
  head: pageHead("Projects", "All construction projects with drawings, takeoff progress and estimated value."),
  component: Projects,
});

function Projects() {
  const { projects, drawings, quantities, boqs, setActiveProject } = useStore();
  const [q, setQ] = useState("");
  const nav = useNavigate();
  const list = projects.filter((p) => (p.name + p.code + p.client + p.location).toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <PageHeader title="Projects" subtitle={`${projects.length} projects`} actions={<Button asChild><Link to="/new-takeoff">New project</Link></Button>} />
      <div className="relative mb-4 max-w-sm"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search name, code, client…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      {list.length === 0 ? <Empty title="No matching projects" body="Try a different search or create a new project." /> : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((p) => {
            const dr = drawings.filter((d) => d.projectId === p.id);
            const qs = quantities.filter((x) => x.projectId === p.id);
            const best = boqs.filter((b) => b.projectId === p.id)[0];
            return (
              <button key={p.id} onClick={() => { setActiveProject(p.id); nav({ to: "/drawings" }); }} className="rounded-lg border bg-card p-5 text-left shadow-card transition hover:border-primary/50">
                <div className="flex items-start justify-between gap-2"><div><div className="num text-xs text-muted-foreground">{p.code}</div><div className="mt-0.5 font-semibold">{p.name}</div></div><StatusPill status={p.status} /></div>
                <div className="mt-1 text-sm text-muted-foreground">{p.client} · {p.location}</div>
                <dl className="mt-4 grid grid-cols-4 gap-2 border-t pt-4 text-xs">
                  <div><dt className="text-muted-foreground">GFA</dt><dd className="num font-medium">{fmtNum(p.gfa, 0)} m²</dd></div>
                  <div><dt className="text-muted-foreground">Drawings</dt><dd className="num font-medium">{dr.length}</dd></div>
                  <div><dt className="text-muted-foreground">Qty items</dt><dd className="num font-medium">{qs.length}</dd></div>
                  <div><dt className="text-muted-foreground">Latest BOQ</dt><dd className="num font-medium">{best ? fmtCompact(boqTotals(best).total) : "—"}</dd></div>
                </dl>
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}
