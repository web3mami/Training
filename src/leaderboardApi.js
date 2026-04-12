const API = "/api/leaderboard";

export async function fetchRemoteLeaderboard() {
  const r = await fetch(API, {
    headers: { Accept: "application/json" },
  });
  if (!r.ok) {
    const errText = await r.text();
    throw new Error(errText || `HTTP ${r.status}`);
  }
  return r.json();
}

export async function submitRemoteLeaderboard(entry) {
  const r = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  });
  if (!r.ok) {
    const errText = await r.text();
    throw new Error(errText || `HTTP ${r.status}`);
  }
  return r.json();
}
