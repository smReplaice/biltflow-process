import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { z } from "zod";
import { Eye, Play, RotateCcw, Search, Trash2, UploadCloud, Layers, ZoomIn, ZoomOut } from "lucide-react";
import { toast } from "sonner";
import { useActiveProject, useStore } from "@/lib/store";
import type { Drawing } from "@/lib/types";
import { classify, PIPELINE } from "@/components/app/processing";
import { Confidence, DrawingThumb, Empty, PageHeader, StatusPill } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { fmtNum } from "@/lib/boq-math";
import { cn } from "@/lib/utils";
import { pageHead } from "@/lib/meta";

export const Route = createFileRoute("/drawings")({
  validateSearch: z.object({ upload: z.boolean().optional() }),
  head: pageHead("Drawing Library", "Upload, classify, preview and process DWG, DXF, DWF and PDF drawings."),
  component: Library,
});

const OK = /\.(dwg|dxf|dwf|pdf)$/i;

function Library() {
  const project = useActiveProject();
  const { drawings, addDrawings, updateDrawing, deleteDrawing } = useStore();
  const { upload } = Route.useSearch();
  const nav = useNavigate({ from: "/drawings" });
  const [q, setQ] = useState("");
  const [disc, setDisc] = useState("all");
  const [status, setStatus] = useState("all");
  const [viewing, setViewing] = useState<Drawing | null>(null);
  const [del, setDel] = useState<Drawing | null>(null);
  const list = useMemo(() => drawings.filter((d) => d.projectId === project.id && (disc === "all" || d.discipline === disc) && (status === "all" || d.status === status) && d.name.toLowerCase().includes(q.toLowerCase())), [drawings, project.id, disc, status, q]);

  const onFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const good = [...files].filter((f) => OK.test(f.name));
    const bad = files.length - good.length;
    if (bad) toast.error(`${bad} file(s) skipped — only DWG, DXF, DWF and PDF are supported`);
    if (!good.length) return;
    addDrawings(good.map((f) => ({
      projectId: project.id, name: f.name.replace(/\.[^.]+$/, ""), format: f.name.split(".").pop()!.toUpperCase() as Drawing["format"],
      ...classify(f.name), level: "TBC", revision: "R1", sizeKb: Math.round(f.size / 1024), status: "Uploaded", progress: 0,
      uploadedAt: new Date().toISOString(), uploadedBy: "Ananya Rao", demo: true,
    })));
    toast.success(`${good.length} drawing(s) uploaded and auto-classified`);
    nav({ search: {} });
  };

  return (
    <>
      <PageHeader title="Drawing Library" subtitle={`${project.name} · ${list.length} drawings`}
        actions={<>
          <Button variant="outline" onClick={() => { const n = list.filter((d) => d.status === "Uploaded" || d.status === "Failed"); n.forEach((d) => updateDrawing(d.id, { status: "Processing", progress: 0 })); toast(n.length ? `Started extraction on ${n.length} drawing(s)` : "No drawings waiting to process"); }}><Play className="size-4" />Process all pending</Button>
          <Button onClick={() => nav({ search: { upload: true } })}><UploadCloud className="size-4" />Upload drawings</Button>
        </>} />
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative w-72"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search drawings…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <Select value={disc} onValueChange={setDisc}><SelectTrigger className="w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All disciplines</SelectItem>{["Architectural", "Structural", "MEP", "Civil"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select>
        <Select value={status} onValueChange={setStatus}><SelectTrigger className="w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem>{["Uploaded", "Processing", "Needs Review", "Processed", "Failed"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select>
      </div>

      {list.length === 0 ? <Empty title="No drawings yet" body="Upload DWG, DXF, DWF or PDF drawings to start a quantity takeoff." action={<Button onClick={() => nav({ search: { upload: true } })}>Upload drawings</Button>} /> : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {list.map((d) => (
            <div key={d.id} className="overflow-hidden rounded-lg border bg-card shadow-card">
              <button className="relative block w-full" onClick={() => setViewing(d)}>
                <DrawingThumb seed={d.id} className="aspect-[16/10] w-full" />
                <span className="absolute left-2 top-2 rounded bg-card px-1.5 py-0.5 font-mono text-[10px] font-semibold">{d.format}</span>
                <span className="absolute right-2 top-2 rounded-full bg-card"><StatusPill status={d.status} /></span>
              </button>
              <div className="space-y-2 p-4">
                <div className="truncate text-sm font-medium" title={d.name}>{d.name}</div>
                <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground"><span>{d.discipline}</span><span>{d.sheetType}</span><span>{d.level}</span><span>{d.revision}</span><span className="num">{fmtNum(d.sizeKb / 1024, 1)} MB</span></div>
                {d.status === "Processing" ? (
                  <div><Progress value={d.progress} className="h-1.5" /><div className="mt-1 text-xs text-primary">{PIPELINE[Math.min(5, Math.floor(d.progress / 17))]} · {Math.round(d.progress)}%</div></div>
                ) : <div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">Classification</span><Confidence value={d.classificationConfidence} /></div>}
                <div className="flex gap-1 border-t pt-2">
                  <Button size="sm" variant="ghost" onClick={() => setViewing(d)}><Eye className="size-4" />View</Button>
                  {(d.status === "Uploaded" || d.status === "Failed") && <Button size="sm" variant="ghost" onClick={() => updateDrawing(d.id, { status: "Processing", progress: 0 })}>{d.status === "Failed" ? <RotateCcw className="size-4" /> : <Play className="size-4" />}{d.status === "Failed" ? "Retry" : "Process"}</Button>}
                  {d.status === "Needs Review" && <Button size="sm" variant="ghost" onClick={() => { updateDrawing(d.id, { status: "Processed", classificationConfidence: 1 }); toast.success("Classification confirmed"); }}>Confirm</Button>}
                  <Button size="sm" variant="ghost" className="ml-auto text-destructive" onClick={() => setDel(d)} aria-label="Delete"><Trash2 className="size-4" /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <UploadDialog open={!!upload} onClose={() => nav({ search: {} })} onFiles={onFiles} />
      {viewing && <Viewer d={viewing} onClose={() => setViewing(null)} onReclassify={(patch) => { updateDrawing(viewing.id, patch); setViewing({ ...viewing, ...patch }); }} />}
      <AlertDialog open={!!del} onOpenChange={(o) => !o && setDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete drawing?</AlertDialogTitle><AlertDialogDescription>{del?.name} and its extracted quantities will be removed.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => {
            const d = del!; const qs = useStore.getState().quantities.filter((x) => x.drawingId === d.id);
            deleteDrawing(d.id);
            toast("Drawing deleted", { action: { label: "Undo", onClick: () => useStore.setState((s) => ({ drawings: [d, ...s.drawings], quantities: [...s.quantities, ...qs] })) } });
          }}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function UploadDialog({ open, onClose, onFiles }: { open: boolean; onClose: () => void; onFiles: (f: FileList | null) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>Upload drawings</DialogTitle><DialogDescription>DWG, DXF, DWF or PDF. Files are classified by discipline and sheet type automatically.</DialogDescription></DialogHeader>
        <div onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={(e) => { e.preventDefault(); setOver(false); onFiles(e.dataTransfer.files); }}
          onClick={() => ref.current?.click()} className={cn("blueprint cursor-pointer rounded-lg border-2 border-dashed p-12 text-center transition", over ? "border-primary bg-primary/5" : "border-border")}>
          <UploadCloud className="mx-auto size-10 text-primary" />
          <div className="mt-3 font-medium">Drop drawings here or click to browse</div>
          <div className="mt-1 text-xs text-muted-foreground">Multiple files supported · up to 200 MB each</div>
          <input ref={ref} type="file" multiple accept=".dwg,.dxf,.dwf,.pdf" className="hidden" onChange={(e) => onFiles(e.target.files)} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Viewer({ d, onClose, onReclassify }: { d: Drawing; onClose: () => void; onReclassify: (p: Partial<Drawing>) => void }) {
  const qs = useStore((s) => s.quantities.filter((q) => q.drawingId === d.id));
  const [zoom, setZoom] = useState(1);
  const [layers, setLayers] = useState({ Grid: true, Walls: true, Columns: true, Dimensions: true, Annotations: false });
  const [sel, setSel] = useState<string | null>(null);
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[95vw] p-0 sm:max-w-[95vw]">
        <DialogHeader className="border-b px-5 py-3"><DialogTitle className="flex items-center gap-3">{d.name}<StatusPill status={d.status} /></DialogTitle><DialogDescription>Preview viewer — Autodesk Platform Services viewer will render the translated model here once connected.</DialogDescription></DialogHeader>
        <div className="grid h-[72vh] grid-cols-[220px_1fr_300px]">
          <aside className="space-y-4 overflow-y-auto border-r p-4 text-sm">
            <div className="flex items-center gap-2 font-medium"><Layers className="size-4" />Layers</div>
            {Object.entries(layers).map(([k, v]) => <label key={k} className="flex items-center justify-between">{k}<Switch checked={v} onCheckedChange={(c) => setLayers({ ...layers, [k]: c })} /></label>)}
            <div className="border-t pt-4 font-medium">Classification</div>
            <Select value={d.discipline} onValueChange={(v) => onReclassify({ discipline: v as Drawing["discipline"], classificationConfidence: 1 })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Architectural", "Structural", "MEP", "Civil", "Landscape"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select>
            <Select value={d.sheetType} onValueChange={(v) => onReclassify({ sheetType: v, classificationConfidence: 1 })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Floor Plan", "Elevation", "Section", "GA / Layout", "Reinforcement", "Foundation", "Schedule"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select>
          </aside>
          <div className="relative overflow-hidden bg-muted/40">
            <div className="absolute right-3 top-3 z-10 flex gap-1 rounded-md border bg-card p-1 shadow-card">
              <Button size="icon" variant="ghost" onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))} aria-label="Zoom out"><ZoomOut className="size-4" /></Button>
              <span className="num grid w-12 place-items-center text-xs">{Math.round(zoom * 100)}%</span>
              <Button size="icon" variant="ghost" onClick={() => setZoom((z) => Math.min(3, z + 0.25))} aria-label="Zoom in"><ZoomIn className="size-4" /></Button>
            </div>
            <svg viewBox="0 0 800 500" className="blueprint h-full w-full text-primary transition-transform" style={{ transform: `scale(${zoom})` }}>
              {layers.Grid && [0, 1, 2, 3, 4, 5].map((i) => <g key={i}><line x1={80 + i * 128} y1="40" x2={80 + i * 128} y2="460" stroke="currentColor" strokeDasharray="6 4" opacity=".35" /><circle cx={80 + i * 128} cy="28" r="10" fill="none" stroke="currentColor" /><text x={80 + i * 128} y="32" fontSize="10" textAnchor="middle" fill="currentColor">{i + 1}</text></g>)}
              {layers.Walls && <><rect x="80" y="70" width="640" height="360" fill="none" stroke="var(--foreground)" strokeWidth="6" /><line x1="336" y1="70" x2="336" y2="430" stroke="var(--foreground)" strokeWidth="3" /><line x1="80" y1="250" x2="592" y2="250" stroke="var(--foreground)" strokeWidth="3" /></>}
              {layers.Columns && [0, 1, 2, 3, 4, 5].flatMap((i) => [70, 250, 430].map((y) => <rect key={`${i}${y}`} x={72 + i * 128} y={y - 8} width="16" height="16" fill={sel ? "var(--primary)" : "var(--foreground)"} opacity={sel ? 0.9 : 1} />))}
              {layers.Dimensions && <><line x1="80" y1="470" x2="720" y2="470" stroke="currentColor" /><text x="400" y="488" fontSize="11" textAnchor="middle" fill="currentColor">32 000</text></>}
              {layers.Annotations && <text x="200" y="160" fontSize="14" fill="var(--muted-foreground)">LIVING / DINING</text>}
              {sel && <rect x="80" y="70" width="640" height="360" fill="var(--primary)" opacity=".08" />}
            </svg>
          </div>
          <aside className="overflow-y-auto border-l p-4 text-sm">
            <div className="mb-3 font-medium">Extracted quantities</div>
            {qs.length === 0 ? <p className="text-muted-foreground">No quantities yet. Process this drawing to extract them.</p> : qs.map((q) => (
              <button key={q.id} onClick={() => setSel(sel === q.id ? null : q.id)} className={cn("mb-2 w-full rounded-md border p-3 text-left", sel === q.id && "border-primary bg-primary/5")}>
                <div className="font-medium">{q.element}</div>
                <div className="num mt-1 text-xs text-muted-foreground">{fmtNum(q.quantity)} {q.unit} · {q.level}</div>
                <div className="mt-2 flex items-center justify-between"><Confidence value={q.confidence} /><StatusPill status={q.status} /></div>
              </button>
            ))}
            <p className="mt-4 rounded-md bg-warning/10 p-2 text-xs text-warning-foreground">Quantities shown are demonstration data, not measured from the uploaded file.</p>
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
}
