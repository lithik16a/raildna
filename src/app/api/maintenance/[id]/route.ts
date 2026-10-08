import { NextResponse } from "next/server";
import { z } from "zod";
import { HttpError, handler, readJson } from "@/server/api";
import { changeMaintenanceStatus } from "@/server/workflows/maintenance";
import { MAINTENANCE_STATUSES } from "@/types";

const schema = z.object({ status: z.enum(MAINTENANCE_STATUSES) });

export const PATCH = handler(async (req, _user, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) throw new HttpError(400, "Invalid maintenance id.");
  const { status } = schema.parse(await readJson(req));
  const record = changeMaintenanceStatus(numericId, status);
  return NextResponse.json({ record });
});
