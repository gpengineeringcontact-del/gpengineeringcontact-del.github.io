export function databaseErrorMessage(error: unknown): string {
  const candidate = typeof error === "object" && error !== null ? error : {};
  const cause = "cause" in candidate && candidate.cause && typeof candidate.cause === "object"
    ? candidate.cause
    : candidate;
  const code = "code" in cause ? String(cause.code) : "";

  if (code === "42P01") return "Die Supabase-Tabelle users fehlt.";
  if (code === "42703") return "Die Supabase-Tabelle users hat nicht das aktuelle Schema.";
  if (code === "28P01" || code === "28000") return "Die Datenbank-Anmeldung wurde von Supabase abgelehnt.";
  if (code === "ENOTFOUND" || code === "ECONNREFUSED" || code === "ETIMEDOUT") {
    return "Die Supabase-Datenbank ist von Vercel aus nicht erreichbar.";
  }
  return "Die Supabase-Datenbank konnte die Anfrage nicht verarbeiten.";
}
