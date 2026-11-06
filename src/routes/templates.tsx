import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/app/ui";
import { pageHead } from "@/lib/meta";

export const Route = createFileRoute("/templates")({
  head: pageHead("Templates & Standards", "Measurement standards, deduction rules and BOQ templates used in estimation."),
  component: Templates,
});

const STANDARDS = [
  { name: "IS 1200", region: "India", rules: ["Openings ≤ 0.5 m² not deducted from masonry", "Concrete measured net; no deduction for reinforcement", "Plaster: openings ≤ 0.5 m² ignored; 0.5–3 m² deduct one face"] },
  { name: "NRM2", region: "UK / International", rules: ["Voids ≤ 1.00 m² not deducted from finishes", "Formwork measured to concrete surfaces in contact", "Reinforcement measured by mass incl. laps"] },
  { name: "SMM7", region: "UK (legacy)", rules: ["Masonry measured mean length × height", "Openings ≤ 0.5 m² not deducted", "Excavation measured net, no working space allowance"] },
];
const TEMPLATES = [
  { name: "Residential high-rise", trades: "Earthwork, Concrete, Reinforcement, Formwork, Masonry, Plastering, Flooring, Doors & Windows, Painting, Waterproofing" },
  { name: "Commercial office", trades: "Earthwork, Concrete, Reinforcement, Formwork, Façade, Flooring, Ceilings, MEP" },
  { name: "Villa / low-rise", trades: "Earthwork, Concrete, Masonry, Plastering, Flooring, Roofing, Doors & Windows, Painting" },
];

function Templates() {
  return (
    <>
      <PageHeader title="Templates & Standards" subtitle="Rules applied when quantities are measured and BOQs are structured" />
      <div className="grid gap-6 lg:grid-cols-3">
        {STANDARDS.map((s) => (
          <Panel key={s.name} title={s.name} action={<span className="text-xs text-muted-foreground">{s.region}</span>}>
            <ul className="list-disc space-y-1.5 pl-4 text-sm">{s.rules.map((r) => <li key={r}>{r}</li>)}</ul>
          </Panel>
        ))}
      </div>
      <h2 className="mb-3 mt-8 text-sm font-semibold">BOQ templates</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {TEMPLATES.map((t) => <Panel key={t.name} title={t.name}><p className="text-sm text-muted-foreground">{t.trades}</p></Panel>)}
      </div>
    </>
  );
}
