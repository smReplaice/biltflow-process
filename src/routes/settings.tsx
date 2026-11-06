import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { PageHeader, Panel } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { pageHead } from "@/lib/meta";

export const Route = createFileRoute("/settings")({
  head: pageHead("Settings", "Platform integrations, processing preferences and demo data controls."),
  component: Settings,
});

const INTEGRATIONS = [
  { name: "BiltFlow Pulse", desc: "Push approved BOQ budgets into project cost tracking." },
  { name: "BiltFlow ProcureFlow", desc: "Create procurement packages from BOQ trades." },
  { name: "BiltFlow Vault", desc: "Archive drawings, BOQs and approvals." },
  { name: "Autodesk Platform Services", desc: "CAD translation and viewer for DWG/DXF/DWF files." },
];

function Settings() {
  const reset = useStore((s) => s.resetDemo);
  const [on, setOn] = useState<Record<string, boolean>>({});
  return (
    <>
      <PageHeader title="Settings" />
      <div className="grid max-w-4xl gap-6">
        <Panel title="Integrations">
          <ul className="divide-y">{INTEGRATIONS.map((i) => (
            <li key={i.name} className="flex items-center justify-between py-3">
              <div><div className="font-medium">{i.name}</div><div className="text-sm text-muted-foreground">{i.desc}</div></div>
              <div className="flex items-center gap-3"><span className="text-xs text-muted-foreground">{on[i.name] ? "Enabled (not yet connected)" : "Not connected"}</span><Switch checked={!!on[i.name]} onCheckedChange={(c) => setOn({ ...on, [i.name]: c })} /></div>
            </li>))}</ul>
        </Panel>
        <Panel title="Demo data">
          <p className="mb-4 text-sm text-muted-foreground">All data is stored in this browser. Resetting restores the sample projects, drawings, rates and BOQs.</p>
          <AlertDialog>
            <AlertDialogTrigger asChild><Button variant="destructive">Reset demo data</Button></AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader><AlertDialogTitle>Reset all data?</AlertDialogTitle><AlertDialogDescription>Your projects, uploads and BOQ edits will be replaced with the sample data.</AlertDialogDescription></AlertDialogHeader>
              <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => { reset(); toast.success("Demo data restored"); }}>Reset</AlertDialogAction></AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </Panel>
      </div>
    </>
  );
}
