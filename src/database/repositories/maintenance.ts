import "server-only";
import type { MaintenanceRecord, MaintenanceStatus, Priority } from "@/types";
import { getDb } from "../client";

interface MaintRow {
  id: number;
  asset_id: string;
  issue: string;
  priority: Priority;
  assigned_to: string;
  status: MaintenanceStatus;
  due_date: string;
  notes: string;
  created_at: string;
  completed_at: string | null;
}

function toRecord(r: MaintRow): MaintenanceRecord {
  return {
    id: r.id,
    assetId: r.asset_id,
    issue: r.issue,
    priority: r.priority,
    assignedTo: r.assigned_to,
    status: r.status,
    dueDate: r.due_date,
    notes: r.notes,
    createdAt: r.created_at,
    completedAt: r.completed_at,
  };
}

const PRIORITY_RANK = `CASE priority WHEN 'Critical' THEN 1 WHEN 'High' THEN 2 WHEN 'Medium' THEN 3 ELSE 4 END`;

export interface NewMaintenance {
  assetId: string;
  issue: string;
  priority: Priority;
  assignedTo: string;
  dueDate: string;
  notes: string;
}

export function createMaintenance(input: NewMaintenance): MaintenanceRecord {
  const res = getDb()
    .prepare(
      `INSERT INTO maintenance_records (asset_id, issue, priority, assigned_to, status, due_date, notes, created_at)
       VALUES (?, ?, ?, ?, 'Due', ?, ?, ?)`,
    )
    .run(input.assetId, input.issue, input.priority, input.assignedTo, input.dueDate, input.notes, new Date().toISOString());
  return getMaintenance(Number(res.lastInsertRowid))!;
}

export function getMaintenance(id: number): MaintenanceRecord | null {
  const row = getDb().prepare("SELECT * FROM maintenance_records WHERE id = ?").get(id) as MaintRow | undefined;
  return row ? toRecord(row) : null;
}

export function listMaintenanceForAsset(assetId: string): MaintenanceRecord[] {
  const rows = getDb()
    .prepare("SELECT * FROM maintenance_records WHERE asset_id = ? ORDER BY created_at DESC, id DESC")
    .all(assetId) as MaintRow[];
  return rows.map(toRecord);
}

/** Open (non-completed) records first by priority/due date, then recent completed records. */
export function listMaintenance(completedLimit = 50): MaintenanceRecord[] {
  const db = getDb();
  const open = db
    .prepare(
      `SELECT * FROM maintenance_records WHERE status != 'Completed'
       ORDER BY ${PRIORITY_RANK}, due_date, id`,
    )
    .all() as MaintRow[];
  const done = db
    .prepare("SELECT * FROM maintenance_records WHERE status = 'Completed' ORDER BY completed_at DESC, id DESC LIMIT ?")
    .all(completedLimit) as MaintRow[];
  return [...open, ...done].map(toRecord);
}

export function listOpenForAsset(assetId: string): MaintenanceRecord[] {
  const rows = getDb()
    .prepare("SELECT * FROM maintenance_records WHERE asset_id = ? AND status != 'Completed'")
    .all(assetId) as MaintRow[];
  return rows.map(toRecord);
}

export function countByStatus(): Record<MaintenanceStatus, number> {
  const rows = getDb()
    .prepare("SELECT status, COUNT(*) AS n FROM maintenance_records GROUP BY status")
    .all() as { status: MaintenanceStatus; n: number }[];
  const out: Record<MaintenanceStatus, number> = { Due: 0, Scheduled: 0, "In Progress": 0, Completed: 0 };
  for (const r of rows) out[r.status] = r.n;
  return out;
}

export function listDueSoon(limit: number): MaintenanceRecord[] {
  const rows = getDb()
    .prepare(
      `SELECT * FROM maintenance_records WHERE status = 'Due'
       ORDER BY ${PRIORITY_RANK}, due_date, id LIMIT ?`,
    )
    .all(limit) as MaintRow[];
  return rows.map(toRecord);
}

export function setMaintenanceStatus(id: number, status: MaintenanceStatus): MaintenanceRecord | null {
  const completedAt = status === "Completed" ? new Date().toISOString() : null;
  getDb()
    .prepare("UPDATE maintenance_records SET status = ?, completed_at = ? WHERE id = ?")
    .run(status, completedAt, id);
  return getMaintenance(id);
}

export function maintenanceTrend(): { month: string; created: number; completed: number }[] {
  const db = getDb();
  const created = db
    .prepare("SELECT substr(created_at, 1, 7) AS month, COUNT(*) AS n FROM maintenance_records GROUP BY month")
    .all() as { month: string; n: number }[];
  const completed = db
    .prepare(
      "SELECT substr(completed_at, 1, 7) AS month, COUNT(*) AS n FROM maintenance_records WHERE completed_at IS NOT NULL GROUP BY month",
    )
    .all() as { month: string; n: number }[];
  const map = new Map<string, { month: string; created: number; completed: number }>();
  for (const c of created) map.set(c.month, { month: c.month, created: c.n, completed: 0 });
  for (const c of completed) {
    const e = map.get(c.month) ?? { month: c.month, created: 0, completed: 0 };
    e.completed = c.n;
    map.set(c.month, e);
  }
  return [...map.values()].sort((a, b) => a.month.localeCompare(b.month));
}

export function openDueByMonth(): { month: string; count: number }[] {
  return getDb()
    .prepare(
      `SELECT substr(due_date, 1, 7) AS month, COUNT(*) AS count FROM maintenance_records
       WHERE status != 'Completed' GROUP BY month ORDER BY month`,
    )
    .all() as { month: string; count: number }[];
}
