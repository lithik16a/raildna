import type { MaintenanceRecord } from "@/types";
import { EmptyState } from "@/components/ui/Feedback";
import { MaintenanceBadge, PriorityBadge } from "@/components/domain/StatusBadges";
import { formatDate } from "@/utils/dates";

export function AssetMaintenanceList({ records }: { records: MaintenanceRecord[] }) {
  if (records.length === 0) {
    return <EmptyState title="No maintenance history" hint="Create a maintenance action to start this asset's maintenance record." />;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="text-xs uppercase tracking-wide text-slate-500">
          <tr>
            {["Raised", "Issue", "Priority", "Assigned to", "Due", "Status"].map((h) => (
              <th key={h} scope="col" className="px-3 py-2 font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {records.map((r) => (
            <tr key={r.id}>
              <td className="whitespace-nowrap px-3 py-2.5 text-slate-600">{formatDate(r.createdAt)}</td>
              <td className="px-3 py-2.5 text-slate-800">
                {r.issue}
                {r.notes && <p className="text-xs text-slate-500">{r.notes}</p>}
              </td>
              <td className="px-3 py-2.5"><PriorityBadge priority={r.priority} /></td>
              <td className="px-3 py-2.5 text-slate-600">{r.assignedTo}</td>
              <td className="whitespace-nowrap px-3 py-2.5 text-slate-600">{formatDate(r.dueDate)}</td>
              <td className="px-3 py-2.5"><MaintenanceBadge status={r.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
