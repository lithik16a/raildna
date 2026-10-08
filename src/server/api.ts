import "server-only";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import type { User } from "@/types";
import { getCurrentUser } from "./auth/session";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Wraps a route handler: enforces login, converts errors to JSON responses. */
export function handler<Ctx>(
  fn: (req: Request, user: User, ctx: Ctx) => Promise<Response>,
  opts: { auth?: boolean } = { auth: true },
) {
  return async (req: Request, ctx: Ctx): Promise<Response> => {
    try {
      const user = await getCurrentUser();
      if (opts.auth !== false && !user) throw new HttpError(401, "Please sign in to continue.");
      return await fn(req, user as User, ctx);
    } catch (err) {
      if (err instanceof HttpError) return NextResponse.json({ error: err.message }, { status: err.status });
      if (err instanceof ZodError) {
        const first = err.issues[0];
        const where = first?.path.join(".") || "input";
        return NextResponse.json({ error: `Invalid ${where}: ${first?.message ?? "bad value"}` }, { status: 400 });
      }
      console.error("[api] unhandled error", err);
      return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
    }
  };
}

export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new HttpError(400, "Request body must be valid JSON.");
  }
}
