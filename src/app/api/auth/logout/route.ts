import { NextResponse } from "next/server";
import { handler } from "@/server/api";
import { SESSION_COOKIE } from "@/server/auth/session";

export const POST = handler(
  async () => {
    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
    return res;
  },
  { auth: false },
);
