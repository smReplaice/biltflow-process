import type { AuditEvent, Boq, CostRate, Drawing, Project, QuantityItem, Trade } from "./types";

const d = (daysAgo: number) => new Date(Date.now() - daysAgo * 86400000).toISOString();

export const seedProjects: Project[] = [
  { id: "p1", name: "Skyline Residency Tower A", code: "SRT-A-24", client: "Skyline Developers Pvt Ltd", location: "Whitefield, Bengaluru", country: "India", type: "Residential High-rise", status: "Design", currency: "INR", standard: "IS 1200", gfa: 18500, floors: 22, basements: 2, floorHeight: 3.15, wastagePct: 5, contingencyPct: 5, marginPct: 12, taxPct: 18, createdAt: d(40) },
  { id: "p2", name: "Harbour Point Commercial Hub", code: "HPC-01", client: "Harbour Point Realty", location: "Navi Mumbai, Maharashtra", country: "India", type: "Commercial Office", status: "Tender", currency: "INR", standard: "IS 1200", gfa: 32000, floors: 14, basements: 3, floorHeight: 4.2, wastagePct: 4, contingencyPct: 7.5, marginPct: 10, taxPct: 18, createdAt: d(75) },
  { id: "p3", name: "Greenfield Villas Phase II", code: "GFV-P2", client: "Greenfield Homes", location: "Gachibowli, Hyderabad", country: "India", type: "Villa Community", status: "Planning", currency: "INR", standard: "IS 1200", gfa: 9600, floors: 2, basements: 0, floorHeight: 3.3, wastagePct: 6, contingencyPct: 5, marginPct: 15, taxPct: 18, createdAt: d(12) },
];

const dw = (id: string, projectId: string, name: string, format: Drawing["format"], discipline: Drawing["discipline"], sheetType: string, level: string, status: Drawing["status"], conf: number, days: number): Drawing => ({
  id, projectId, name, format, discipline, sheetType, level, revision: "R" + (1 + (id.charCodeAt(id.length - 1) % 3)), sizeKb: 800 + ((id.charCodeAt(1) * 137) % 9000), status, progress: status === "Processing" ? 46 : status === "Uploaded" ? 0 : 100, classificationConfidence: conf, uploadedAt: d(days), uploadedBy: "Ananya Rao", demo: true,
});

export const seedDrawings: Drawing[] = [
  dw("d1", "p1", "SRT-A-AR-101 Typical Floor Plan", "DWG", "Architectural", "Floor Plan", "L03–L20", "Processed", 0.96, 30),
  dw("d2", "p1", "SRT-A-AR-102 Ground Floor Plan", "DWG", "Architectural", "Floor Plan", "GF", "Processed", 0.94, 30),
  dw("d3", "p1", "SRT-A-AR-201 Elevations", "PDF", "Architectural", "Elevation", "All", "Needs Review", 0.78, 28),
  dw("d4", "p1", "SRT-A-ST-301 Column Layout", "DWG", "Structural", "GA / Layout", "B2–Roof", "Processed", 0.97, 27),
  dw("d5", "p1", "SRT-A-ST-302 Slab Reinforcement", "DXF", "Structural", "Reinforcement", "Typical", "Processing", 0.88, 2),
  dw("d6", "p1", "SRT-A-AR-401 Door & Window Schedule", "PDF", "Architectural", "Schedule", "All", "Processed", 0.91, 25),
  dw("d7", "p2", "HPC-AR-100 Basement Plan", "DWG", "Architectural", "Floor Plan", "B1–B3", "Processed", 0.93, 60),
  dw("d8", "p2", "HPC-ST-210 Foundation Plan", "DWG", "Structural", "Foundation", "Foundation", "Processed", 0.95, 58),
  dw("d9", "p2", "HPC-AR-305 Sections", "DWF", "Architectural", "Section", "All", "Failed", 0.4, 5),
  dw("d10", "p3", "GFV-AR-01 Villa Type A Plans", "PDF", "Architectural", "Floor Plan", "GF–FF", "Uploaded", 0.82, 1),
];

const q = (id: string, projectId: string, drawingId: string, element: string, trade: Trade, level: string, unit: string, quantity: number, confidence: number, status: QuantityItem["status"] = "Pending"): QuantityItem => ({ id, projectId, drawingId, element, trade, level, unit, quantity, confidence, status });

