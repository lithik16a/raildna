// Shared domain types for RailDNA. Keep free of server-only imports so client code can use them.

export const ASSET_TYPES = ["Fishplate", "Rail Clip", "Base Plate", "Sleeper", "Fastener"] as const;
export type AssetType = (typeof ASSET_TYPES)[number];

export const CONDITIONS = ["Good", "Moderate", "High Risk"] as const;
export type Condition = (typeof CONDITIONS)[number];

export type RiskLevel = "Low" | "Moderate" | "High";

export type AssetStatus = "Active" | "Under Maintenance";

export const MAINTENANCE_STATUSES = ["Due", "Scheduled", "In Progress", "Completed"] as const;
export type MaintenanceStatus = (typeof MAINTENANCE_STATUSES)[number];

export const PRIORITIES = ["Low", "Medium", "High", "Critical"] as const;
export type Priority = (typeof PRIORITIES)[number];

export type InspectionType = "AI Inspection" | "Routine Inspection" | "Maintenance Inspection";

export type FindingType = "corrosion" | "surface_wear" | "crack" | "deformation" | "loose_fastener";

export interface User {
  id: number;
  email: string;
  name: string;
  role: "FIELD_ENGINEER";
}

export interface Asset {
  id: number;
  assetId: string;
  assetType: AssetType;
  location: string;
  latitude: number;
  longitude: number;
  installationDate: string; // ISO date
  condition: Condition | null; // null = never inspected
  riskScore: number | null;
  status: AssetStatus;
  lastInspection: string | null;
  nextInspection: string | null;
  createdAt: string;
}

/** Lean row used by registry/map lists. */
export interface AssetSummary extends Asset {
  maintenanceStatus: MaintenanceStatus | "None";
}

export interface RiskFactor {
  category: "Findings" | "Condition & Age" | "Maintenance History" | "Inspection Schedule";
  label: string;
  points: number;
  detail: string;
}

export interface RiskAssessment {
  score: number;
  level: RiskLevel;
  condition: Condition;
  factors: RiskFactor[];
}

export interface Finding {
  id?: number;
  type: FindingType;
  label: string;
  detected: boolean;
  confidence: number; // 0..1
}

export interface Inspection {
  id: number;
  assetId: string;
  inspectionDate: string;
  inspectionType: InspectionType;
  inspector: string;
  imageUrl: string | null;
  condition: Condition;
  riskScore: number;
  findings: string;
  recommendation: string;
  riskFactors: RiskFactor[];
  engine: string | null;
  createdAt: string;
}

export interface InspectionWithFindings extends Inspection {
  findingItems: Finding[];
}

export interface MaintenanceRecord {
  id: number;
  assetId: string;
  issue: string;
  priority: Priority;
  assignedTo: string;
  status: MaintenanceStatus;
  dueDate: string;
  notes: string;
  createdAt: string;
  completedAt: string | null;
}

export interface InspectionResult {
  inspection: InspectionWithFindings;
  assessment: RiskAssessment;
  suggestedAction: {
    issue: string;
    priority: Priority;
    dueDate: string;
    notes: string;
  };
  engine: EngineInfo;
}

export interface EngineInfo {
  name: string;
  version: string;
  isDemo: boolean;
  disclaimer: string;
}

export interface DashboardStats {
  totalAssets: number;
  inspected: number;
  highRisk: number;
  maintenanceDue: number;
}
