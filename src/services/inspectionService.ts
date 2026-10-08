import type { InspectionResult } from "@/types";
import type { ScenarioId } from "@/data/samples";
import { request } from "./apiClient";

/**
 * The only entry point the UI uses for AI inspection.
 * It calls POST /api/inspections, which runs the server-side InspectionEngine
 * (currently the DEMO engine, see src/server/ai). Swapping in a real model needs no UI change.
 */
export type InspectionImage =
  | { kind: "file"; file: File }
  | { kind: "sample"; sampleId: string };

export async function analyzeInspection(
  assetId: string,
  image: InspectionImage,
  options: { scenario?: ScenarioId } = {},
): Promise<InspectionResult> {
  const form = new FormData();
  form.set("assetId", assetId);
  if (options.scenario) form.set("scenario", options.scenario);
  if (image.kind === "file") form.set("image", image.file);
  else form.set("sampleId", image.sampleId);
  return request<InspectionResult>("/api/inspections", { method: "POST", body: form });
}
