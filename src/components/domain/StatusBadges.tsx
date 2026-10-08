import type { AssetStatus, Condition, MaintenanceStatus, Priority } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { CONDITION_TONE, MAINT_TONE, PRIORITY_TONE } from "@/utils/format";

export function ConditionBadge({ condition }: { condition: Condition | null }) {
  if (!condition) return <Badge tone="slate">Not inspected</Badge>;
  return <Badge tone={CONDITION_TONE[condition]}>{condition}</Badge>;
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return <Badge tone={PRIORITY_TONE[priority]}>{priority}</Badge>;
}

export function MaintenanceBadge({ status }: { status: MaintenanceStatus | "None" }) {
  return <Badge tone={MAINT_TONE[status]}>{status === "None" ? "No open action" : status}</Badge>;
}

export function AssetStatusBadge({ status }: { status: AssetStatus }) {
  return <Badge tone={status === "Active" ? "green" : "blue"}>{status}</Badge>;
}

export function riskTextClass(score: number | null): string {
  if (score === null) return "text-slate-400";
  return score >= 61 ? "text-red-600" : score >= 31 ? "text-amber-600" : "text-green-600";
}

export function RiskScore({ score }: { score: number | null }) {
  if (score === null) return <span className="text-slate-400">—</span>;
  return <span className={`font-semibold tabular-nums ${riskTextClass(score)}`}>{score}<span className="font-normal text-slate-400"> / 100</span></span>;
}
