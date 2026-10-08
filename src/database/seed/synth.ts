import type { Finding, FindingType, RiskAssessment, RiskFactor } from "@/types";
import { FINDING_WEIGHTS } from "@/services/riskEngine";
import { conditionFromScore, riskLevelFromScore } from "@/utils/format";
import type { Rng } from "./rng";

export type Cls = "good" | "moderate" | "high";

const LABELS: Record<FindingType, [string, string]> = {
  corrosion: ["Corrosion Detected", "No Significant Corrosion"],
  surface_wear: ["Surface Wear Detected", "No Significant Surface Wear"],
  crack: ["Crack Detected", "No Major Crack Detected"],
  deformation: ["Deformation Detected", "No Deformation Detected"],
  loose_fastener: ["Loose Fastener Detected", "Fastener Secure"],
};

function f(rng: Rng, type: FindingType, detected: boolean, lo: number, hi: number): Finding {
  return {
    type,
    detected,
    label: LABELS[type][detected ? 0 : 1],
    confidence: Math.round(rng.float(lo, hi) * 100) / 100,
  };
}

function findingsFor(cls: Cls, rng: Rng): Finding[] {
  if (cls === "good") {
    return [f(rng, "corrosion", false, 0.9, 0.98), f(rng, "surface_wear", false, 0.88, 0.97), f(rng, "crack", false, 0.93, 0.99)];
  }
  if (cls === "moderate") {
    const v = rng.int(0, 2);
    if (v === 0) return [f(rng, "surface_wear", true, 0.65, 0.92), f(rng, "corrosion", false, 0.85, 0.96), f(rng, "crack", false, 0.92, 0.98)];
    if (v === 1) return [f(rng, "corrosion", true, 0.5, 0.75), f(rng, "surface_wear", true, 0.4, 0.7), f(rng, "crack", false, 0.92, 0.98)];
    return [f(rng, "loose_fastener", true, 0.55, 0.8), f(rng, "crack", false, 0.92, 0.98)];
  }
  const v = rng.int(0, 2);
  if (v === 0) return [f(rng, "corrosion", true, 0.82, 0.97), f(rng, "surface_wear", true, 0.7, 0.94), f(rng, "crack", false, 0.93, 0.98)];
  if (v === 1) return [f(rng, "crack", true, 0.85, 0.97), f(rng, "surface_wear", true, 0.6, 0.85)];
  return [f(rng, "loose_fastener", true, 0.8, 0.96), f(rng, "corrosion", true, 0.6, 0.9), f(rng, "crack", false, 0.93, 0.98)];
}

function inBand(score: number, cls: Cls): boolean {
  const level = riskLevelFromScore(score);
  return (cls === "good" && level === "Low") || (cls === "moderate" && level === "Moderate") || (cls === "high" && level === "High");
}

/**
 * Builds a historical assessment for seed data: random-but-plausible findings and context points
 * whose total lands in the band for `cls`. Points always sum to the stored score.
 */
export function synthAssessment(cls: Cls, rng: Rng): { assessment: RiskAssessment; findings: Finding[] } {
  for (let attempt = 0; attempt < 500; attempt++) {
    const findings = findingsFor(cls, rng);
    const factors: RiskFactor[] = [];
    let fp = 0;
    for (const x of findings.filter((y) => y.detected)) {
      const pts = Math.round(FINDING_WEIGHTS[x.type] * x.confidence);
      fp += pts;
      factors.push({
        category: "Findings",
        label: x.label,
        points: pts,
        detail: `Severity weight ${FINDING_WEIGHTS[x.type]} x ${Math.round(x.confidence * 100)}% confidence`,
      });
    }
    if (fp > 55) {
      factors.push({ category: "Findings", label: "Findings cap applied", points: 55 - fp, detail: "Findings contribution limited to 55 points" });
      fp = 55;
    }
    const c = rng.int(0, cls === "good" ? 8 : 20);
    const m = rng.pick([0, 4, 8, 12]);
    const s = rng.pick([0, 0, 4, 7, 10]);
    const score = fp + c + m + s;
    if (!inBand(score, cls)) continue;

    if (c > 0) factors.push({ category: "Condition & Age", label: "Component age and previous condition", points: c, detail: "Older components and prior findings add baseline risk" });
    if (m > 0) factors.push({ category: "Maintenance History", label: "Recurring maintenance actions", points: m, detail: "Frequent intervention indicates a recurring problem" });
    if (s > 0) factors.push({ category: "Inspection Schedule", label: "Inspection overdue", points: s, detail: "Condition not verified within the planned interval" });

    return { assessment: { score, level: riskLevelFromScore(score), condition: conditionFromScore(score), factors }, findings };
  }
  throw new Error(`Seed synthesis failed for class ${cls}`);
}
