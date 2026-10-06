import * as cookie from "cookie";
import { randomBytes, scrypt as nodeScrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { z } from "zod";
import { Session } from "@contracts/constants";
import { getSessionCookieOptions } from "./lib/cookies";
import { createRouter, authedQuery, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";
import { signSessionToken } from "./session";

const scrypt = promisify(nodeScrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

async function verifyPassword(password: string, stored: string) {
  const [salt, key] = stored.split(":");
  if (!salt || !key) return false;
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  const expected = Buffer.from(key, "hex");
  return expected.length === derived.length && timingSafeEqual(expected, derived);
}

async function setSession(ctx: { resHeaders: Headers }, email: string) {
  const token = await signSessionToken({ unionId: `email:${email}`, clientId: "wyfare" });
  const opts = getSessionCookieOptions(new Headers());
  ctx.resHeaders.append("set-cookie", cookie.serialize(Session.cookieName, token, {
    httpOnly: true, path: opts.path, sameSite: "lax", secure: opts.secure,
    maxAge: Session.maxAgeMs / 1000,
  }));
}

export const authRouter = createRouter({
  register: publicQuery.input(z.object({
    name: z.string().min(2).max(255),
    email: z.string().email().max(320),
    password: z.string().min(8).max(128),
    plan: z.enum(["free", "premium"]).default("free"),
  })).mutation(async ({ input, ctx }) => {
    const db = getDb();
    const existing = await db.query.users.findFirst({ where: eq(users.email, input.email.toLowerCase()) });
    if (existing) throw new Error("Für diese E-Mail-Adresse gibt es bereits ein Konto.");
    await db.insert(users).values({
      unionId: `email:${input.email.toLowerCase()}`,
      name: input.name.trim(),
      email: input.email.toLowerCase(),
      passwordHash: await hashPassword(input.password),
      membershipPlan: input.plan,
      lastSignInAt: new Date(),
    });
    await setSession(ctx, input.email.toLowerCase());
    return { success: true };
  }),
  login: publicQuery.input(z.object({
    email: z.string().email().max(320),
    password: z.string().min(1).max(128),
  })).mutation(async ({ input, ctx }) => {
    const db = getDb();
    const user = await db.query.users.findFirst({ where: eq(users.email, input.email.toLowerCase()) });
    if (!user?.passwordHash || !(await verifyPassword(input.password, user.passwordHash))) {
      throw new Error("E-Mail oder Passwort stimmt nicht.");
    }
    await db.update(users).set({ lastSignInAt: new Date() }).where(eq(users.id, user.id));
    await setSession(ctx, input.email.toLowerCase());
    return { success: true };
  }),
  me: authedQuery.query((opts) => opts.ctx.user),
  logout: authedQuery.mutation(async ({ ctx }) => {
    const opts = getSessionCookieOptions(ctx.req.headers);
    ctx.resHeaders.append(
      "set-cookie",
      cookie.serialize(Session.cookieName, "", {
        httpOnly: opts.httpOnly,
        path: opts.path,
        sameSite: opts.sameSite?.toLowerCase() as "lax" | "none",
        secure: opts.secure,
        maxAge: 0,
      }),
    );
    return { success: true };
  }),
});
