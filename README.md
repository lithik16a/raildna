# RailDNA: Railway Asset Intelligence Platform (hackathon MVP)

Digital identity, digital twin and AI-assisted inspection for railway track assets.
**All data is synthetic demo data. The AI inspection engine is a simulated demo engine, not a trained vision model.**

## Run

```bash
npm install
npm run dev        # http://localhost:3000
```

Sign in with **engineer@raildna.demo / raildna-demo** (or click "Continue as Demo Field Engineer").
The SQLite database is created and seeded automatically on first request (`data/raildna.db`).
Use **Reset demo** in the sidebar to restore the original data between recordings.

Copy `.env.example` to `.env.local`. `SESSION_SECRET` is required in production.

## Demo script

1. **Dashboard**: 1,248 assets / 842 inspected / 37 high risk / 64 maintenance due.
2. **Asset Registry**: search `RDNA-TRK-4587`.
3. **Digital twin**: Fishplate, Pune, Moderate (58/100), inspection overdue.
4. **Run AI inspection** → choose the **Corroded component** demo image → **Analyze Asset**.
5. Result: Corrosion 92%, Surface Wear 87%, No Crack 96%. **78/100, High Risk**, with a point-by-point explanation.
6. **Create maintenance action** (prefilled: High priority, due in 14 days) → Create.
7. **Dashboard**: High Risk 37 → 38, Maintenance Due 64 → 65, new inspection at the top of Recent Inspections.
   The asset's inspection and maintenance history show the new records.

## Architecture

```
src/app            Next.js App Router pages + API routes
src/components     ui/ primitives, domain/ widgets, feature folders
src/services       client API wrappers (inspectionService.analyzeInspection) + pure logic (riskEngine, recommendationService)
src/server         auth, API helpers, workflows (inspection, maintenance), AI engine abstraction
src/database       SQLite client, schema, repositories (only place with SQL), deterministic seed
supabase/schema.sql  PostgreSQL equivalent of the schema
```

**Connected data flow:** `analyzeInspection()` → `POST /api/inspections` → `InspectionEngine` → `computeRisk()` → inspection + findings saved → asset condition/risk/dates updated → dashboard, registry, map, analytics and twin all read the same tables.

**Risk score** (0-100) = findings (max 55) + condition & age (max 20) + maintenance history (max 15) + inspection schedule (max 10).
0-30 Low, 31-60 Moderate, 61-100 High. Every point is stored as a named factor and shown in the UI.

**Connecting a real model:** implement `InspectionEngine` (`src/server/ai/types.ts`) returning `Finding[]`, and register it in `src/server/ai/index.ts`. Nothing else changes.

**Moving to Supabase/Postgres:** apply `supabase/schema.sql` and re-implement `src/database/repositories/*`.

## Not in the MVP (extension points only)

Laser-engraved QR, ESP32/IoT telemetry, edge AI, railway-system integrations, predictive maintenance, blockchain audit trail.

## Known limits

- Demo auth: one seeded user, no rate limiting or password reset.
- Map is a schematic SVG with demo coordinates (no map API key needed).
- Completing maintenance does not lower risk; a new inspection does.
