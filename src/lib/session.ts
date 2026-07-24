// Simple session auth: HMAC-signed cookie, bcrypt-checked credentials.
// (Chosen over NextAuth as the "equally simple session approach" the plan allows —
// no third-party identity providers, one fewer dependency; see DECISIONS.md.)

import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "./db";
import type { Role } from "./types";

const COOKIE = "pv_session";
const MAX_AGE_S = 60 * 60 * 12; // 12 hours

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET is not set");
  return s;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export interface SessionUser {
  id: string;
  email: string;
  role: Role;
  organisationId: string;
}

export async function login(email: string, password: string): Promise<SessionUser | null> {
  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_S;
  const payload = Buffer.from(JSON.stringify({ uid: user.id, exp })).toString("base64url");
  const value = `${payload}.${sign(payload)}`;
  (await cookies()).set(COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE_S,
    path: "/",
  });
  return { id: user.id, email: user.email, role: user.role as Role, organisationId: user.organisationId };
}

export async function logout(): Promise<void> {
  (await cookies()).delete(COOKIE);
}

export async function currentUser(): Promise<SessionUser | null> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  const dot = raw.lastIndexOf(".");
  if (dot < 0) return null;
  const payload = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  let parsed: { uid: string; exp: number };
  try {
    parsed = JSON.parse(Buffer.from(payload, "base64url").toString());
  } catch {
    return null;
  }
  if (parsed.exp * 1000 < Date.now()) return null;
  const user = await prisma.user.findUnique({ where: { id: parsed.uid } });
  if (!user) return null;
  return { id: user.id, email: user.email, role: user.role as Role, organisationId: user.organisationId };
}

/** For admin pages/actions: redirect to /login when unauthenticated. */
export async function requireUser(): Promise<SessionUser> {
  const user = await currentUser();
  if (!user) redirect("/login");
  return user;
}
