const ACCOUNTS_KEY = "training-2048-accounts-v1";
const SESSION_KEY = "training-2048-session-v1";
const LEADER_KEY = "training-2048-leaderboard-v1";

function randomSalt() {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return arr;
}

function toB64(arr) {
  return btoa(String.fromCharCode(...arr));
}

function fromB64(s) {
  const bin = atob(s);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

async function pbkdf2Hash(password, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: 120_000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );
  return toB64(new Uint8Array(bits));
}

export function normalizeUsername(username) {
  return username.trim().toLowerCase();
}

export function validateUsername(username) {
  const u = normalizeUsername(username);
  if (u.length < 3 || u.length > 18) {
    return { ok: false, error: "Username must be 3–18 characters." };
  }
  if (!/^[a-z0-9_]+$/.test(u)) {
    return {
      ok: false,
      error: "Username: lowercase letters, numbers, underscore only.",
    };
  }
  return { ok: true, value: u };
}

export function validatePassword(password) {
  if (password.length < 6) {
    return { ok: false, error: "Password must be at least 6 characters." };
  }
  if (password.length > 128) {
    return { ok: false, error: "Password is too long." };
  }
  return { ok: true };
}

function loadAccounts() {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (!raw) return {};
    const o = JSON.parse(raw);
    return typeof o === "object" && o !== null ? o : {};
  } catch {
    return {};
  }
}

function saveAccounts(acc) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(acc));
}

export async function registerAccount(displayUsername, password) {
  const vu = validateUsername(displayUsername);
  if (!vu.ok) throw new Error(vu.error);
  const vp = validatePassword(password);
  if (!vp.ok) throw new Error(vp.error);
  const accounts = loadAccounts();
  if (accounts[vu.value]) throw new Error("That username is already taken.");
  const salt = randomSalt();
  const saltB64 = toB64(salt);
  const hash = await pbkdf2Hash(password, salt);
  accounts[vu.value] = {
    displayName: displayUsername.trim().slice(0, 24) || vu.value,
    saltB64,
    hash,
    createdAt: Date.now(),
  };
  saveAccounts(accounts);
  return { key: vu.value, displayName: accounts[vu.value].displayName };
}

export async function loginAccount(username, password) {
  const vu = validateUsername(username);
  if (!vu.ok) throw new Error(vu.error);
  const vp = validatePassword(password);
  if (!vp.ok) throw new Error(vp.error);
  const accounts = loadAccounts();
  const acc = accounts[vu.value];
  if (!acc) throw new Error("Wrong username or password.");
  const salt = fromB64(acc.saltB64);
  const hash = await pbkdf2Hash(password, salt);
  if (hash !== acc.hash) throw new Error("Wrong username or password.");
  return { key: vu.value, displayName: acc.displayName };
}

export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || typeof s.key !== "string" || typeof s.displayName !== "string") {
      return null;
    }
    const accounts = loadAccounts();
    if (!accounts[s.key]) {
      clearSession();
      return null;
    }
    return s;
  } catch {
    return null;
  }
}

export function setSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function logoutAccount() {
  clearSession();
}

function loadLeaderboard() {
  try {
    const raw = localStorage.getItem(LEADER_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveLeaderboard(rows) {
  localStorage.setItem(LEADER_KEY, JSON.stringify(rows.slice(0, 50)));
}

export function recordLeaderboardEntry(userKey, displayName, stats) {
  const { level, peakTile, score } = stats;
  const rows = loadLeaderboard();
  const i = rows.findIndex((r) => r.userKey === userKey);
  const nextRow = {
    userKey,
    displayName,
    level,
    peakTile,
    score,
    updatedAt: Date.now(),
  };
  if (i === -1) {
    rows.push(nextRow);
  } else {
    const cur = rows[i];
    rows[i] = {
      ...cur,
      displayName,
      level: Math.max(cur.level, level),
      peakTile: Math.max(cur.peakTile, peakTile),
      score: Math.max(cur.score, score),
      updatedAt: Date.now(),
    };
  }
  rows.sort(
    (a, b) =>
      b.level - a.level ||
      b.peakTile - a.peakTile ||
      b.score - a.score ||
      b.updatedAt - a.updatedAt
  );
  saveLeaderboard(rows);
}

export function getLeaderboardRows() {
  return loadLeaderboard();
}

export function bestScoreStorageKey(userKey) {
  return `training-2048-best-${userKey}`;
}
