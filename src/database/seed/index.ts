import type Database from "better-sqlite3";
import type { Finding, InspectionType } from "@/types";
import { buildRecommendation } from "@/services/recommendationService";
import { hashPassword } from "@/server/auth/password";
import { addDays, todayIso } from "@/utils/dates";
import { conditionFromScore } from "@/utils/format";
import { Rng } from "./rng";
import { SECTIONS } from "./sections";
import { buildSpecs, ENGINEERS, type AssetSpec } from "./specs";
import { synthAssessment, type Cls } from "./synth";

export const DEMO_USER = { email: "engineer@raildna.demo", password: "raildna-demo", name: "Demo Engineer" };

const iso = (date: string, hour = 9) => `${date}T${String(hour).padStart(2, "0")}:00:00.000Z`;

function coordinates(spec: AssetSpec, rng: Rng): { lat: number; lng: number } {
  const s = SECTIONS[spec.section];
  const h = (s.heading * Math.PI) / 180;
  const t = rng.float(-0.45, 0.45); // along the corridor (degrees)
  const j = rng.float(-0.02, 0.02); // across
  return {
    lat: Math.round((s.lat + t * Math.cos(h) - j * Math.sin(h)) * 1e5) / 1e5,
    lng: Math.round((s.lng + t * Math.sin(h) + j * Math.cos(h)) * 1e5) / 1e5,
  };
}

function earlierClass(latest: Cls, rng: Rng): Cls {
  const r = rng.next();
  if (latest === "good") return r < 0.85 ? "good" : "moderate";
  if (latest === "moderate") return r < 0.5 ? "good" : "moderate";
  return r < 0.6 ? "moderate" : r < 0.8 ? "good" : "high";
}

function inspectionType(rng: Rng, latestHigh: boolean): InspectionType {
  const r = rng.next();
  if (latestHigh) return r < 0.5 ? "AI Inspection" : "Routine Inspection";
  return r < 0.65 ? "Routine Inspection" : r < 0.8 ? "Maintenance Inspection" : "AI Inspection";
}

export function seedDatabase(db: Database.Database): void {
  const today = todayIso();
  const rng = new Rng(20260407);
  const specs = buildSpecs(rng, today, (d, n) => addDays(d, -n));

  const insUser = db.prepare("INSERT INTO users (email, name, role, password_hash, created_at) VALUES (?, ?, 'FIELD_ENGINEER', ?, ?)");
  const insAsset = db.prepare(
    `INSERT INTO assets (asset_id, asset_type, location, latitude, longitude, installation_date, condition, risk_score, status, last_inspection, next_inspection, created_at)
     VALUES (@asset_id, @asset_type, @location, @latitude, @longitude, @installation_date, @condition, @risk_score, @status, @last_inspection, @next_inspection, @created_at)`,
  );
  const insInspection = db.prepare(
    `INSERT INTO inspections (asset_id, inspection_date, inspection_type, inspector, image_url, condition, risk_score, findings, recommendation, risk_factors, engine, created_at)
     VALUES (?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const insFinding = db.prepare("INSERT INTO inspection_findings (inspection_id, finding_type, label, detected, confidence) VALUES (?, ?, ?, ?, ?)");
  const insMaint = db.prepare(
    `INSERT INTO maintenance_records (asset_id, issue, priority, assigned_to, status, due_date, notes, created_at, completed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );

  const run = db.transaction(() => {
    insUser.run(DEMO_USER.email, DEMO_USER.name, hashPassword(DEMO_USER.password), iso(today));

    for (const spec of specs) {
      const assetId = `RDNA-TRK-${spec.num}`;
      const { lat, lng } = coordinates(spec, rng);
      const inProgress = spec.maint.some((x) => x.status === "In Progress");

      let condition: string | null = null;
      let riskScore: number | null = null;
      let lastInspection: string | null = null;
      const pendingInspections: { date: string; type: InspectionType; cls: Cls; inspector: string; latest: boolean }[] = [];

      if (spec.cls !== "none") {
        const lastAgo = spec.lastDaysAgo ?? 30;
        lastInspection = addDays(today, -lastAgo);
        pendingInspections.push({
          date: lastInspection,
          type: spec.history ? "Routine Inspection" : inspectionType(rng, spec.cls === "high"),
          cls: spec.cls,
          inspector: ENGINEERS[0],
          latest: true,
        });
        if (spec.history) {
          for (const h of spec.history) {
            pendingInspections.push({ date: addDays(today, -h.daysAgo), type: h.type, cls: h.cls, inspector: ENGINEERS[0], latest: false });
          }
        } else {
          let ago = lastAgo;
          let cls = spec.cls;
          const extra = rng.pick([0, 1, 1, 2]);
          for (let i = 0; i < extra; i++) {
            ago += rng.int(70, 170);
            cls = earlierClass(cls, rng);
            pendingInspections.push({
              date: addDays(today, -ago), type: inspectionType(rng, false), cls,
              inspector: rng.chance(0.6) ? ENGINEERS[0] : rng.pick(ENGINEERS), latest: false,
            });
          }
        }
      }

      // Determine the latest assessment first so the asset row matches its newest inspection.
      type Built = { date: string; type: InspectionType; inspector: string; latest: boolean; findings: Finding[]; score: number; factors: string; recText: string };
      const built: Built[] = pendingInspections.map((p) => {
        const { assessment, findings } = synthAssessment(p.cls, rng);
        const rec = buildRecommendation(assessment, findings, p.date);
        return { date: p.date, type: p.type, inspector: p.inspector, latest: p.latest, findings, score: assessment.score, factors: JSON.stringify(assessment.factors), recText: rec.text };
      });
      const latest = built.find((b) => b.latest);
      if (latest) {
        riskScore = latest.score;
        condition = conditionFromScore(latest.score);
      }

      insAsset.run({
        asset_id: assetId,
        asset_type: spec.type,
        location: SECTIONS[spec.section].name,
        latitude: lat,
        longitude: lng,
        installation_date: spec.install,
        condition,
        risk_score: riskScore,
        status: inProgress ? "Under Maintenance" : "Active",
        last_inspection: lastInspection,
        next_inspection: spec.nextOffset !== undefined ? addDays(today, spec.nextOffset) : null,
        created_at: iso(addDays(today, -rng.int(200, 900))),
      });

      for (const b of built) {
        const summary = b.findings.filter((x) => x.detected).map((x) => x.label).join("; ") || "No defects detected";
        const res = insInspection.run(
          assetId, b.date, b.type, b.inspector, conditionFromScore(b.score), b.score, summary, b.recText, b.factors,
          b.type === "AI Inspection" ? "RailDNA Demo Inspection Engine 0.1-demo" : null, iso(b.date),
        );
        for (const f of b.findings) insFinding.run(res.lastInsertRowid, f.type, f.label, f.detected ? 1 : 0, f.confidence);
      }

      for (const mnt of spec.maint) {
        const created = addDays(today, -mnt.daysAgo);
        const completed = mnt.status === "Completed";
        const dueDate = completed ? addDays(created, 14) : addDays(today, mnt.dueOffset);
        insMaint.run(
          assetId, mnt.issue, mnt.priority, mnt.assignedTo ?? (rng.chance(0.5) ? ENGINEERS[0] : rng.pick(ENGINEERS)),
          mnt.status, dueDate, completed ? "Work completed and verified on site." : "", iso(created),
          completed ? iso(addDays(created, rng.int(3, 14)), 16) : null,
        );
      }
    }
  });

  run();
}
