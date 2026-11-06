import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  LayoutDashboard, FolderKanban, FilePlus2, Library, Ruler, Coins, FileSpreadsheet,
  BarChart3, History, BookOpenCheck, Settings, Bell, ChevronsLeft, ChevronsRight, Building2,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { useProcessingTicker } from "./processing";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const NAV = [
  { to: "/", label: "Overview Dashboard", icon: LayoutDashboard },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/new-takeoff", label: "New Takeoff", icon: FilePlus2 },
  { to: "/drawings", label: "Drawing Library", icon: Library },
  { to: "/takeoff", label: "Quantity Takeoff", icon: Ruler },
  { to: "/costing", label: "Costing Library", icon: Coins },
  { to: "/boq", label: "BOQ Register", icon: FileSpreadsheet },
  { to: "/reports", label: "Reports & Analytics", icon: BarChart3 },
  { to: "/history", label: "History & Versions", icon: History },
  { to: "/templates", label: "Templates & Standards", icon: BookOpenCheck },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { projects, activeProjectId, setActiveProject, drawings } = useStore();
  const reviewCount = drawings.filter((d) => d.status === "Needs Review" || d.status === "Failed").length;
  useEffect(() => setMounted(true), []);
  useProcessingTicker();

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex min-h-screen bg-background">
        <aside className={cn("sticky top-0 flex h-screen shrink-0 flex-col bg-sidebar text-sidebar-foreground transition-[width]", collapsed ? "w-16" : "w-64")}>
          <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-4">
            <div className="grid size-8 shrink-0 place-items-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
              <Building2 className="size-4" />
            </div>
            {!collapsed && (
              <div className="leading-tight">
                <div className="text-sm font-semibold text-sidebar-accent-foreground">BiltFlow</div>
                <div className="text-[11px] uppercase tracking-widest text-sidebar-foreground/60">BOQ Engine</div>
              </div>
            )}
          </div>
          <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
            {NAV.map(({ to, label, icon: Icon }) => {
              const active = to === "/" ? path === "/" : path.startsWith(to);
              const item = (
                <Link key={to} to={to} className={cn("flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors", active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground")}>
                  <Icon className={cn("size-4 shrink-0", active && "text-sidebar-primary")} />
                  {!collapsed && <span className="truncate">{label}</span>}
                </Link>
              );
              return collapsed ? (
                <Tooltip key={to}><TooltipTrigger asChild>{item}</TooltipTrigger><TooltipContent side="right">{label}</TooltipContent></Tooltip>
              ) : item;
            })}
          </nav>
          <button onClick={() => setCollapsed((c) => !c)} className="flex items-center gap-2 border-t border-sidebar-border px-5 py-3 text-xs hover:text-sidebar-accent-foreground">
            {collapsed ? <ChevronsRight className="size-4" /> : <><ChevronsLeft className="size-4" /> Collapse</>}
          </button>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-card/90 px-6 backdrop-blur">
            <div className="text-sm text-muted-foreground">Skyline Group</div>
            <span className="text-border">/</span>
            {mounted && (
              <Select value={activeProjectId} onValueChange={setActiveProject}>
                <SelectTrigger className="h-9 w-72"><SelectValue /></SelectTrigger>
                <SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            )}
            <div className="ml-auto flex items-center gap-4">
              <span className="hidden rounded-full border border-warning/40 bg-warning/10 px-2.5 py-0.5 text-xs font-medium text-warning-foreground md:inline">Demo data — CAD processing simulated</span>
              <Link to="/drawings" className="relative text-muted-foreground hover:text-foreground" aria-label="Notifications">
                <Bell className="size-5" />
                {mounted && reviewCount > 0 && <span className="absolute -right-1.5 -top-1.5 grid size-4 place-items-center rounded-full bg-destructive text-[10px] text-destructive-foreground">{reviewCount}</span>}
              </Link>
              <div className="flex items-center gap-2">
                <div className="grid size-8 place-items-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">AR</div>
                <div className="hidden text-xs leading-tight lg:block"><div className="font-medium">Ananya Rao</div><div className="text-muted-foreground">Quantity Surveyor</div></div>
              </div>
            </div>
          </header>
          <main className="flex-1 p-6 lg:p-8">{mounted ? children : <div className="h-96 animate-pulse rounded-lg bg-muted" />}</main>
        </div>
      </div>
    </TooltipProvider>
  );
}
