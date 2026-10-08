import type { Asset, EngineInfo, Finding } from "@/types";
import type { ScenarioId } from "@/data/samples";

export interface EngineImage {
  /** Raw bytes when a file was uploaded; null for bundled sample images. */
  bytes: Buffer | null;
  filename: string;
  /** Set when the image is a bundled sample with a known scenario. */
  scenarioHint?: ScenarioId;
}

export interface EngineRequest {
  asset: Asset;
  image: EngineImage;
  /** Explicit scenario chosen in the UI (demo engine only). */
  scenario?: ScenarioId;
}

export interface EngineOutput {
  findings: Finding[];
}

/**
 * Contract every inspection engine must satisfy.
 *
 * To connect a real model (TensorFlow / PyTorch / hosted vision API), implement this interface,
 * map the model output to `Finding[]`, and register it in `./index.ts`. Nothing else changes:
 * the risk engine, persistence, API and UI all consume `Finding[]`.
 */
export interface InspectionEngine {
  readonly info: EngineInfo;
  analyze(request: EngineRequest): Promise<EngineOutput>;
}
