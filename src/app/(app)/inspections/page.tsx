import type { Metadata } from "next";
import Link from "next/link";
import { InspectionWorkbench } from "@/components/inspection/InspectionWorkbench";
import { ConditionBadge } from "@/components/domain/StatusBadges";
import { Badge } from "@/components/ui/Badge";
import { Card, PageHeader } from "@/components/ui/Card";
import { listAssetSummaries } from "@/database/repositories/assets";
import { listRecentInspections } from "@/database/repositories/inspections";
import { formatDate } from "@/utils/dates";

export const metadata: Metadata = { title: "AI Inspection" };

type Params = Promise<Record<string, string | string[] | undefined>>;

export default async function InspectionsPage({ searchParams }: { searchParams: Params }) {
  const sp = await searchParams;
  const asset = Array.isArray(sp.asset) ? sp.asset[0] : sp.asset;
  const assets = listAssetSummaries().map((a) => ({
    assetId: a.assetId,
    assetType: a.assetType,
    location: a.location,
    condition: a.condition,
    riskScore: a.riskScore,
  }));
  const recent = listRecentInspections(10);

  return (
    <>
      <PageHeader title="AI Inspection" description="Select an asset, add a component image and run an AI-assisted inspection. The result updates the asset's digital twin and the dashboard." />
      <InspectionWorkbench assets={assets} initialAssetId={asset ?? null} />

      <div className="mt-8">
        <Card title="Recent inspections" bodyClassName="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>{["Date", "Asset", "Type", "Condition", "Risk", "Engineer"].map((h) => <th key={h} scope="col" className="px-4 py-2.5 font-medium">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recent.map((i) => (
                  <tr key={i.id} className="hover:bg-slate-50/70">
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(i.inspectionDate)}</td>
                    <td className="px-4 py-3"><Link href={`/assets/${i.assetId}`} className="font-medium text-blue-700 hover:underline">{i.assetId}</Link></td>
                    <td className="px-4 py-3"><Badge tone={i.inspectionType === "AI Inspection" ? "blue" : "slate"} dot={false}>{i.inspectionType}</Badge></td>
                    <td className="px-4 py-3"><ConditionBadge condition={i.condition} /></td>
                    <td className="px-4 py-3 tabular-nums">{i.riskScore}/100</td>
                    <td className="px-4 py-3 text-slate-600">{i.inspector}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </>
  );
}
