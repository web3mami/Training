import { neon } from "@neondatabase/serverless";

const connectionString =
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.DATABASE_URL;

export function getSql() {
  if (!connectionString) {
    throw new Error("Missing POSTGRES_URL (or DATABASE_URL) for Neon");
  }
  return neon(connectionString);
}

export function readJsonBody(req) {
  try {
    const b = req.body;
    if (b == null) return {};
    if (typeof b === "string") return JSON.parse(b || "{}");
    if (typeof b === "object") return b;
  } catch {
    throw new SyntaxError("Invalid JSON");
  }
  return {};
}

export function sanitizeUserKey(s) {
  const t = String(s ?? "")
    .trim()
    .toLowerCase();
  if (!/^[a-z0-9_]{3,18}$/.test(t)) return null;
  return t;
}

export function sanitizeDisplayName(s) {
  return String(s ?? "")
    .trim()
    .slice(0, 24) || "Player";
}
