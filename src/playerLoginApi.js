const API = "/api/player-login";

export async function recordPlayerLoginOnServer(session) {
  if (!session?.key || !session.displayName) return;
  await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userKey: session.key,
      displayName: session.displayName,
    }),
  });
}
