import { NextResponse } from "next/server";
import { resetDemoData } from "@/database/client";
import { handler } from "@/server/api";

/** Restores the seeded demo dataset so the walkthrough can be re-recorded. Demo-only. */
export const POST = handler(async () => {
  resetDemoData();
  return NextResponse.json({ ok: true });
});
