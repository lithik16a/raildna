import "server-only";
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { SCHEMA_SQL } from "./schema";
import { seedDatabase } from "./seed";

type Db = Database.Database;

const globalForDb = globalThis as unknown as { __raildnaDb?: Db };

export function dbPath(): string {
  return path.resolve(/* turbopackIgnore: true */ process.cwd(), process.env.DATABASE_PATH ?? "data/raildna.db");
}

function open(): Db {
  const file = dbPath();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new Database(file);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(SCHEMA_SQL);
  const { n } = db.prepare("SELECT COUNT(*) AS n FROM users").get() as { n: number };
  if (n === 0) seedDatabase(db);
  return db;
}

/** Singleton connection (survives Next.js dev hot reloads). Creates and seeds the DB on first use. */
export function getDb(): Db {
  if (!globalForDb.__raildnaDb) globalForDb.__raildnaDb = open();
  return globalForDb.__raildnaDb;
}

/** Wipes all data and re-seeds demo data. Used by the "Reset demo data" action. */
export function resetDemoData(): void {
  const db = getDb();
  db.exec(
    "DELETE FROM inspection_findings; DELETE FROM inspections; DELETE FROM maintenance_records; DELETE FROM assets; DELETE FROM users;",
  );
  db.exec("DELETE FROM sqlite_sequence");
  seedDatabase(db);
}
