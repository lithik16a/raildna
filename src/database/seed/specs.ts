import type { AssetType, InspectionType, MaintenanceStatus, Priority } from "@/types";
import { Rng } from "./rng";
import type { Cls } from "./synth";

export type AssetClass = Cls | "none";

export interface MaintSpec {
  issue: string;
  daysAgo: number; // when the record was created
  status: MaintenanceStatus;
  priority: Priority;
  dueOffset: number; // open records: days from today (negative = overdue). Ignored when Completed.
  assignedTo?: string;
}

export interface HistorySpec {
  daysAgo: number;
  type: InspectionType;
  cls: Cls;
}

export interface AssetSpec {
  num: number;
  type: AssetType;
  section: number;
  install: string;
  cls: AssetClass;
  lastDaysAgo?: number;
  nextOffset?: number;
  history?: HistorySpec[];
  maint: MaintSpec[];
}

/** Targets for the demo KPI cards (synthetic demo numbers). */
export const TARGETS = { total: 1248, inspected: 842, highRisk: 37, moderate: 230, maintenanceDue: 64 };

export { ENGINEERS } from "@/data/engineers";

const m = (issue: string, daysAgo: number, status: MaintenanceStatus, priority: Priority, dueOffset: number): MaintSpec => ({
  issue, daysAgo, status, priority, dueOffset,
});

export const CURATED: AssetSpec[] = [
  {
    num: 4587, type: "Fishplate", section: 0, install: "2020-03-12", cls: "moderate", lastDaysAgo: 135, nextOffset: -45,
    history: [
      { daysAgo: 315, type: "Maintenance Inspection", cls: "good" },
      { daysAgo: 495, type: "Routine Inspection", cls: "good" },
    ],
    maint: [
      m("Corrosion detected on fishplate bolts", 300, "Completed", "Medium", 0),
      m("Bolt re-tightening and lubrication", 540, "Completed", "Low", 0),
    ],
  },
  { num: 4481, type: "Rail Clip", section: 0, install: "2019-08-20", cls: "high", lastDaysAgo: 20, nextOffset: 10, maint: [m("Clip fatigue cracking", 6, "Due", "High", 8)] },
  { num: 4512, type: "Base Plate", section: 2, install: "2018-11-05", cls: "high", lastDaysAgo: 35, nextOffset: -5, maint: [m("Base plate seating wear", 12, "Scheduled", "High", 9)] },
  { num: 4390, type: "Sleeper", section: 1, install: "2017-06-14", cls: "moderate", lastDaysAgo: 60, nextOffset: 30, maint: [] },
  { num: 4267, type: "Fastener", section: 3, install: "2021-02-09", cls: "good", lastDaysAgo: 44, nextOffset: 136, maint: [] },
  { num: 4601, type: "Fishplate", section: 4, install: "2016-09-30", cls: "high", lastDaysAgo: 12, nextOffset: 18, maint: [m("Fishplate crack suspected", 3, "Due", "Critical", 4)] },
  { num: 4433, type: "Rail Clip", section: 5, install: "2022-01-17", cls: "good", lastDaysAgo: 70, nextOffset: 110, maint: [] },
  { num: 4350, type: "Base Plate", section: 6, install: "2019-04-02", cls: "moderate", lastDaysAgo: 92, nextOffset: -2, maint: [m("Base plate bolt replacement", 9, "In Progress", "Medium", 3)] },
  { num: 4298, type: "Sleeper", section: 7, install: "2015-12-11", cls: "high", lastDaysAgo: 25, nextOffset: 5, maint: [m("Sleeper replacement", 14, "In Progress", "High", 2)] },
  { num: 4655, type: "Fastener", section: 8, install: "2023-05-21", cls: "good", lastDaysAgo: 30, nextOffset: 150, maint: [] },
  { num: 4702, type: "Fishplate", section: 9, install: "2020-10-08", cls: "moderate", lastDaysAgo: 110, nextOffset: -20, maint: [m("Fishplate bolt corrosion", 5, "Due", "Medium", 12)] },
  { num: 4310, type: "Rail Clip", section: 10, install: "2021-07-19", cls: "good", lastDaysAgo: 55, nextOffset: 125, maint: [] },
  { num: 4466, type: "Sleeper", section: 11, install: "2018-03-03", cls: "moderate", lastDaysAgo: 75, nextOffset: 15, maint: [] },
  { num: 4529, type: "Base Plate", section: 12, install: "2017-09-25", cls: "high", lastDaysAgo: 8, nextOffset: 22, maint: [m("Base plate crack repair", 4, "Scheduled", "High", 10)] },
  { num: 4571, type: "Fastener", section: 13, install: "2022-11-14", cls: "none", maint: [] },
  { num: 4620, type: "Fishplate", section: 14, install: "2019-01-29", cls: "good", lastDaysAgo: 90, nextOffset: 90, maint: [] },
  { num: 4288, type: "Rail Clip", section: 15, install: "2020-06-07", cls: "none", maint: [] },
  { num: 4405, type: "Sleeper", section: 0, install: "2016-02-16", cls: "moderate", lastDaysAgo: 101, nextOffset: -11, maint: [m("Sleeper surface wear", 7, "Due", "Medium", 15)] },
  { num: 4349, type: "Base Plate", section: 1, install: "2024-01-10", cls: "good", lastDaysAgo: 15, nextOffset: 165, maint: [] },
  { num: 4690, type: "Fastener", section: 2, install: "2021-09-03", cls: "moderate", lastDaysAgo: 66, nextOffset: 24, maint: [] },
];

