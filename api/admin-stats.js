import { getSql, readJsonBody } from "./lib/db.js";

function checkAdmin(username, password) {
  const u = process.env.ADMIN_USERNAME ?? "Mami";
  const p = process.env.ADMIN_PASSWORD ?? "Mami";
  return String(username ?? "").trim() === u && String(password ?? "") === p;
}

export default async function handler(req, res) {
  let sql;
  try {
    sql = getSql();
  } catch (e) {
    console.error("[admin-stats]", e);
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

    if (!checkAdmin(body.username, body.password)) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const playersRows = await sql`
      SELECT COUNT(*)::int AS c FROM player_logins
    `;
    const loginsRows = await sql`
      SELECT COALESCE(SUM(login_count), 0)::int AS t FROM player_logins
    `;
    const boardRows = await sql`
      SELECT COUNT(*)::int AS c FROM leaderboard
    `;

    const uniquePlayersWhoLoggedIn = playersRows[0]?.c ?? 0;
    const totalLoginEvents = loginsRows[0]?.t ?? 0;
    const playersOnLeaderboard = boardRows[0]?.c ?? 0;

    return res.status(200).json({
      uniquePlayersWhoLoggedIn,
      totalLoginEvents,
      playersOnLeaderboard,
      note: "Login counts are recorded when users sign in or register on the deployed site (server API).",
    });
  } catch (e) {
    console.error("[admin-stats POST]", e);
    return res.status(500).json({ error: "Database error" });
  }
}
