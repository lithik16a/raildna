import { NextResponse } from "next/server";
import { z } from "zod";
import { findUserWithHash } from "@/database/repositories/users";
import { HttpError, handler, readJson } from "@/server/api";
import { verifyPassword } from "@/server/auth/password";
import { SESSION_COOKIE, createSessionToken, sessionCookieOptions } from "@/server/auth/session";

const schema = z.object({
  email: z.string().trim().min(1, "Email is required").max(200),
  password: z.string().min(1, "Password is required").max(200),
});

export const POST = handler(
  async (req) => {
    const { email, password } = schema.parse(await readJson(req));
    const found = findUserWithHash(email);
    // Same error for unknown user / wrong password.
    if (!found || !verifyPassword(password, found.passwordHash)) {
      throw new HttpError(401, "Invalid email or password.");
    }
    const res = NextResponse.json({ user: found.user });
    res.cookies.set(SESSION_COOKIE, createSessionToken(found.user.id), sessionCookieOptions);
    return res;
  },
  { auth: false },
);
