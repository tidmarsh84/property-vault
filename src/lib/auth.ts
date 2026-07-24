import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "./db";

// Simple signed-session auth for the pilot (single organisation).
// Cookie: pv_session = "<userId>.<expiresMs>.<hmac>", where the HMAC is
// HMAC-SHA256 over "<userId>.<expiresMs>" with AUTH_SECRET.

const COOKIE = "pv_session";
const SESSION_DAYS = 7;

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is not set");
  return s;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export async function login(email: string, password: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user) return false;
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return false;
  const exp = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const payload = `${user.id}.${exp}`;
  cookies().set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(exp),
  });
  return true;
}

export function logout() {
  cookies().delete(COOKIE);
}

export async function getSessionUser() {
  const raw = cookies().get(COOKIE)?.value;
  if (!raw) return null;
  const lastDot = raw.lastIndexOf(".");
  if (lastDot < 0) return null;
  const payload = raw.slice(0, lastDot);
  const sig = raw.slice(lastDot + 1);
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const [userId, expStr] = payload.split(".");
  if (Number(expStr) < Date.now()) return null;
  return prisma.user.findUnique({
    where: { id: userId },
    include: { organisation: true },
  });
}

/** For protected pages/actions: returns the user or redirects to login. */
export async function requireUser() {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  return user;
}
