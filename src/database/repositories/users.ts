import "server-only";
import type { User } from "@/types";
import { getDb } from "../client";

interface UserRow {
  id: number;
  email: string;
  name: string;
  role: "FIELD_ENGINEER";
  password_hash: string;
}

const toUser = (r: UserRow): User => ({ id: r.id, email: r.email, name: r.name, role: r.role });

export function findUserWithHash(email: string): { user: User; passwordHash: string } | null {
  const row = getDb().prepare("SELECT * FROM users WHERE email = ? COLLATE NOCASE").get(email) as UserRow | undefined;
  return row ? { user: toUser(row), passwordHash: row.password_hash } : null;
}

export function findUserById(id: number): User | null {
  const row = getDb().prepare("SELECT * FROM users WHERE id = ?").get(id) as UserRow | undefined;
  return row ? toUser(row) : null;
}
