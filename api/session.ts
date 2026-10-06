import * as jose from "jose";
import { env } from "./lib/env";
type SessionPayload = { unionId: string; clientId: string };

const JWT_ALG = "HS256";

export async function signSessionToken(payload: SessionPayload) {
  return new jose.SignJWT(payload)
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuedAt()
    .setExpirationTime("1 year")
    .sign(new TextEncoder().encode(env.appSecret));
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jose.jwtVerify(token, new TextEncoder().encode(env.appSecret), { algorithms: [JWT_ALG] });
    if (typeof payload.unionId !== "string" || typeof payload.clientId !== "string") return null;
    return { unionId: payload.unionId, clientId: payload.clientId };
  } catch {
    return null;
  }
}
