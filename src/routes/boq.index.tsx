import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useActiveProject, useStore } from "@/lib/store";
import { boqTotals, fmtMoney } from "@/lib/boq-math";
import { Empty, PageHeader, StatusPill } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { pageHead } from "@/lib/meta";

export const Route = createFileRoute("/boq/")({
  head: pageHead("BOQ Register", "All generated Bills of Quantities with versions, status and totals."),
  component: Register,
});

function Register() {
  const project = useActiveProject();
  const { boqs, projects, quantities, generateBoq } = useStore();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("Main Works BOQ");
  const nav = useNavigate();
  const qs = quantities.filter((q) => q.projectId === project.id);
  const usable = qs.filter((q) => q.status !== "Flagged").length;

  return (
    <>
      <PageHeader title="BOQ Register" subtitle={`${boqs.length} BOQs across all projects`} actions={<Button onClick={() => setOpen(true)}><Sparkles className="size-4" />Generate BOQ</Button>} />
      {boqs.length === 0 ? <Empty title="No BOQs yet" body="Generate a BOQ from verified quantities." /> : (
        <div className="overflow-x-auto rounded-lg border bg-card shadow-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground"><tr>
              <th className="px-4 py-2.5">BOQ</th><th className="px-4 py-2.5">Project</th><th className="px-4 py-2.5">Version</th><th className="px-4 py-2.5">Lines</th><th className="px-4 py-2.5">Created</th><th className="px-4 py-2.5">Status</th><th className="px-4 py-2.5 text-right">Total incl. tax</th>
            </tr></thead>
            <tbody className="divide-y">{boqs.map((b) => {
              const p = projects.find((x) => x.id === b.projectId);
              return (
                <tr key={b.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3"><Link to="/boq/$id" params={{ id: b.id }} className="font-medium text-primary hover:underline">{b.name}</Link></td>
                  <td className="px-4 py-3">{p?.name}</td>
                  <td className="num px-4 py-3">v{b.version}</td>
                  <td className="num px-4 py-3">{b.lines.length}</td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(b.createdAt).toLocaleDateString()} · {b.createdBy}</td>
                  <td className="px-4 py-3"><StatusPill status={b.status} /></td>
                  <td className="num px-4 py-3 text-right font-semibold">{fmtMoney(boqTotals(b).total, p?.currency)}</td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Generate BOQ</DialogTitle><DialogDescription>For {project.name}. Quantities are matched to rates by trade, unit and concrete grade. Flagged quantities are excluded.</DialogDescription></DialogHeader>
          <div className="space-y-1.5"><Label>BOQ name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="rounded-md bg-muted p-3 text-sm"><span className="num font-semibold">{usable}</span> of <span className="num">{qs.length}</span> quantities will be included.</div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button disabled={!usable || !name.trim()} onClick={() => { const id = generateBoq(project.id, name.trim()); toast.success("BOQ generated"); setOpen(false); nav({ to: "/boq/$id", params: { id } }); }}>Generate</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
