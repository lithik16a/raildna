import { createHash } from "node:crypto";
import type { Finding } from "@/types";
import type { ScenarioId } from "@/data/samples";
import type { EngineOutput, EngineRequest, InspectionEngine } from "./types";

/**
 * DEMO inspection engine.
 *
 * This is NOT a computer-vision model. It returns deterministic, pre-defined findings:
 *  - explicit scenario (UI dropdown or bundled sample image) wins;
 *  - else a filename hint (e.g. "rust", "crack");
 *  - else a SHA-256 hash of the image bytes picks a scenario, so the same image always gives the same result.
 * Results are clearly labelled as simulated in the API response and the UI.
 */

const SCENARIOS: Record<ScenarioId, Finding[]> = {
  corrosion_wear: [
    { type: "corrosion", label: "Corrosion Detected", detected: true, confidence: 0.92 },
    { type: "surface_wear", label: "Surface Wear Detected", detected: true, confidence: 0.87 },
    { type: "crack", label: "No Major Crack Detected", detected: false, confidence: 0.96 },
  ],
  crack: [
    { type: "crack", label: "Crack Detected", detected: true, confidence: 0.94 },
    { type: "surface_wear", label: "Surface Wear Detected", detected: true, confidence: 0.78 },
    { type: "corrosion", label: "No Significant Corrosion", detected: false, confidence: 0.9 },
  ],
  loose_fastener: [
    { type: "loose_fastener", label: "Loose Fastener Detected", detected: true, confidence: 0.89 },
    { type: "surface_wear", label: "Surface Wear Detected", detected: true, confidence: 0.64 },
    { type: "crack", label: "No Major Crack Detected", detected: false, confidence: 0.95 },
  ],
  healthy: [
    { type: "corrosion", label: "No Significant Corrosion", detected: false, confidence: 0.95 },
    { type: "surface_wear", label: "No Significant Surface Wear", detected: false, confidence: 0.91 },
    { type: "crack", label: "No Major Crack Detected", detected: false, confidence: 0.97 },
  ],
};

const FILENAME_HINTS: [RegExp, ScenarioId][] = [
  [/crack|fractur|broken/i, "crack"],
  [/loose|bolt|missing/i, "loose_fastener"],
  [/rust|corro|worn|wear/i, "corrosion_wear"],
  [/healthy|good|clean|new/i, "healthy"],
];

const HASH_ORDER: ScenarioId[] = ["corrosion_wear", "healthy", "loose_fastener", "crack", "corrosion_wear", "healthy"];

export function pickScenario(req: EngineRequest): ScenarioId {
  if (req.scenario) return req.scenario;
  if (req.image.scenarioHint) return req.image.scenarioHint;
  const hint = FILENAME_HINTS.find(([re]) => re.test(req.image.filename));
  if (hint) return hint[1];
  if (req.image.bytes) {
    const digest = createHash("sha256").update(req.image.bytes).digest();
    return HASH_ORDER[digest[0] % HASH_ORDER.length];
  }
  return "corrosion_wear";
}

export class DemoInspectionEngine implements InspectionEngine {
  readonly info = {
    name: "RailDNA Demo Inspection Engine",
    version: "0.1-demo",
    isDemo: true,
    disclaimer:
      "Simulated result. This MVP uses a deterministic demo engine, not a trained computer-vision model.",
  };

  async analyze(request: EngineRequest): Promise<EngineOutput> {
    const scenario = pickScenario(request);
    // Copy so callers can never mutate the shared scenario table.
    return { findings: SCENARIOS[scenario].map((f) => ({ ...f })) };
  }
}
