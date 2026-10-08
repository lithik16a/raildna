import "server-only";
import type { Asset, AssetStatus, AssetSummary, AssetType, Condition, DashboardStats, MaintenanceStatus } from "@/types";
import { getDb } from "../client";

interface AssetRow {
  id: number;
  asset_id: string;
  asset_type: AssetType;
  location: string;
  latitude: number;
  longitude: number;
  installation_date: string;
  condition: Condition | null;
  risk_score: number | null;
  status: AssetStatus;
  last_inspection: string | null;
  next_inspection: string | null;
  created_at: string;
  maint_status?: MaintenanceStatus | null;
}

function toAsset(r: AssetRow): Asset {
  return {
    id: r.id,
    assetId: r.asset_id,
    assetType: r.asset_type,
    location: r.location,
    latitude: r.latitude,
    longitude: r.longitude,
    installationDate: r.installation_date,
    condition: r.condition,
    riskScore: r.risk_score,
    status: r.status,
    lastInspection: r.last_inspection,
    nextInspection: r.next_inspection,
    createdAt: r.created_at,
  };
}

const OPEN_RANK = `CASE m.status WHEN 'Due' THEN 1 WHEN 'In Progress' THEN 2 ELSE 3 END`;

export function listAssetSummaries(): AssetSummary[] {
  const rows = getDb()
    .prepare(
      `SELECT a.*,
        (SELECT m.status FROM maintenance_records m
          WHERE m.asset_id = a.asset_id AND m.status != 'Completed'
          ORDER BY ${OPEN_RANK} LIMIT 1) AS maint_status
       FROM assets a ORDER BY a.asset_id`,
    )
    .all() as AssetRow[];
  return rows.map((r) => ({ ...toAsset(r), maintenanceStatus: r.maint_status ?? "None" }));
}

export function getAsset(assetId: string): Asset | null {
  const row = getDb().prepare("SELECT * FROM assets WHERE asset_id = ?").get(assetId) as AssetRow | undefined;
  return row ? toAsset(row) : null;
}

export function assetExists(assetId: string): boolean {
  return !!getDb().prepare("SELECT 1 FROM assets WHERE asset_id = ?").get(assetId);
}

export function applyInspectionToAsset(
  assetId: string,
  update: { condition: Condition; riskScore: number; lastInspection: string; nextInspection: string },
): void {
  getDb()
    .prepare(
      "UPDATE assets SET condition = ?, risk_score = ?, last_inspection = ?, next_inspection = ? WHERE asset_id = ?",
    )
    .run(update.condition, update.riskScore, update.lastInspection, update.nextInspection, assetId);
}

export function updateAssetStatus(assetId: string, status: AssetStatus): void {
  getDb().prepare("UPDATE assets SET status = ? WHERE asset_id = ?").run(status, assetId);
}

export function setNextInspection(assetId: string, date: string): void {
  getDb().prepare("UPDATE assets SET next_inspection = ? WHERE asset_id = ?").run(date, assetId);
}

export function getDashboardStats(): DashboardStats {
  const db = getDb();
  const one = (sql: string) => (db.prepare(sql).get() as { n: number }).n;
  return {
    totalAssets: one("SELECT COUNT(*) AS n FROM assets"),
    inspected: one("SELECT COUNT(*) AS n FROM assets WHERE last_inspection IS NOT NULL"),
    highRisk: one("SELECT COUNT(*) AS n FROM assets WHERE condition = 'High Risk'"),
    maintenanceDue: one("SELECT COUNT(*) AS n FROM maintenance_records WHERE status = 'Due'"),
  };
}

export function listHighRiskAssets(limit: number): Asset[] {
  const rows = getDb()
    .prepare("SELECT * FROM assets WHERE condition = 'High Risk' ORDER BY risk_score DESC, asset_id LIMIT ?")
    .all(limit) as AssetRow[];
  return rows.map(toAsset);
}

export function countByType(): { type: AssetType; count: number }[] {
  return (getDb().prepare("SELECT asset_type AS type, COUNT(*) AS count FROM assets GROUP BY asset_type ORDER BY count DESC").all() as {
    type: AssetType;
    count: number;
  }[]);
}

export function countByCondition(): { condition: Condition | null; count: number }[] {
  return getDb()
    .prepare("SELECT condition, COUNT(*) AS count FROM assets GROUP BY condition")
    .all() as { condition: Condition | null; count: number }[];
}

export function riskHistogram(): { bucket: string; count: number }[] {
  const rows = getDb()
    .prepare(
      `SELECT CASE
                WHEN risk_score <= 30 THEN 'Low (0-30)'
                WHEN risk_score <= 60 THEN 'Moderate (31-60)'
                ELSE 'High (61-100)' END AS bucket, COUNT(*) AS count
       FROM assets WHERE risk_score IS NOT NULL GROUP BY bucket`,
    )
    .all() as { bucket: string; count: number }[];
  return rows;
}
