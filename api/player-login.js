import {
  getSql,
  readJsonBody,
  sanitizeUserKey,
  sanitizeDisplayName,
} from "./lib/db.js";

export default async function handler(req, res) {
  let sql;
  try {
    sql = getSql();
  } catch (e) {
    console.error("[player-login]", e);
    return res.status(500).json({ error: "Database not configured" });
  }

  if (req.method !== "POST") {
    return res.status(405).setHeader("Allow", "POST").json({ error: "Method not allowed" });
  }

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

    await sql`
      INSERT INTO player_logins (user_key, display_name, last_seen, login_count)
      VALUES (${userKey}, ${displayName}, NOW(), 1)
      ON CONFLICT (user_key) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        last_seen = NOW(),
        login_count = player_logins.login_count + 1
    `;
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("[player-login POST]", e);
    return res.status(500).json({ error: "Database error" });
  }
}
