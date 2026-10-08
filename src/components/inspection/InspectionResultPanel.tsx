"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, Info, MinusCircle, AlertTriangle, Wrench } from "lucide-react";
import type { InspectionResult } from "@/types";
import { RiskFactors } from "@/components/domain/RiskFactors";
import { RiskGauge } from "@/components/domain/RiskGauge";
import { ConditionBadge } from "@/components/domain/StatusBadges";
import { CreateMaintenanceDialog } from "@/components/maintenance/CreateMaintenanceDialog";
import { Button, buttonClass } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { pct } from "@/utils/format";

export function InspectionResultPanel({ result }: { result: InspectionResult }) {
  const [creating, setCreating] = useState(false);
  const { inspection, assessment, suggestedAction, engine } = result;
  const barColor = (detected: boolean) => (detected ? "bg-red-500" : "bg-green-500");

  return (
    <div className="space-y-6" aria-live="polite">
      {engine.isDemo && (
        <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span><strong>Demo engine.</strong> {engine.disclaimer}</span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card title="Assessment" subtitle={`${inspection.assetId} · saved to inspection history`}>
          <div className="flex flex-col items-center gap-3">
            <ConditionBadge condition={assessment.condition} />
            <RiskGauge score={assessment.score} />
          </div>
          <p className="mt-4 rounded-md bg-blue-50 px-3 py-2.5 text-sm text-blue-900">
            <strong>Recommendation:</strong> {inspection.recommendation}
          </p>
        </Card>

        <Card title="Detected issues" subtitle="Confidence per check">
          <ul className="space-y-3">
            {inspection.findingItems.map((f) => (
              <li key={f.id ?? f.type}>
                <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2 font-medium text-slate-900">
                    {f.detected ? <AlertTriangle className="h-4 w-4 text-red-500" aria-hidden /> : <CheckCircle2 className="h-4 w-4 text-green-600" aria-hidden />}
                    {f.label}
                  </span>
                  <span className="tabular-nums text-slate-600">{pct(f.confidence)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={Math.round(f.confidence * 100)} aria-valuemin={0} aria-valuemax={100} aria-label={`${f.label} confidence`}>
                  <div className={`h-full rounded-full ${barColor(f.detected)}`} style={{ width: pct(f.confidence) }} />
                </div>
              </li>
            ))}
            {inspection.findingItems.every((f) => !f.detected) && (
              <li className="flex items-center gap-2 text-sm text-slate-600"><MinusCircle className="h-4 w-4" aria-hidden /> No defects detected.</li>
            )}
          </ul>
        </Card>
      </div>

      <Card title="Why this risk score" subtitle="Every point is attributed to a factor. Risk = findings + condition & age + maintenance history + inspection schedule.">
        <RiskFactors factors={assessment.factors} score={assessment.score} />
      </Card>

      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mr-auto text-sm text-slate-600">
          Next step: log a maintenance action for <strong>{inspection.assetId}</strong>.
        </div>
        <Link href={`/assets/${inspection.assetId}`} className={buttonClass("secondary")}>View digital twin</Link>
        <Button onClick={() => setCreating(true)}>
          <Wrench className="h-4 w-4" aria-hidden /> Create maintenance action
        </Button>
      </div>

      <CreateMaintenanceDialog
        key={`${inspection.id}-${creating}`}
        open={creating}
        onClose={() => setCreating(false)}
        lockAsset
        defaults={{
          assetId: inspection.assetId,
          issue: suggestedAction.issue,
          priority: suggestedAction.priority,
          dueDate: suggestedAction.dueDate,
          notes: suggestedAction.notes,
        }}
      />
    </div>
  );
}
