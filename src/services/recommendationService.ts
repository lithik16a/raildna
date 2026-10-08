import type { Finding, Priority, RiskAssessment } from "@/types";
import { addDays } from "@/utils/dates";

export interface Recommendation {
  text: string;
  issue: string;
  priority: Priority;
  dueInDays: number;
  dueDate: string;
  nextInspectionInDays: number;
}

/** Rule-based recommendation derived from the risk assessment. Pure and deterministic. */
export function buildRecommendation(assessment: RiskAssessment, findings: Finding[], today: string): Recommendation {
  const detected = findings.filter((f) => f.detected);
  const hasCrack = detected.some((f) => f.type === "crack");
  const issue = detected.length
    ? detected.map((f) => f.label).join("; ")
    : "Routine condition follow-up";

  let text: string;
  let priority: Priority;
  let dueInDays: number;
  let nextInspectionInDays: number;

  if (assessment.level === "High") {
    priority = hasCrack ? "Critical" : "High";
    dueInDays = hasCrack ? 3 : 14;
    nextInspectionInDays = 30;
    text = hasCrack
      ? "Crack detected. Apply speed caution and replace the component within 3 days."
      : "Schedule maintenance within 2 weeks.";
  } else if (assessment.level === "Moderate") {
    priority = "Medium";
    dueInDays = 45;
    nextInspectionInDays = 90;
    text = "Monitor closely. Plan maintenance within 6 weeks and re-inspect in 90 days.";
  } else {
    priority = "Low";
    dueInDays = 90;
    nextInspectionInDays = 180;
    text = "No action required. Continue routine inspection schedule.";
  }

  return { text, issue, priority, dueInDays, dueDate: addDays(today, dueInDays), nextInspectionInDays };
}
