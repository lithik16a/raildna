import type { MaintenanceRecord, MaintenanceStatus, Priority } from "@/types";
import { request } from "./apiClient";

export interface CreateMaintenanceInput {
  assetId: string;
  issue: string;
  priority: Priority;
  assignedTo: string;
  dueDate: string;
  notes: string;
}

export async function createMaintenanceAction(input: CreateMaintenanceInput): Promise<MaintenanceRecord> {
  const res = await request<{ record: MaintenanceRecord }>("/api/maintenance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return res.record;
}

export async function updateMaintenanceStatus(id: number, status: MaintenanceStatus): Promise<MaintenanceRecord> {
  const res = await request<{ record: MaintenanceRecord }>(`/api/maintenance/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  return res.record;
}
