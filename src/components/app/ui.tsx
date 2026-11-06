import type { ReactNode } from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, action, children, className }: { title?: string | undefined; action?: ReactNode; children: ReactNode; className?: string | undefined }) {
  return (
    <section className={cn("rounded-lg border bg-card shadow-card", className)}>
      {title && (
        <div className="flex items-center justify-between border-b px-5 py-3">
          <h2 className="text-sm font-semibold">{title}</h2>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Kpi({ label, value, hint, icon }: { label: string; value: ReactNode; hint?: string; icon?: ReactNode }) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-card">
      <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
        <span className="text-primary">{icon}</span>
      </div>
      <div className="num mt-2 text-2xl font-semibold text-foreground">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

const TONES: Record<string, string> = {
  Processed: "bg-success/12 text-success border-success/30",
  Verified: "bg-success/12 text-success border-success/30",
  Approved: "bg-success/12 text-success border-success/30",
  Completed: "bg-success/12 text-success border-success/30",
  Processing: "bg-primary/10 text-primary border-primary/30",
  "In Review": "bg-primary/10 text-primary border-primary/30",
  Construction: "bg-primary/10 text-primary border-primary/30",
  "Needs Review": "bg-warning/15 text-warning-foreground border-warning/40",
  Pending: "bg-warning/15 text-warning-foreground border-warning/40",
  Tender: "bg-warning/15 text-warning-foreground border-warning/40",
  Failed: "bg-destructive/10 text-destructive border-destructive/30",
  Flagged: "bg-destructive/10 text-destructive border-destructive/30",
  Rejected: "bg-destructive/10 text-destructive border-destructive/30",
};

export function StatusPill({ status }: { status: string }) {
  return <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap", TONES[status] ?? "bg-muted text-muted-foreground border-border")}>{status}</span>;
}

export function Confidence({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const tone = pct >= 90 ? "bg-success" : pct >= 75 ? "bg-warning" : "bg-destructive";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-14 overflow-hidden rounded-full bg-muted"><div className={cn("h-full", tone)} style={{ width: `${pct}%` }} /></div>
      <span className="num text-xs text-muted-foreground">{pct}%</span>
    </div>
  );
}

export function HelpTip({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger type="button" className="text-muted-foreground hover:text-primary" aria-label="Help"><Info className="size-3.5" /></TooltipTrigger>
      <TooltipContent className="max-w-xs">{text}</TooltipContent>
    </Tooltip>
  );
}

export function Empty({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="blueprint rounded-lg border border-dashed p-10 text-center">
      <div className="font-medium">{title}</div>
      {body && <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function DrawingThumb({ seed, className }: { seed: string; className?: string }) {
  const n = [...seed].reduce((a, c) => a + c.charCodeAt(0), 0);
  const cols = 3 + (n % 3);
  const rows = 2 + (n % 2);
  return (
    <svg viewBox="0 0 160 100" className={cn("blueprint bg-accent/40 text-primary", className)}>
      <rect x="12" y="10" width="136" height="80" fill="none" stroke="currentColor" strokeWidth="1.4" />
      {Array.from({ length: cols - 1 }, (_, i) => <line key={"c" + i} x1={12 + (136 / cols) * (i + 1)} y1="10" x2={12 + (136 / cols) * (i + 1)} y2="90" stroke="currentColor" strokeWidth=".6" opacity=".6" />)}
      {Array.from({ length: rows - 1 }, (_, i) => <line key={"r" + i} x1="12" y1={10 + (80 / rows) * (i + 1)} x2="148" y2={10 + (80 / rows) * (i + 1)} stroke="currentColor" strokeWidth=".6" opacity=".6" />)}
      {Array.from({ length: cols + 1 }, (_, i) => Array.from({ length: rows + 1 }, (_, j) => <rect key={`${i}-${j}`} x={10 + (136 / cols) * i} y={8 + (80 / rows) * j} width="4" height="4" fill="currentColor" />))}
      <path d={`M${30 + (n % 40)} 90 a14 14 0 0 1 14 -14`} fill="none" stroke="currentColor" strokeWidth=".6" />
    </svg>
  );
}
