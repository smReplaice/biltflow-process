import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { HelpTip, PageHeader, Panel } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { pageHead } from "@/lib/meta";

export const Route = createFileRoute("/new-takeoff")({
  head: pageHead("New Takeoff", "Set up a project, building configuration and cost assumptions before uploading drawings."),
  component: Wizard,
});

const schema = z.object({
  name: z.string().min(3, "Enter a project name"),
  code: z.string().min(2, "Enter a project code").regex(/^[A-Z0-9-]+$/, "Use capitals, numbers and hyphens"),
  client: z.string().min(2, "Enter the client or developer"),
  location: z.string().min(2, "Enter the site location"),
  country: z.string().min(2),
  type: z.string().min(2),
  currency: z.string().length(3, "3-letter code, e.g. INR"),
  standard: z.string().min(2),
  gfa: z.coerce.number().positive("Must be greater than 0"),
  floors: z.coerce.number().int().min(1),
  basements: z.coerce.number().int().min(0),
  floorHeight: z.coerce.number().min(2, "Min 2 m").max(10),
  wastagePct: z.coerce.number().min(0).max(30),
  contingencyPct: z.coerce.number().min(0).max(30),
  marginPct: z.coerce.number().min(0).max(50),
  taxPct: z.coerce.number().min(0).max(40),
});
type F = z.infer<typeof schema>;

type Field = { k: keyof F; label: string; tip: string; ph?: string; type?: string };
const STEPS: { title: string; fields: Field[] }[] = [
  { title: "Project information", fields: [
    { k: "name", label: "Project name", ph: "Skyline Residency Tower B", tip: "Shown on every drawing, BOQ and export." },
    { k: "code", label: "Project code", ph: "SRT-B-25", tip: "Short reference used in drawing numbering and BOQ item refs." },
    { k: "client", label: "Client / developer", ph: "Skyline Developers Pvt Ltd", tip: "Appears on BOQ cover sheets and approvals." },
    { k: "location", label: "Site location", ph: "Whitefield, Bengaluru", tip: "Location drives regional rate libraries and logistics costs." },
    { k: "country", label: "Country", ph: "India", tip: "Determines default tax and measurement conventions." },
    { k: "type", label: "Project type", ph: "Residential High-rise", tip: "Selects classification rules and template trade breakdowns." },
    { k: "currency", label: "Currency", ph: "INR", tip: "All rates and totals are expressed in this currency." },
    { k: "standard", label: "Measurement standard", ph: "IS 1200 / NRM2 / SMM7", tip: "Defines deduction rules, e.g. openings below 0.5 m² are not deducted under IS 1200." },
  ] },
  { title: "Building configuration", fields: [
    { k: "gfa", label: "Gross floor area (m²)", ph: "18500", type: "number", tip: "Used to sanity-check extracted quantities and compute cost per m²." },
    { k: "floors", label: "Number of floors", ph: "22", type: "number", tip: "Typical floor quantities are multiplied by floor count." },
    { k: "basements", label: "Basement levels", ph: "2", type: "number", tip: "Drives excavation, retaining wall and waterproofing scope." },
    { k: "floorHeight", label: "Floor-to-floor height (m)", ph: "3.15", type: "number", tip: "Used to derive wall, column and finish heights from plan drawings." },
  ] },
  { title: "Cost assumptions", fields: [
    { k: "wastagePct", label: "Default wastage (%)", ph: "5", type: "number", tip: "Added to direct cost to cover cutting, breakage and losses." },
    { k: "contingencyPct", label: "Contingency (%)", ph: "5", type: "number", tip: "Allowance for design development and unforeseen items." },
    { k: "marginPct", label: "Contractor margin (%)", ph: "12", type: "number", tip: "Overhead and profit applied before tax." },
    { k: "taxPct", label: "Tax / GST (%)", ph: "18", type: "number", tip: "Applied on the final subtotal." },
  ] },
];
const DRAFT = "biltflow-wizard-draft";

function Wizard() {
  const [step, setStep] = useState(0);
  const addProject = useStore((s) => s.addProject);
  const nav = useNavigate();
  const form = useForm<F>({
    resolver: zodResolver(schema),
    defaultValues: { country: "India", currency: "INR", standard: "IS 1200", type: "Residential High-rise", basements: 0, floorHeight: 3.15, wastagePct: 5, contingencyPct: 5, marginPct: 12, taxPct: 18 } as Partial<F> as F,
  });
  useEffect(() => {
    const d = localStorage.getItem(DRAFT);
    if (d) { form.reset({ ...form.getValues(), ...JSON.parse(d) }); toast.info("Restored your unsaved draft"); }
    const sub = form.watch((v) => localStorage.setItem(DRAFT, JSON.stringify(v)));
    return () => sub.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const next = async () => { if (await form.trigger(STEPS[step]!.fields.map((f) => f.k))) setStep(step + 1); };
  const submit = form.handleSubmit((v) => {
    addProject({ ...v, status: "Planning" });
    localStorage.removeItem(DRAFT);
    toast.success(`${v.name} created — now upload drawings`);
    nav({ to: "/drawings", search: { upload: true } });
  });
  const all = [...STEPS.map((s) => s.title), "Review & create"];
  const v = form.watch();

  return (
    <>
      <PageHeader title="New takeoff" subtitle="Set up the project before uploading drawings. Your progress autosaves as a draft." />
      <ol className="mb-6 flex flex-wrap gap-2">
        {all.map((t, i) => (
          <li key={t} className={cn("flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm", i === step ? "border-primary bg-primary/10 text-primary" : i < step ? "border-success/40 text-success" : "text-muted-foreground")}>
            <span className={cn("grid size-5 place-items-center rounded-full text-[11px]", i < step ? "bg-success text-success-foreground" : i === step ? "bg-primary text-primary-foreground" : "bg-muted")}>{i < step ? <Check className="size-3" /> : i + 1}</span>{t}
          </li>
        ))}
      </ol>
      <Panel title={all[step]} className="max-w-4xl">
        {step < STEPS.length ? (
          <div className="grid gap-5 md:grid-cols-2">
            {STEPS[step]!.fields.map((f) => {
              const err = form.formState.errors[f.k]?.message;
              return (
                <div key={f.k} className="space-y-1.5">
                  <Label htmlFor={f.k} className="flex items-center gap-1.5">{f.label}<HelpTip text={f.tip} /></Label>
                  <Input id={f.k} type={f.type ?? "text"} step="any" placeholder={f.ph} {...form.register(f.k)} aria-invalid={!!err} />
                  {err && <p className="text-xs text-destructive">{String(err)}</p>}
                </div>
              );
            })}
          </div>
        ) : (
          <dl className="grid gap-x-8 gap-y-3 text-sm md:grid-cols-2">
            {STEPS.flatMap((s) => s.fields).map((f) => (
              <div key={f.k} className="flex justify-between border-b py-1.5"><dt className="text-muted-foreground">{f.label}</dt><dd className="num font-medium">{String(v[f.k] ?? "—")}</dd></div>
            ))}
          </dl>
        )}
        <div className="mt-6 flex justify-between border-t pt-4">
          <Button variant="outline" disabled={step === 0} onClick={() => setStep(step - 1)}>Back</Button>
          {step < STEPS.length ? <Button onClick={next}>Continue</Button> : <Button onClick={submit}>Create project & upload drawings</Button>}
        </div>
      </Panel>
    </>
  );
}
