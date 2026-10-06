import * as cookie from "cookie";
import { Errors } from "../contracts/errors.js";
import { Session } from "../contracts/constants.js";
import { findUserByUnionId } from "./queries/users.js";
import { verifySessionToken } from "./session.js";

export async function authenticateRequest(headers: Headers) {
  const token = cookie.parse(headers.get("cookie") || "")[Session.cookieName];
  const claim = token ? await verifySessionToken(token) : null;
  if (!claim) throw Errors.forbidden("Invalid authentication token.");
  const user = await findUserByUnionId(claim.unionId);
  if (!user) throw Errors.forbidden("User not found. Please log in again.");
  return user;
}