export const seedQuantities: QuantityItem[] = [
  q("q1", "p1", "d4", "RCC Columns M40", "Concrete", "B2–Roof", "m³", 1284.6, 0.95, "Verified"),
  q("q2", "p1", "d4", "RCC Beams M30", "Concrete", "Typical", "m³", 2140.2, 0.92, "Verified"),
  q("q3", "p1", "d5", "RCC Slab 150mm M30", "Concrete", "Typical", "m³", 3655.0, 0.88),
  q("q4", "p1", "d5", "Reinforcement Fe550D", "Reinforcement", "All", "MT", 812.4, 0.81),
  q("q5", "p1", "d4", "Column & Beam Formwork", "Formwork", "All", "m²", 28450, 0.9, "Verified"),
  q("q6", "p1", "d1", "AAC Block Masonry 200mm", "Masonry", "L03–L20", "m³", 2310.8, 0.93),
  q("q7", "p1", "d1", "Internal Gypsum Plaster 12mm", "Plastering", "L03–L20", "m²", 41200, 0.89),
  q("q8", "p1", "d1", "Vitrified Tile Flooring 800×800", "Flooring", "L03–L20", "m²", 13980, 0.94, "Verified"),
  q("q9", "p1", "d6", "Flush Doors 1000×2100", "Doors & Windows", "All", "nos", 612, 0.97, "Verified"),
  q("q10", "p1", "d6", "UPVC Windows", "Doors & Windows", "All", "m²", 2870, 0.74, "Flagged"),
  q("q11", "p1", "d3", "External Texture Paint", "Painting", "All", "m²", 21500, 0.68, "Flagged"),
  q("q12", "p1", "d2", "Basement Waterproofing", "Waterproofing", "B1–B2", "m²", 6400, 0.86),
  q("q13", "p2", "d8", "Excavation in Soft Rock", "Earthwork", "Foundation", "m³", 38600, 0.9, "Verified"),
  q("q14", "p2", "d8", "Raft Foundation M35", "Concrete", "Foundation", "m³", 5820, 0.93, "Verified"),
  q("q15", "p2", "d7", "Retaining Wall M35", "Concrete", "B1–B3", "m³", 1940, 0.87),
];

const r = (id: string, code: string, trade: Trade, description: string, unit: string, material: number, labour: number, plant: number): CostRate => ({ id, code, trade, description, unit, material, labour, plant, sheetVersion: "v2.3" });

export const seedRates: CostRate[] = [
  r("r1", "CON-040", "Concrete", "RMC M40 incl. placing & curing", "m³", 6400, 650, 420),
  r("r2", "CON-030", "Concrete", "RMC M30 incl. placing & curing", "m³", 5600, 600, 380),
  r("r3", "CON-035", "Concrete", "RMC M35 incl. placing & curing", "m³", 6000, 620, 400),
  r("r4", "STL-550", "Reinforcement", "TMT Fe550D cut, bent & tied", "MT", 62000, 7500, 1200),
  r("r5", "FWK-010", "Formwork", "Plywood/aluminium formwork", "m²", 320, 260, 40),
  r("r6", "MSN-200", "Masonry", "AAC block 200mm in thin-bed mortar", "m³", 4300, 1100, 0),
  r("r7", "PLS-012", "Plastering", "Gypsum plaster 12mm", "m²", 210, 140, 0),
  r("r8", "FLR-800", "Flooring", "Vitrified tiles 800×800 laid", "m²", 1150, 260, 0),
  r("r9", "DRW-FD1", "Doors & Windows", "Flush door shutter with frame", "nos", 14500, 1800, 0),
  r("r10", "DRW-UPV", "Doors & Windows", "UPVC sliding window", "m²", 6800, 700, 0),
  r("r11", "PNT-EXT", "Painting", "Exterior texture paint 2 coats", "m²", 160, 90, 15),
  r("r12", "WPF-BSM", "Waterproofing", "Membrane waterproofing basement", "m²", 780, 220, 0),
  r("r13", "EWK-SR", "Earthwork", "Excavation in soft rock incl. disposal", "m³", 0, 180, 420),
];

export const seedBoqs: Boq[] = [
  {
    id: "b1", projectId: "p2", name: "Substructure BOQ", version: 2, status: "Approved", wastagePct: 4, prelimsPct: 6, contingencyPct: 7.5, marginPct: 10, taxPct: 18, createdAt: d(20), createdBy: "Rahul Mehta",
    lines: [
      { id: "l1", ref: "1.1", trade: "Earthwork", description: "Excavation in soft rock incl. disposal", unit: "m³", quantity: 38600, rate: 600, quantityId: "q13", rateId: "r13" },
      { id: "l2", ref: "2.1", trade: "Concrete", description: "Raft foundation RMC M35", unit: "m³", quantity: 5820, rate: 7020, quantityId: "q14", rateId: "r3" },
      { id: "l3", ref: "2.2", trade: "Concrete", description: "Retaining wall RMC M35", unit: "m³", quantity: 1940, rate: 7020, quantityId: "q15", rateId: "r3" },
    ],
  },
];

export const seedAudit: AuditEvent[] = [
  { id: "a1", at: d(20), user: "Rahul Mehta", entity: "BOQ", action: "Approved", detail: "Substructure BOQ v2 approved", projectId: "p2" },
  { id: "a2", at: d(22), user: "Rahul Mehta", entity: "BOQ", action: "Revised", detail: "Substructure BOQ v2 created from v1 (+3.2%)", projectId: "p2" },
  { id: "a3", at: d(27), user: "Ananya Rao", entity: "Drawing", action: "Processed", detail: "SRT-A-ST-301 Column Layout — 2 quantity groups", projectId: "p1" },
  { id: "a4", at: d(30), user: "Ananya Rao", entity: "Drawing", action: "Uploaded", detail: "3 drawings uploaded to Skyline Residency", projectId: "p1" },
  { id: "a5", at: d(35), user: "Vikram Iyer", entity: "Costing", action: "Published", detail: "Rate sheet v2.3 published (13 rates)" },
];
