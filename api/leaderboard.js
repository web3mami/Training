import { neon } from "@neondatabase/serverless";

const connectionString =
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.DATABASE_URL;

function getSql() {
  if (!connectionString) {
    throw new Error("Missing POSTGRES_URL (or DATABASE_URL) for Neon");
  }
  return neon(connectionString);
}

function readJsonBody(req) {
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

function sanitizeUserKey(s) {
  const t = String(s ?? "")
    .trim()
    .toLowerCase();
  if (!/^[a-z0-9_]{3,18}$/.test(t)) return null;
  return t;
}

function sanitizeDisplayName(s) {
  return String(s ?? "")
    .trim()
    .slice(0, 24) || "Player";
}

function sanitizeInt(n, max = 1_000_000_000) {
  const x = Number(n);
  if (!Number.isFinite(x) || x < 0) return 0;
  return Math.min(Math.floor(x), max);
}

export default async function handler(req, res) {
  let sql;
  try {
    sql = getSql();
  } catch (e) {
    console.error("[leaderboard]", e);
    return res.status(500).json({ error: "Database not configured" });
  }

  if (req.method === "GET") {
    try {
      const rows = await sql`
        SELECT user_key, display_name, level, peak_tile, score, updated_at
        FROM leaderboard
        ORDER BY level DESC, peak_tile DESC, score DESC, updated_at DESC
        LIMIT 50
      `;
      const mapped = rows.map((r) => ({
        userKey: r.user_key,
        displayName: r.display_name,
        level: r.level,
        peakTile: r.peak_tile,
        score: r.score,
        updatedAt: new Date(r.updated_at).getTime(),
      }));
      return res.status(200).json(mapped);
    } catch (e) {
      console.error("[leaderboard GET]", e);
      return res.status(500).json({ error: "Database error" });
    }
  }

  if (req.method === "POST") {
    try {
      let body;
      try {
        body = readJsonBody(req);
      } catch {
        return res.status(400).json({ error: "Invalid JSON" });
      }
      const userKey = sanitizeUserKey(body.userKey);
      if (!userKey) {
        return res.status(400).json({ error: "Invalid userKey" });
      }
      const displayName = sanitizeDisplayName(body.displayName);
      const level = sanitizeInt(body.level, 99);
      const peakTile = sanitizeInt(body.peakTile, 1_000_000);
      const score = sanitizeInt(body.score);

      await sql`
        INSERT INTO leaderboard (user_key, display_name, level, peak_tile, score, updated_at)
        VALUES (${userKey}, ${displayName}, ${level}, ${peakTile}, ${score}, NOW())
        ON CONFLICT (user_key) DO UPDATE SET
          display_name = EXCLUDED.display_name,
          level = GREATEST(leaderboard.level, EXCLUDED.level),
          peak_tile = GREATEST(leaderboard.peak_tile, EXCLUDED.peak_tile),
          score = GREATEST(leaderboard.score, EXCLUDED.score),
          updated_at = NOW()
      `;
      return res.status(200).json({ ok: true });
    } catch (e) {
      console.error("[leaderboard POST]", e);
      return res.status(500).json({ error: "Database error" });
    }
  }

  return res
    .status(405)
    .setHeader("Allow", "GET, POST")
    .json({ error: "Method not allowed" });
}
