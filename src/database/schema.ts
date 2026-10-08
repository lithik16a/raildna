// SQLite schema. Column names and relationships mirror supabase/schema.sql (PostgreSQL) 1:1,
// so moving to Supabase only requires re-implementing the repositories in ./repositories.

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'FIELD_ENGINEER',
  password_hash TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS assets (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_id          TEXT NOT NULL UNIQUE,
  asset_type        TEXT NOT NULL CHECK (asset_type IN ('Fishplate','Rail Clip','Base Plate','Sleeper','Fastener')),
  location          TEXT NOT NULL,
  latitude          REAL NOT NULL,
  longitude         REAL NOT NULL,
  installation_date TEXT NOT NULL,
  condition         TEXT CHECK (condition IN ('Good','Moderate','High Risk')),
  risk_score        INTEGER CHECK (risk_score BETWEEN 0 AND 100),
  status            TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active','Under Maintenance')),
  last_inspection   TEXT,
  next_inspection   TEXT,
  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_assets_condition ON assets(condition);
CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(asset_type);

CREATE TABLE IF NOT EXISTS inspections (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_id        TEXT NOT NULL REFERENCES assets(asset_id) ON DELETE CASCADE,
  inspection_date TEXT NOT NULL,
  inspection_type TEXT NOT NULL,
  inspector       TEXT NOT NULL,
  image_url       TEXT,
  condition       TEXT NOT NULL CHECK (condition IN ('Good','Moderate','High Risk')),
  risk_score      INTEGER NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
  findings        TEXT NOT NULL DEFAULT '',
  recommendation  TEXT NOT NULL DEFAULT '',
  risk_factors    TEXT NOT NULL DEFAULT '[]',
  engine          TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_inspections_asset ON inspections(asset_id, inspection_date);
CREATE INDEX IF NOT EXISTS idx_inspections_date ON inspections(inspection_date);

CREATE TABLE IF NOT EXISTS inspection_findings (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  inspection_id INTEGER NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  finding_type  TEXT NOT NULL,
  label         TEXT NOT NULL,
  detected      INTEGER NOT NULL CHECK (detected IN (0,1)),
  confidence    REAL NOT NULL CHECK (confidence BETWEEN 0 AND 1)
);
CREATE INDEX IF NOT EXISTS idx_findings_inspection ON inspection_findings(inspection_id);

CREATE TABLE IF NOT EXISTS maintenance_records (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_id     TEXT NOT NULL REFERENCES assets(asset_id) ON DELETE CASCADE,
  issue        TEXT NOT NULL,
  priority     TEXT NOT NULL CHECK (priority IN ('Low','Medium','High','Critical')),
  assigned_to  TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'Due' CHECK (status IN ('Due','Scheduled','In Progress','Completed')),
  due_date     TEXT NOT NULL,
  notes        TEXT NOT NULL DEFAULT '',
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_maint_asset ON maintenance_records(asset_id, status);
CREATE INDEX IF NOT EXISTS idx_maint_status ON maintenance_records(status);
`;
