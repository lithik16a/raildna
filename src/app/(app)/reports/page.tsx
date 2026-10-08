import type { Metadata } from "next";
import { Download } from "lucide-react";
import { Card, PageHeader } from "@/components/ui/Card";
import { buttonClass } from "@/components/ui/Button";
import { getDashboardStats } from "@/database/repositories/assets";
import { formatNumber } from "@/utils/format";

export const metadata: Metadata = { title: "Reports" };

export default function ReportsPage() {
  const stats = getDashboardStats();
  const reports = [
    { kind: "assets", title: "Asset register", description: `All ${formatNumber(stats.totalAssets)} assets with condition, risk score, status and inspection dates.` },
    { kind: "maintenance", title: "Maintenance log", description: "Every maintenance action with priority, assignee, due date and status." },
  ];
  return (
    <>
      <PageHeader title="Reports" description="Export current data as CSV for sharing or offline review." />
      <div className="grid gap-6 md:grid-cols-2">
        {reports.map((r) => (
          <Card key={r.kind} title={r.title}>
            <p className="mb-4 text-sm text-slate-600">{r.description}</p>
            {/* Plain anchor: this is a file download, not a page navigation. */}
            <a href={`/api/reports/${r.kind}`} download className={buttonClass("secondary")}>
              <Download className="h-4 w-4" aria-hidden /> Download CSV
            </a>
          </Card>
        ))}
      </div>
      <p className="mt-6 text-xs text-slate-500">Exports contain synthetic demonstration data.</p>
    </>
  );
}
