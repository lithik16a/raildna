import "server-only";
import type { MaintenanceRecord, MaintenanceStatus, Priority } from "@/types";
import { assetExists, setNextInspection, updateAssetStatus } from "@/database/repositories/assets";
import {
  createMaintenance,
  getMaintenance,
  listMaintenanceForAsset,
  setMaintenanceStatus,
} from "@/database/repositories/maintenance";
import { addDays, todayIso } from "@/utils/dates";
import { HttpError } from "../api";

export function createMaintenanceAction(input: {
  assetId: string;
  issue: string;
  priority: Priority;
  assignedTo: string;
  dueDate: string;
  notes: string;
}): MaintenanceRecord {
  if (!assetExists(input.assetId)) throw new HttpError(404, `Asset ${input.assetId} not found.`);
  // New actions start as "Due" so they show up in the Maintenance Due KPI until planned.
  return createMaintenance(input);
}

function syncAssetStatus(assetId: string): void {
  const underWork = listMaintenanceForAsset(assetId).some((m) => m.status === "In Progress");
  updateAssetStatus(assetId, underWork ? "Under Maintenance" : "Active");
}

export function changeMaintenanceStatus(id: number, status: MaintenanceStatus): MaintenanceRecord {
  const existing = getMaintenance(id);
  if (!existing) throw new HttpError(404, "Maintenance record not found.");
  const updated = setMaintenanceStatus(id, status)!;
  syncAssetStatus(existing.assetId);
  if (status === "Completed") {
    // Work done: component must be re-inspected to verify the fix. Risk is only lowered by a new inspection.
    setNextInspection(existing.assetId, addDays(todayIso(), 7));
  }
  return updated;
}
