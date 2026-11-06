import { useEffect } from "react";
import { useStore } from "@/lib/store";
import type { Discipline, Drawing, QuantityItem, Trade } from "@/lib/types";

/** Filename-based classification. Real classification will come from the CAD adapter. */
export function classify(name: string): Pick<Drawing, "discipline" | "sheetType" | "classificationConfidence"> {
  const n = name.toUpperCase();
  const discipline: Discipline = /(-ST-|STRUCT|COLUMN|BEAM|SLAB|FOUND|RCC)/.test(n) ? "Structural" : /(MEP|ELEC|PLUMB|HVAC)/.test(n) ? "MEP" : /(SITE|CIVIL|ROAD)/.test(n) ? "Civil" : "Architectural";
  const sheetType = /ELEV/.test(n) ? "Elevation" : /SECT/.test(n) ? "Section" : /SCHED/.test(n) ? "Schedule" : /FOUND/.test(n) ? "Foundation" : /REINF|BAR/.test(n) ? "Reinforcement" : /COLUMN|LAYOUT|GA/.test(n) ? "GA / Layout" : "Floor Plan";
  const strong = /(-AR-|-ST-|PLAN|ELEV|SECT|COLUMN|SLAB)/.test(n);
  return { discipline, sheetType, classificationConfidence: strong ? 0.9 + Math.random() * 0.08 : 0.6 + Math.random() * 0.2 };
}

const TEMPLATES: Record<string, [string, Trade, string, number][]> = {
  Structural: [["RCC Columns M40", "Concrete", "m³", 420], ["RCC Slab M30", "Concrete", "m³", 980], ["Reinforcement Fe550D", "Reinforcement", "MT", 210], ["Formwork", "Formwork", "m²", 7400]],
  Architectural: [["AAC Block Masonry 200mm", "Masonry", "m³", 640], ["Internal Gypsum Plaster 12mm", "Plastering", "m²", 9800], ["Vitrified Tile Flooring 800×800", "Flooring", "m²", 3600]],
  MEP: [], Civil: [["Excavation in Soft Rock", "Earthwork", "m³", 5200]], Landscape: [],
};

function demoQuantities(d: Drawing): Omit<QuantityItem, "id">[] {
  return (TEMPLATES[d.discipline] ?? []).map(([element, trade, unit, base]) => ({
    projectId: d.projectId, drawingId: d.id, element, trade, unit, level: d.level,
    quantity: Math.round(base * (0.7 + Math.random() * 0.6) * 10) / 10,
    confidence: 0.7 + Math.random() * 0.28, status: "Pending" as const, note: "Demo quantity — simulated extraction",
  }));
}

export function useProcessingTicker() {
  useEffect(() => {
    const t = setInterval(() => {
      const s = useStore.getState();
      for (const d of s.drawings.filter((x) => x.status === "Processing")) {
        const progress = Math.min(100, d.progress + 6 + Math.random() * 8);
        if (progress >= 100) {
          const status = d.classificationConfidence < 0.8 ? "Needs Review" : "Processed";
          s.updateDrawing(d.id, { progress: 100, status });
          if (!s.quantities.some((q) => q.drawingId === d.id)) s.addQuantities(demoQuantities(d));
          s.log({ entity: "Drawing", action: "Processed", detail: `${d.name} — demo quantities generated`, projectId: d.projectId });
        } else s.updateDrawing(d.id, { progress });
      }
    }, 900);
    return () => clearInterval(t);
  }, []);
}

export const PIPELINE = ["Upload received", "CAD translation", "Layer & block parsing", "Element recognition", "Geometry measurement", "Quantity aggregation"];
