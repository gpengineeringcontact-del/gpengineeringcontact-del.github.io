import * as cookie from "cookie";
import { Errors } from "@contracts/errors";
import { Session } from "@contracts/constants";
import { findUserByUnionId } from "./queries/users";
import { verifySessionToken } from "./session";

export async function authenticateRequest(headers: Headers) {
  const token = cookie.parse(headers.get("cookie") || "")[Session.cookieName];
  const claim = token ? await verifySessionToken(token) : null;
  if (!claim) throw Errors.forbidden("Invalid authentication token.");
  const user = await findUserByUnionId(claim.unionId);
  if (!user) throw Errors.forbidden("User not found. Please log in again.");
  return user;
}
