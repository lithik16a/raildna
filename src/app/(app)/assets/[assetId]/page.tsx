import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, FileText, ImageIcon, MapPin } from "lucide-react";
import { AssetActions } from "@/components/assets/AssetActions";
import { ComponentTwin } from "@/components/domain/ComponentTwin";
import { InspectionTimeline } from "@/components/domain/InspectionTimeline";
import { RiskFactors } from "@/components/domain/RiskFactors";
import { RiskGauge } from "@/components/domain/RiskGauge";
import { AssetStatusBadge, ConditionBadge } from "@/components/domain/StatusBadges";
import { AssetMaintenanceList } from "@/components/maintenance/AssetMaintenanceList";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/Feedback";
import { Tabs } from "@/components/ui/Tabs";
import { getAsset } from "@/database/repositories/assets";
import { listInspectionsForAsset } from "@/database/repositories/inspections";
import { listMaintenanceForAsset } from "@/database/repositories/maintenance";
import type { Priority } from "@/types";
import { addDays, daysBetween, formatDate, formatDateLong, todayIso, yearsBetween } from "@/utils/dates";
import { riskLevelFromScore } from "@/utils/format";

type Props = { params: Promise<{ assetId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { assetId } = await params;
  return { title: assetId };
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 text-sm">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-900">{children}</dd>
    </div>
  );
}

export default async function AssetDetailPage({ params }: Props) {
  const { assetId } = await params;
  const asset = getAsset(decodeURIComponent(assetId));
  if (!asset) notFound();

  const inspections = listInspectionsForAsset(asset.assetId);
  const maintenance = listMaintenanceForAsset(asset.assetId);
  const latest = inspections[0] ?? null;
  const today = todayIso();

  const detected = latest ? latest.findingItems.filter((f) => f.detected).map((f) => f.type) : [];
  const overdueDays = asset.nextInspection ? daysBetween(asset.nextInspection, today) : 0;
  const level = asset.riskScore === null ? null : riskLevelFromScore(asset.riskScore);

  const priority: Priority = level === "High" ? "High" : level === "Moderate" ? "Medium" : "Low";
  const dueIn = level === "High" ? 14 : level === "Moderate" ? 45 : 90;
  const issueDefault = latest && latest.findings !== "No defects detected" ? latest.findings : "";

  const imageDocs = inspections.filter((i) => i.imageUrl);

  const overview = (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-6">
        <Card title="Digital twin" subtitle="Schematic component view, tinted by current condition">
          <ComponentTwin assetId={asset.assetId} assetType={asset.assetType} condition={asset.condition} detected={detected} />
        </Card>
        {latest?.imageUrl && (
          <Card title="Latest inspection image" subtitle={`${latest.inspectionType} · ${formatDate(latest.inspectionDate)}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={latest.imageUrl} alt={`Inspection of ${asset.assetId} on ${formatDate(latest.inspectionDate)}`} className="max-h-72 w-full rounded-md border border-slate-200 bg-slate-50 object-contain" />
          </Card>
        )}
      </div>

      <div className="space-y-6">
        <Card title="Asset profile">
          <dl className="divide-y divide-slate-100">
            <Row label="Asset ID">{asset.assetId}</Row>
            <Row label="Asset type">{asset.assetType}</Row>
            <Row label="Location">{asset.location}</Row>
            <Row label="Status"><AssetStatusBadge status={asset.status} /></Row>
            <Row label="Installation date">{formatDateLong(asset.installationDate)} <span className="font-normal text-slate-500">({yearsBetween(asset.installationDate, today).toFixed(1)} yrs)</span></Row>
            <Row label="Last inspection">{formatDateLong(asset.lastInspection)}</Row>
            <Row label="Next inspection">
              {formatDateLong(asset.nextInspection)}
              {overdueDays > 0 && <span className="ml-1.5 font-semibold text-red-600">({overdueDays} days overdue)</span>}
            </Row>
            <Row label="Condition"><ConditionBadge condition={asset.condition} /></Row>
            <Row label="Coordinates (demo)"><span className="inline-flex items-center gap-1 font-normal text-slate-600"><MapPin className="h-3.5 w-3.5" aria-hidden />{asset.latitude.toFixed(4)}, {asset.longitude.toFixed(4)}</span></Row>
          </dl>
        </Card>

        <Card title="Risk assessment" subtitle={latest ? `Based on ${latest.inspectionType.toLowerCase()} of ${formatDate(latest.inspectionDate)}` : undefined}>
          <RiskGauge score={asset.riskScore} />
          {latest && asset.riskScore !== null && (
            <div className="mt-5 border-t border-slate-100 pt-4">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Why this score</h3>
              <RiskFactors factors={latest.riskFactors} score={latest.riskScore} />
              {latest.recommendation && (
                <p className="mt-4 rounded-md bg-blue-50 px-3 py-2.5 text-sm text-blue-900"><strong>Recommendation:</strong> {latest.recommendation}</p>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );

  const documents = (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card title="Digital identity record">
        <dl className="divide-y divide-slate-100">
          <Row label="Identifier">{asset.assetId}</Row>
          <Row label="Registered">{formatDate(asset.createdAt)}</Row>
          <Row label="Lifecycle events">{inspections.length + maintenance.length} recorded</Row>
          <Row label="Physical marking">Not linked yet</Row>
        </dl>
        <p className="mt-3 text-xs text-slate-500">Physical marking and sensor linkage are planned future enhancements and are not part of this MVP.</p>
      </Card>
      <Card title="Inspection images">
        {imageDocs.length === 0 ? (
          <EmptyState title="No documents attached" hint="Images uploaded during AI inspections are stored here." />
        ) : (
          <ul className="space-y-2">
            {imageDocs.map((i) => (
              <li key={i.id}>
                <a href={i.imageUrl!} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-md border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50">
                  <ImageIcon className="h-4 w-4 text-slate-400" aria-hidden />
                  <span className="flex-1">{i.inspectionType}</span>
                  <span className="text-xs text-slate-500">{formatDate(i.inspectionDate)}</span>
                  <FileText className="h-4 w-4 text-slate-300" aria-hidden />
                </a>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );

  return (
    <>
      <Link href="/assets" className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ChevronLeft className="h-4 w-4" aria-hidden /> Asset Registry
      </Link>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{asset.assetId}</h1>
            <ConditionBadge condition={asset.condition} />
            <AssetStatusBadge status={asset.status} />
          </div>
          <p className="mt-1 text-sm text-slate-500">{asset.assetType} · {asset.location}</p>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">Complete digital identity and lifecycle history for this asset.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <AssetActions assetId={asset.assetId} defaults={{ issue: issueDefault, priority, dueDate: addDays(today, dueIn), notes: latest?.recommendation ?? "" }} />
        </div>
      </div>

      <Tabs
        tabs={[
          { id: "overview", label: "Overview" },
          { id: "inspections", label: "Inspection History", count: inspections.length },
          { id: "maintenance", label: "Maintenance", count: maintenance.length },
          { id: "documents", label: "Documents" },
        ]}
        panels={{
          overview,
          inspections: (
            <Card title="Inspection timeline"><InspectionTimeline inspections={inspections} /></Card>
          ),
          maintenance: (
            <Card title="Maintenance history" bodyClassName="p-2"><AssetMaintenanceList records={maintenance} /></Card>
          ),
          documents,
        }}
      />
    </>
  );
}
