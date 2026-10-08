import type { Condition, MaintenanceStatus, Priority, RiskLevel } from "@/types";

export function riskLevelFromScore(score: number): RiskLevel {
  if (score >= 61) return "High";
  if (score >= 31) return "Moderate";
  return "Low";
}

export function conditionFromScore(score: number): Condition {
  const level = riskLevelFromScore(score);
  return level === "High" ? "High Risk" : level === "Moderate" ? "Moderate" : "Good";
}

export function riskLabel(level: RiskLevel): string {
  return `${level.toUpperCase()} RISK`;
}

export const CONDITION_TONE: Record<Condition, "green" | "yellow" | "red"> = {
  Good: "green",
  Moderate: "yellow",
  "High Risk": "red",
};

export const PRIORITY_TONE: Record<Priority, "slate" | "blue" | "yellow" | "red"> = {
  Low: "slate",
  Medium: "blue",
  High: "yellow",
  Critical: "red",
};

export const MAINT_TONE: Record<MaintenanceStatus | "None", "slate" | "red" | "blue" | "yellow" | "green"> = {
  None: "slate",
  Due: "red",
  Scheduled: "blue",
  "In Progress": "yellow",
  Completed: "green",
};

export function formatNumber(n: number): string {
  return n.toLocaleString("en-IN");
}

export function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}
