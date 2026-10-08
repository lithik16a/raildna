import { ImageIcon } from "lucide-react";
import type { InspectionWithFindings } from "@/types";
import { EmptyState } from "@/components/ui/Feedback";
import { Badge } from "@/components/ui/Badge";
import { ConditionBadge } from "./StatusBadges";
import { formatDate } from "@/utils/dates";
import { pct } from "@/utils/format";

export function InspectionTimeline({ inspections }: { inspections: InspectionWithFindings[] }) {
  if (inspections.length === 0) {
    return <EmptyState title="No inspections recorded" hint="Run an AI inspection to create the first entry in this asset's history." />;
  }
  return (
    <ol className="relative space-y-5 border-l-2 border-slate-200 pl-6">
      {inspections.map((i) => {
        const tone = i.condition === "High Risk" ? "bg-red-500" : i.condition === "Moderate" ? "bg-amber-500" : "bg-green-500";
        return (
          <li key={i.id} className="relative">
            <span className={`absolute -left-[31px] top-1.5 h-3 w-3 rounded-full ring-4 ring-white ${tone}`} aria-hidden />
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <time className="text-sm font-semibold text-slate-900">{formatDate(i.inspectionDate)}</time>
              <Badge tone={i.inspectionType === "AI Inspection" ? "blue" : "slate"} dot={false}>{i.inspectionType}</Badge>
              <ConditionBadge condition={i.condition} />
              <span className="text-sm tabular-nums text-slate-500">Risk {i.riskScore}/100</span>
            </div>
            <p className="mt-1 text-sm text-slate-600">Engineer: {i.inspector}</p>
            <p className="mt-1 text-sm text-slate-700">{i.findings}</p>
            {i.findingItems.length > 0 && (
              <p className="mt-1 text-xs text-slate-500">
                {i.findingItems.map((f) => `${f.label} ${pct(f.confidence)}`).join("  ·  ")}
              </p>
            )}
            {i.recommendation && <p className="mt-1 text-xs italic text-slate-500">{i.recommendation}</p>}
            {i.imageUrl && (
              <a href={i.imageUrl} target="_blank" rel="noreferrer" className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline">
                <ImageIcon className="h-3.5 w-3.5" aria-hidden /> View inspection image
              </a>
            )}
          </li>
        );
      })}
    </ol>
  );
}
