import "server-only";
import type { InspectionResult, User } from "@/types";
import type { ScenarioId } from "@/data/samples";
import { applyInspectionToAsset, getAsset } from "@/database/repositories/assets";
import { createInspection } from "@/database/repositories/inspections";
import { listMaintenanceForAsset } from "@/database/repositories/maintenance";
import { buildRecommendation } from "@/services/recommendationService";
import { computeRisk } from "@/services/riskEngine";
import { addDays, todayIso } from "@/utils/dates";
import { HttpError } from "../api";
import { getInspectionEngine } from "../ai";
import type { EngineImage } from "../ai/types";

/**
 * End-to-end inspection workflow:
 * asset -> AI engine -> risk engine -> recommendation -> persist inspection -> update asset.
 * The dashboard, registry, digital twin and map all read the updated asset row.
 */
export async function runInspection(params: {
  assetId: string;
  image: EngineImage;
  imageUrl: string;
  scenario?: ScenarioId;
  user: User;
}): Promise<InspectionResult> {
  const asset = getAsset(params.assetId);
  if (!asset) throw new HttpError(404, `Asset ${params.assetId} not found.`);

  const engine = getInspectionEngine();
  const { findings } = await engine.analyze({ asset, image: params.image, scenario: params.scenario });

  const today = todayIso();
  const assessment = computeRisk({
    today,
    installationDate: asset.installationDate,
    nextInspection: asset.nextInspection,
    previousCondition: asset.condition,
    findings,
    maintenance: listMaintenanceForAsset(asset.assetId).map((m) => ({ issue: m.issue, createdAt: m.createdAt })),
  });
  const rec = buildRecommendation(assessment, findings, today);

  const inspection = createInspection({
    assetId: asset.assetId,
    inspectionDate: today,
    inspectionType: "AI Inspection",
    inspector: params.user.name,
    imageUrl: params.imageUrl,
    condition: assessment.condition,
    riskScore: assessment.score,
    findingsSummary: findings.filter((f) => f.detected).map((f) => f.label).join("; ") || "No defects detected",
    recommendation: rec.text,
    riskFactors: assessment.factors,
    engine: `${engine.info.name} ${engine.info.version}`,
    findings,
  });

  applyInspectionToAsset(asset.assetId, {
    condition: assessment.condition,
    riskScore: assessment.score,
    lastInspection: today,
    nextInspection: addDays(today, rec.nextInspectionInDays),
  });

  return {
    inspection,
    assessment,
    engine: engine.info,
    suggestedAction: {
      issue: rec.issue,
      priority: rec.priority,
      dueDate: rec.dueDate,
      notes: `AI inspection ${today}: ${assessment.condition}, risk ${assessment.score}/100. ${rec.text}`,
    },
  };
}
