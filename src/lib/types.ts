export type ProjectStatus = "Planning" | "Design" | "Tender" | "Construction" | "Completed";
export type DrawingStatus = "Uploaded" | "Processing" | "Needs Review" | "Processed" | "Failed";
export type Discipline = "Architectural" | "Structural" | "MEP" | "Civil" | "Landscape";
export type Trade =
  | "Concrete"
  | "Reinforcement"
  | "Formwork"
  | "Masonry"
  | "Plastering"
  | "Flooring"
  | "Doors & Windows"
  | "Painting"
  | "Waterproofing"
  | "Earthwork";
export type QtyStatus = "Pending" | "Verified" | "Flagged";
export type BoqStatus = "Draft" | "In Review" | "Approved" | "Rejected";

export interface Project {
  id: string;
  name: string;
  code: string;
  client: string;
  location: string;
  country: string;
  type: string;
  status: ProjectStatus;
  currency: string;
  standard: string;
  gfa: number;
  floors: number;
  basements: number;
  floorHeight: number;
  wastagePct: number;
  contingencyPct: number;
  marginPct: number;
  taxPct: number;
  createdAt: string;
}

export interface Drawing {
  id: string;
  projectId: string;
  name: string;
  format: "DWG" | "DXF" | "DWF" | "PDF";
  discipline: Discipline;
  sheetType: string;
  level: string;
  revision: string;
  sizeKb: number;
  status: DrawingStatus;
  progress: number;
  classificationConfidence: number;
  uploadedAt: string;
  uploadedBy: string;
  demo: boolean;
}

export interface QuantityItem {
  id: string;
  projectId: string;
  drawingId: string;
  element: string;
  trade: Trade;
  level: string;
  unit: string;
  quantity: number;
  confidence: number;
  status: QtyStatus;
  note?: string | undefined;
}

export interface CostRate {
  id: string;
  code: string;
  trade: Trade;
  description: string;
  unit: string;
  material: number;
  labour: number;
  plant: number;
  sheetVersion: string;
}

export interface BoqLine {
  id: string;
  ref: string;
  trade: Trade;
  description: string;
  unit: string;
  quantity: number;
  rate: number;
  quantityId?: string | undefined;
  rateId?: string | undefined;
}

export interface Boq {
  id: string;
  projectId: string;
  name: string;
  version: number;
  status: BoqStatus;
  lines: BoqLine[];
  wastagePct: number;
  prelimsPct: number;
  contingencyPct: number;
  marginPct: number;
  taxPct: number;
  createdAt: string;
  createdBy: string;
}

export interface AuditEvent {
  id: string;
  at: string;
  user: string;
  entity: "Project" | "Drawing" | "Quantity" | "Costing" | "BOQ";
  action: string;
  detail: string;
  projectId?: string;
}
