import "server-only";
import type {
  Condition,
  Finding,
  FindingType,
  Inspection,
  InspectionType,
  InspectionWithFindings,
  RiskFactor,
} from "@/types";
import { getDb } from "../client";

interface InspectionRow {
  id: number;
  asset_id: string;
  inspection_date: string;
  inspection_type: InspectionType;
  inspector: string;
  image_url: string | null;
  condition: Condition;
  risk_score: number;
  findings: string;
  recommendation: string;
  risk_factors: string;
  engine: string | null;
  created_at: string;
}

interface FindingRow {
  id: number;
  inspection_id: number;
  finding_type: FindingType;
  label: string;
  detected: number;
  confidence: number;
}

function parseFactors(json: string): RiskFactor[] {
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? (v as RiskFactor[]) : [];
  } catch {
    return [];
  }
}

function toInspection(r: InspectionRow): Inspection {
  return {
    id: r.id,
    assetId: r.asset_id,
    inspectionDate: r.inspection_date,
    inspectionType: r.inspection_type,
    inspector: r.inspector,
    imageUrl: r.image_url,
    condition: r.condition,
    riskScore: r.risk_score,
    findings: r.findings,
    recommendation: r.recommendation,
    riskFactors: parseFactors(r.risk_factors),
    engine: r.engine,
    createdAt: r.created_at,
  };
}

function toFinding(r: FindingRow): Finding {
  return { id: r.id, type: r.finding_type, label: r.label, detected: r.detected === 1, confidence: r.confidence };
}

function attachFindings(rows: InspectionRow[]): InspectionWithFindings[] {
  if (rows.length === 0) return [];
  const db = getDb();
  const ids = rows.map((r) => r.id);
  const placeholders = ids.map(() => "?").join(",");
  const findingRows = db
    .prepare(`SELECT * FROM inspection_findings WHERE inspection_id IN (${placeholders}) ORDER BY id`)
    .all(...ids) as FindingRow[];
  const byInspection = new Map<number, Finding[]>();
  for (const f of findingRows) {
    const list = byInspection.get(f.inspection_id) ?? [];
    list.push(toFinding(f));
    byInspection.set(f.inspection_id, list);
  }
  return rows.map((r) => ({ ...toInspection(r), findingItems: byInspection.get(r.id) ?? [] }));
}

export interface NewInspection {
  assetId: string;
  inspectionDate: string;
  inspectionType: InspectionType;
  inspector: string;
  imageUrl: string | null;
  condition: Condition;
  riskScore: number;
  findingsSummary: string;
  recommendation: string;
  riskFactors: RiskFactor[];
  engine: string | null;
  findings: Finding[];
}

export function createInspection(input: NewInspection): InspectionWithFindings {
  const db = getDb();
  const tx = db.transaction(() => {
    const res = db
      .prepare(
        `INSERT INTO inspections (asset_id, inspection_date, inspection_type, inspector, image_url, condition, risk_score, findings, recommendation, risk_factors, engine, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        input.assetId,
        input.inspectionDate,
        input.inspectionType,
        input.inspector,
        input.imageUrl,
        input.condition,
        input.riskScore,
        input.findingsSummary,
        input.recommendation,
        JSON.stringify(input.riskFactors),
        input.engine,
        new Date().toISOString(),
      );
    const id = Number(res.lastInsertRowid);
    const ins = db.prepare(
      "INSERT INTO inspection_findings (inspection_id, finding_type, label, detected, confidence) VALUES (?, ?, ?, ?, ?)",
    );
    for (const f of input.findings) ins.run(id, f.type, f.label, f.detected ? 1 : 0, f.confidence);
    return id;
  });
  const id = tx();
  return getInspection(id)!;
}

export function getInspection(id: number): InspectionWithFindings | null {
  const row = getDb().prepare("SELECT * FROM inspections WHERE id = ?").get(id) as InspectionRow | undefined;
  return row ? attachFindings([row])[0] : null;
}

export function listInspectionsForAsset(assetId: string): InspectionWithFindings[] {
  const rows = getDb()
    .prepare("SELECT * FROM inspections WHERE asset_id = ? ORDER BY inspection_date DESC, id DESC")
    .all(assetId) as InspectionRow[];
  return attachFindings(rows);
}

export function getLatestInspection(assetId: string): InspectionWithFindings | null {
  const row = getDb()
    .prepare("SELECT * FROM inspections WHERE asset_id = ? ORDER BY inspection_date DESC, id DESC LIMIT 1")
    .get(assetId) as InspectionRow | undefined;
  return row ? attachFindings([row])[0] : null;
}

export interface RecentInspection extends Inspection {
  assetType: string;
  location: string;
}

export function listRecentInspections(limit: number): RecentInspection[] {
  const rows = getDb()
    .prepare(
      `SELECT i.*, a.asset_type, a.location FROM inspections i
       JOIN assets a ON a.asset_id = i.asset_id
       ORDER BY i.inspection_date DESC, i.id DESC LIMIT ?`,
    )
    .all(limit) as (InspectionRow & { asset_type: string; location: string })[];
  return rows.map((r) => ({ ...toInspection(r), assetType: r.asset_type, location: r.location }));
}

export function inspectionsPerMonth(): { month: string; count: number; avgRisk: number }[] {
  return getDb()
    .prepare(
      `SELECT substr(inspection_date, 1, 7) AS month, COUNT(*) AS count, ROUND(AVG(risk_score), 1) AS avgRisk
       FROM inspections GROUP BY month ORDER BY month`,
    )
    .all() as { month: string; count: number; avgRisk: number }[];
}
