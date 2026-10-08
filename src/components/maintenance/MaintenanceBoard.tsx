"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";
import { MAINTENANCE_STATUSES, type MaintenanceRecord, type MaintenanceStatus } from "@/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState, ErrorBanner } from "@/components/ui/Feedback";
import { MaintenanceBadge, PriorityBadge } from "@/components/domain/StatusBadges";
import { CreateMaintenanceDialog } from "./CreateMaintenanceDialog";
import { updateMaintenanceStatus } from "@/services/maintenanceService";
import { cn } from "@/utils/cn";
import { formatDate, todayIso } from "@/utils/dates";
import { MAINT_TONE } from "@/utils/format";

const NEXT: Partial<Record<MaintenanceStatus, { to: MaintenanceStatus; label: string }>> = {
  Due: { to: "Scheduled", label: "Schedule" },
  Scheduled: { to: "In Progress", label: "Start work" },
  "In Progress": { to: "Completed", label: "Mark complete" },
};

const TAB_RING: Record<string, string> = {
  red: "border-red-500", blue: "border-blue-500", yellow: "border-amber-500", green: "border-green-500", slate: "border-slate-400",
};

export function MaintenanceBoard({
  records,
  counts,
}: {
  records: MaintenanceRecord[];
  counts: Record<MaintenanceStatus, number>;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<MaintenanceStatus>("Due");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const today = todayIso();

  const rows = records.filter((r) => r.status === tab);

  async function advance(r: MaintenanceRecord) {
    const next = NEXT[r.status];
    if (!next) return;
    setBusyId(r.id);
    setError(null);
    try {
      await updateMaintenanceStatus(r.id, next.to);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {MAINTENANCE_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setTab(s)}
            aria-pressed={tab === s}
            className={cn(
              "rounded-lg border border-slate-200 border-l-4 bg-white p-4 text-left shadow-sm transition-shadow hover:shadow-md",
              TAB_RING[MAINT_TONE[s]],
              tab === s && "ring-2 ring-blue-500/40",
            )}
          >
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{s === "Due" ? "Maintenance Due" : s}</p>
            <p className="text-2xl font-semibold tabular-nums text-slate-900">{counts[s]}</p>
          </button>
        ))}
      </div>

      <Card
        title={`${tab === "Due" ? "Maintenance due" : tab} (${counts[tab]})`}
        subtitle={tab === "Completed" ? "Showing the 50 most recent" : "Sorted by priority, then due date"}
        action={
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" aria-hidden /> New action
          </Button>
        }
        bodyClassName="p-0"
      >
        {error && <div className="p-4"><ErrorBanner message={error} /></div>}
        {rows.length === 0 ? (
          <EmptyState title={`No ${tab.toLowerCase()} maintenance`} hint="Actions created from an inspection or asset appear here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  {["Asset", "Issue", "Priority", "Assigned to", "Due", "Status", ""].map((h) => (
                    <th key={h} scope="col" className="px-4 py-2.5 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => {
                  const overdue = r.status !== "Completed" && r.dueDate < today;
                  const next = NEXT[r.status];
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3">
                        <Link href={`/assets/${r.assetId}`} className="font-medium text-blue-700 hover:underline">{r.assetId}</Link>
                      </td>
                      <td className="max-w-xs px-4 py-3 text-slate-700">{r.issue}</td>
                      <td className="px-4 py-3"><PriorityBadge priority={r.priority} /></td>
                      <td className="px-4 py-3 text-slate-600">{r.assignedTo}</td>
                      <td className={cn("whitespace-nowrap px-4 py-3", overdue ? "font-medium text-red-600" : "text-slate-600")}>
                        {formatDate(r.dueDate)}{overdue && " (overdue)"}
                      </td>
                      <td className="px-4 py-3"><MaintenanceBadge status={r.status} /></td>
                      <td className="px-4 py-3 text-right">
                        {next && (
                          <Button size="sm" variant="secondary" loading={busyId === r.id} onClick={() => advance(r)}>
                            {next.label}
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <CreateMaintenanceDialog key={creating ? "open" : "closed"} open={creating} onClose={() => setCreating(false)} />
    </>
  );
}
