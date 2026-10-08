import { DemoInspectionEngine } from "./demoEngine";
import type { InspectionEngine } from "./types";

let engine: InspectionEngine | null = null;

/**
 * Engine factory. Future: read INSPECTION_ENGINE and return a model-backed implementation
 * (e.g. new OnnxInspectionEngine() or new HostedVisionEngine(process.env.VISION_API_KEY)).
 */
export function getInspectionEngine(): InspectionEngine {
  if (!engine) {
    engine = new DemoInspectionEngine();
  }
  return engine;
}

export type { InspectionEngine } from "./types";
