import { listAssetSummaries } from "@/database/repositories/assets";
import { listMaintenance } from "@/database/repositories/maintenance";
import { HttpError, handler } from "@/server/api";
import { todayIso } from "@/utils/dates";

// Guards against CSV/formula injection when opened in spreadsheet software.
function cell(v: string | number | null | undefined): string {
  let s = v === null || v === undefined ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

function csv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  return [headers.map(cell).join(","), ...rows.map((r) => r.map(cell).join(","))].join("\r\n");
}

export const GET = handler(async (_req, _user, ctx: { params: Promise<{ kind: string }> }) => {
  const { kind } = await ctx.params;
  let body: string;
  if (kind === "assets") {
    body = csv(
      ["Asset ID", "Type", "Location", "Condition", "Risk Score", "Status", "Last Inspection", "Next Inspection", "Maintenance Status"],
      listAssetSummaries().map((a) => [a.assetId, a.assetType, a.location, a.condition ?? "Not inspected", a.riskScore, a.status, a.lastInspection, a.nextInspection, a.maintenanceStatus]),
    );
  } else if (kind === "maintenance") {
    body = csv(
      ["ID", "Asset ID", "Issue", "Priority", "Status", "Assigned To", "Due Date", "Created", "Completed"],
      listMaintenance(10_000).map((m) => [m.id, m.assetId, m.issue, m.priority, m.status, m.assignedTo, m.dueDate, m.createdAt.slice(0, 10), m.completedAt?.slice(0, 10)]),
    );
  } else {
    throw new HttpError(404, "Unknown report.");
  }
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="raildna-${kind}-${todayIso()}.csv"`,
    },
  });
});
