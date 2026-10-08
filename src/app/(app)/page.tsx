import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ClipboardCheck, ScanSearch, Train, Wrench } from "lucide-react";
import { AssetMap } from "@/components/map/AssetMap";
import { CHART_COLORS, SimpleBarChart } from "@/components/charts/Charts";
import { KpiCard } from "@/components/domain/KpiCard";
import { ConditionBadge, PriorityBadge, RiskScore } from "@/components/domain/StatusBadges";
import { Card, PageHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/Feedback";
import { Badge } from "@/components/ui/Badge";
import { countByType, getDashboardStats, listAssetSummaries, listHighRiskAssets } from "@/database/repositories/assets";
import { listRecentInspections } from "@/database/repositories/inspections";
import { listDueSoon } from "@/database/repositories/maintenance";
import { formatDate, todayIso } from "@/utils/dates";
import { formatNumber } from "@/utils/format";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  const stats = getDashboardStats();
  const assets = listAssetSummaries();
  const byType = countByType().map((t) => ({ label: t.type, count: t.count }));
  const recent = listRecentInspections(6);
  const highRisk = listHighRiskAssets(6);
  const due = listDueSoon(6);
  const today = todayIso();

  const coverage = stats.totalAssets ? Math.round((stats.inspected / stats.totalAssets) * 100) : 0;
  const highShare = stats.inspected ? ((stats.highRisk / stats.inspected) * 100).toFixed(1) : "0";

  return (
    <>
      <PageHeader title="Dashboard" description="Network-wide asset health at a glance. Figures are synthetic demonstration data, not real railway records." />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total Assets" value={formatNumber(stats.totalAssets)} hint="Registered with a digital identity" icon={<Train className="h-6 w-6" />} accent="blue" href="/assets" />
        <KpiCard label="Inspected" value={formatNumber(stats.inspected)} hint={`${coverage}% inspection coverage`} icon={<ClipboardCheck className="h-6 w-6" />} accent="green" href="/inspections" />
        <KpiCard label="High Risk" value={formatNumber(stats.highRisk)} hint={`${highShare}% of inspected assets`} icon={<AlertTriangle className="h-6 w-6" />} accent="red" href="/assets?condition=High%20Risk" />
        <KpiCard label="Maintenance Due" value={formatNumber(stats.maintenanceDue)} hint="Open actions awaiting scheduling" icon={<Wrench className="h-6 w-6" />} accent="yellow" href="/maintenance" />
      </div>

      <div className="mb-6 grid gap-6 xl:grid-cols-3">
        <Card title="Asset map" subtitle="Schematic view, demo coordinates" className="xl:col-span-2" action={<Link href="/map" className="text-xs font-medium text-blue-600 hover:underline">Full map</Link>}>
          <AssetMap assets={assets} compact />
        </Card>
        <Card title="Asset type distribution" subtitle="Registered assets by component type">
          <SimpleBarChart data={byType} series={[{ key: "count", name: "Assets", color: CHART_COLORS.navy }]} height={330} />
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card title="Recent inspections" action={<Link href="/inspections" className="text-xs font-medium text-blue-600 hover:underline">New inspection</Link>} bodyClassName="p-0">
          {recent.length === 0 ? (
            <EmptyState title="No inspections yet" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {recent.map((i) => (
                <li key={i.id}>
                  <Link href={`/assets/${i.assetId}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-slate-50">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">{i.assetId}</p>
                      <p className="truncate text-xs text-slate-500">
                        {i.assetType} · {i.inspectionType} · {formatDate(i.inspectionDate)}
                        {i.inspectionDate === today && <Badge tone="blue" dot={false} className="ml-1.5">Today</Badge>}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <ConditionBadge condition={i.condition} />
                      <span className="text-xs tabular-nums text-slate-500">{i.riskScore}/100</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="High risk assets" subtitle="Highest scores first" action={<Link href="/assets?condition=High%20Risk" className="text-xs font-medium text-blue-600 hover:underline">View all</Link>} bodyClassName="p-0">
          {highRisk.length === 0 ? (
            <EmptyState title="No high risk assets" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {highRisk.map((a) => (
                <li key={a.assetId}>
                  <Link href={`/assets/${a.assetId}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-slate-50">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">{a.assetId}</p>
                      <p className="truncate text-xs text-slate-500">{a.assetType} · {a.location.replace(" Railway Section", "")}</p>
                    </div>
                    <RiskScore score={a.riskScore} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Maintenance due" subtitle="By priority, then due date" action={<Link href="/maintenance" className="text-xs font-medium text-blue-600 hover:underline">View all</Link>} bodyClassName="p-0">
          {due.length === 0 ? (
            <EmptyState title="Nothing due" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {due.map((m) => (
                <li key={m.id}>
                  <Link href={`/assets/${m.assetId}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-slate-50">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">{m.assetId}</p>
                      <p className="truncate text-xs text-slate-500">{m.issue} · due {formatDate(m.dueDate)}</p>
                    </div>
                    <PriorityBadge priority={m.priority} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <p className="mt-6 flex items-center gap-2 text-xs text-slate-500">
        <ScanSearch className="h-3.5 w-3.5" aria-hidden />
        Inspection results in this MVP come from a simulated demo engine, not a trained vision model.
      </p>
    </>
  );
}
