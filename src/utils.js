const PLAYER_KEY = "training-2048-player-name";
const MAX_LEN = 24;

export function getPlayerName() {
  try {
    const v = localStorage.getItem(PLAYER_KEY);
    if (!v) return "";
    return v.trim().slice(0, MAX_LEN);
  } catch {
    return "";
  }
}

export function setPlayerName(raw) {
  const t = String(raw ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, MAX_LEN);
  try {
    if (!t) localStorage.removeItem(PLAYER_KEY);
    else localStorage.setItem(PLAYER_KEY, t);
  } catch {
    /* ignore quota / private mode */
  }
  return t;
}
