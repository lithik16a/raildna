import type { Condition, Finding, FindingType, RiskAssessment, RiskFactor } from "@/types";
import { conditionFromScore, riskLevelFromScore } from "@/utils/format";
import { daysBetween, yearsBetween } from "@/utils/dates";

/**
 * RailDNA risk engine - deliberately simple and fully transparent.
 *
 *   Risk Score (0-100) =
 *       Findings            (max 55)  severity weight x detection confidence
 *     + Condition & Age     (max 20)  component age + previous recorded condition
 *     + Maintenance History (max 15)  recent maintenance volume + repeated issue
 *     + Inspection Schedule (max 10)  how overdue the inspection is
 *
 *   0-30 Low | 31-60 Moderate | 61-100 High
 *
 * Every point is returned as a RiskFactor so the UI can explain WHY the score is what it is.
 */

export const FINDING_WEIGHTS: Record<FindingType, number> = {
  crack: 55,
  corrosion: 35,
  deformation: 30,
  loose_fastener: 30,
  surface_wear: 15,
};

const CAPS = { findings: 55, condition: 20, maintenance: 15, schedule: 10 } as const;

const ISSUE_KEYWORDS: Record<FindingType, string[]> = {
  crack: ["crack", "fracture"],
  corrosion: ["corro", "rust"],
  deformation: ["deform", "bent", "warp"],
  loose_fastener: ["loose", "missing", "fastener"],
  surface_wear: ["wear", "abrasion"],
};

export interface RiskInput {
  today: string;
  installationDate: string;
  nextInspection: string | null;
  previousCondition: Condition | null;
  findings: Finding[];
  /** Maintenance records for the asset (any status). */
  maintenance: { issue: string; createdAt: string }[];
}

export function computeRisk(input: RiskInput): RiskAssessment {
  const factors: RiskFactor[] = [];

  // 1. Findings ------------------------------------------------------------
  let findingPoints = 0;
  for (const f of input.findings.filter((x) => x.detected)) {
    const pts = Math.round(FINDING_WEIGHTS[f.type] * f.confidence);
    findingPoints += pts;
    factors.push({
      category: "Findings",
      label: f.label,
      points: pts,
      detail: `Severity weight ${FINDING_WEIGHTS[f.type]} x ${Math.round(f.confidence * 100)}% confidence`,
    });
  }
  if (findingPoints > CAPS.findings) {
    factors.push({
      category: "Findings",
      label: "Findings cap applied",
      points: CAPS.findings - findingPoints,
      detail: `Findings contribution limited to ${CAPS.findings} points`,
    });
    findingPoints = CAPS.findings;
  }

  // 2. Condition & age -----------------------------------------------------
  const ageYears = yearsBetween(input.installationDate, input.today);
  const agePts = ageYears < 2 ? 0 : ageYears < 5 ? 4 : ageYears < 8 ? 8 : 12;
  const prevPts = input.previousCondition === "High Risk" ? 10 : input.previousCondition === "Moderate" ? 6 : 0;
  const conditionPts = Math.min(CAPS.condition, agePts + prevPts);
  if (agePts > 0) {
    factors.push({
      category: "Condition & Age",
      label: `Component age ${ageYears.toFixed(1)} years`,
      points: agePts,
      detail: "Older components have accumulated more wear cycles",
    });
  }
  if (prevPts > 0) {
    factors.push({
      category: "Condition & Age",
      label: `Previous condition: ${input.previousCondition}`,
      points: prevPts,
      detail: "Last recorded condition carries forward until re-assessed",
    });
  }

  // 3. Maintenance history -------------------------------------------------
  const recent = input.maintenance.filter((m) => daysBetween(m.createdAt.slice(0, 10), input.today) <= 730);
  const volumePts = Math.min(12, recent.length * 4);
  const detectedTypes = input.findings.filter((f) => f.detected).map((f) => f.type);
  const repeated = recent.some((m) =>
    detectedTypes.some((t) => ISSUE_KEYWORDS[t].some((k) => m.issue.toLowerCase().includes(k))),
  );
  const repeatPts = repeated ? 4 : 0;
  const maintenancePts = Math.min(CAPS.maintenance, volumePts + repeatPts);
  if (volumePts > 0) {
    factors.push({
      category: "Maintenance History",
      label: `${recent.length} maintenance action${recent.length === 1 ? "" : "s"} in last 24 months`,
      points: volumePts,
      detail: "Frequent intervention indicates a recurring problem",
    });
  }
  if (repeatPts > 0) {
    factors.push({
      category: "Maintenance History",
      label: "Repeated maintenance issue",
      points: repeatPts,
      detail: "A detected defect matches a previously maintained issue",
    });
  }

  // 4. Inspection schedule -------------------------------------------------
  let schedulePts = 0;
  if (input.nextInspection) {
    const overdue = daysBetween(input.nextInspection, input.today);
    schedulePts = overdue <= 0 ? 0 : overdue <= 30 ? 4 : overdue <= 90 ? 7 : CAPS.schedule;
    if (schedulePts > 0) {
      factors.push({
        category: "Inspection Schedule",
        label: `Inspection overdue by ${overdue} days`,
        points: schedulePts,
        detail: "Condition has not been verified within the planned interval",
      });
    }
  }

  const score = Math.max(0, Math.min(100, findingPoints + conditionPts + maintenancePts + schedulePts));
  return {
    score,
    level: riskLevelFromScore(score),
    condition: conditionFromScore(score),
    factors,
  };
}
