import { NextResponse } from "next/server";
import { z } from "zod";
import { HttpError, handler, readJson } from "@/server/api";
import { createMaintenanceAction } from "@/server/workflows/maintenance";
import { PRIORITIES } from "@/types";
import { todayIso } from "@/utils/dates";

const createMaintenanceSchema = z.object({
  assetId: z.string().regex(/^RDNA-TRK-\d{3,6}$/, "must look like RDNA-TRK-4587"),
  issue: z.string().trim().min(3, "Describe the issue (3+ characters)").max(200),
  priority: z.enum(PRIORITIES),
  assignedTo: z.string().trim().min(2, "Assign an engineer").max(80),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "must be a date"),
  notes: z.string().trim().max(1000).default(""),
});

export const POST = handler(async (req) => {
  const input = createMaintenanceSchema.parse(await readJson(req));
  if (Number.isNaN(Date.parse(input.dueDate))) throw new HttpError(400, "Invalid dueDate: not a real date.");
  if (input.dueDate < todayIso()) throw new HttpError(400, "Invalid dueDate: must be today or later.");
  const record = createMaintenanceAction(input);
  return NextResponse.json({ record }, { status: 201 });
});