const ISSUES: Record<AssetType, string[]> = {
  Fishplate: ["Corrosion detected on fishplate", "Fishplate bolt loosening", "Fishplate crack suspected"],
  "Rail Clip": ["Clip fatigue cracking", "Rail clip displaced", "Clip corrosion"],
  "Base Plate": ["Base plate seating wear", "Base plate corrosion", "Base plate bolt replacement"],
  Sleeper: ["Sleeper surface wear", "Sleeper cracking", "Sleeper ballast loss"],
  Fastener: ["Fastener loosening", "Missing fastener", "Fastener corrosion"],
};

const TYPE_WEIGHTS: [AssetType, number][] = [
  ["Fishplate", 20], ["Rail Clip", 25], ["Base Plate", 15], ["Sleeper", 25], ["Fastener", 15],
];

function pickType(rng: Rng): AssetType {
  let r = rng.int(1, 100);
  for (const [t, w] of TYPE_WEIGHTS) {
    if ((r -= w) <= 0) return t;
  }
  return "Sleeper";
}

const INTERVAL: Record<Cls, number> = { good: 180, moderate: 90, high: 30 };

export function buildSpecs(rng: Rng, today: string, isoMinusDays: (iso: string, d: number) => string): AssetSpec[] {
  const count = (c: AssetClass) => CURATED.filter((s) => s.cls === c).length;
  const curatedDue = CURATED.flatMap((s) => s.maint).filter((x) => x.status === "Due").length;

  const nHigh = TARGETS.highRisk - count("high");
  const nMod = TARGETS.moderate - count("moderate");
  const nNone = TARGETS.total - TARGETS.inspected - count("none");
  const nGen = TARGETS.total - CURATED.length;
  const nGood = nGen - nHigh - nMod - nNone;

  const classes: AssetClass[] = [
    ...Array<AssetClass>(nHigh).fill("high"),
    ...Array<AssetClass>(nMod).fill("moderate"),
    ...Array<AssetClass>(nNone).fill("none"),
    ...Array<AssetClass>(nGood).fill("good"),
  ];
  const shuffled = rng.shuffle(classes);

  const used = new Set(CURATED.map((s) => s.num));
  let next = 3000;
  const generated: AssetSpec[] = shuffled.map((cls) => {
    while (used.has(next)) next++;
    const num = next++;
    const type = pickType(rng);
    const installDaysAgo = rng.int(400, 4200);
    const spec: AssetSpec = {
      num, type, cls, section: rng.int(0, 15), install: isoMinusDays(today, installDaysAgo), maint: [],
    };
    if (cls === "none") {
      spec.nextOffset = rng.int(-20, 45);
      return spec;
    }
    const overdue = rng.chance(0.08);
    const maxAgo = cls === "high" ? 45 : cls === "moderate" ? 110 : 170;
    spec.lastDaysAgo = overdue ? INTERVAL[cls] + rng.int(5, 90) : rng.int(2, maxAgo);
    spec.nextOffset = INTERVAL[cls] - spec.lastDaysAgo;
    return spec;
  });

  // ---- Open maintenance so the dashboard totals hit the demo targets ----
  const issue = (s: AssetSpec) => rng.pick(ISSUES[s.type]);
  const highGen = generated.filter((s) => s.cls === "high");
  const modGen = rng.shuffle(generated.filter((s) => s.cls === "moderate"));
  let due = curatedDue;

  const addOpen = (s: AssetSpec, status: MaintenanceStatus) => {
    const prio: Priority = s.cls === "high" ? rng.pick<Priority>(["High", "High", "Critical"]) : rng.pick<Priority>(["Medium", "Medium", "Low"]);
    const dueOffset = status === "Due" ? rng.int(-8, 35) : status === "Scheduled" ? rng.int(5, 40) : rng.int(-3, 12);
    s.maint.push({ issue: issue(s), daysAgo: rng.int(2, 25), status, priority: prio, dueOffset });
    if (status === "Due") due++;
  };

  highGen.forEach((s, i) => addOpen(s, i % 6 === 5 ? "Scheduled" : i % 11 === 10 ? "In Progress" : "Due"));
  let scheduled = 0;
  let inProgress = 0;
  for (const s of modGen) {
    if (due < TARGETS.maintenanceDue) addOpen(s, "Due");
    else if (scheduled < 28) { addOpen(s, "Scheduled"); scheduled++; }
    else if (inProgress < 12) { addOpen(s, "In Progress"); inProgress++; }
  }

  // ---- Completed history (feeds the maintenance trend) ----
  for (const s of generated) {
    if (s.cls === "none" || !rng.chance(0.3)) continue;
    const n = rng.chance(0.25) ? 2 : 1;
    for (let i = 0; i < n; i++) {
      s.maint.push({ issue: issue(s), daysAgo: rng.int(25, 600), status: "Completed", priority: rng.pick<Priority>(["Low", "Medium", "High"]), dueOffset: 0 });
    }
  }

  return [...CURATED, ...generated];
}
