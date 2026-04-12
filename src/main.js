import {
  registerAccount,
  loginAccount,
  getSession,
  setSession,
  logoutAccount,
  recordLeaderboardEntry,
  getLeaderboardRows,
  bestScoreStorageKey,
} from "./auth.js";
import {
  newGameState,
  applyMove,
  continueAfterWin,
  maxTileInGrid,
} from "./game.js";
import {
  MILESTONES,
  levelFromMaxTile,
  goalProgress,
} from "./progression.js";
import "./style.css";

const app = document.querySelector("#app");

app.innerHTML = `
  <div class="app-root">
    <section id="auth-view" class="auth-view" aria-label="Sign in">
      <div class="auth-card anime-edition">
        <div class="sparkle-field" aria-hidden="true"></div>
        <div class="auth-inner">
          <h1 class="auth-title"><span class="title-text">2048</span></h1>
          <p class="auth-sub">Sign in or create an account (saved in this browser).</p>

          <div class="auth-tabs" role="tablist">
            <button type="button" class="auth-tab is-active" id="tab-login" role="tab" aria-selected="true">Sign in</button>
            <button type="button" class="auth-tab" id="tab-register" role="tab" aria-selected="false">Register</button>
          </div>

          <p class="auth-error hidden" id="auth-error" role="alert"></p>

          <form class="auth-form" id="auth-form" autocomplete="on">
            <label class="auth-label" for="auth-user">Username</label>
            <input
              class="auth-input"
              id="auth-user"
              name="username"
              type="text"
              autocomplete="username"
              maxlength="18"
              required
            />
            <label class="auth-label" for="auth-pass">Password</label>
            <input
              class="auth-input"
              id="auth-pass"
              name="password"
              type="password"
              autocomplete="current-password"
              maxlength="128"
              required
            />
            <div class="auth-field hidden" id="auth-pass2-wrap">
              <label class="auth-label" for="auth-pass2">Confirm password</label>
              <input
                class="auth-input"
                id="auth-pass2"
                name="password2"
                type="password"
                autocomplete="new-password"
                maxlength="128"
              />
            </div>
            <button type="submit" class="btn auth-submit" id="auth-submit">Continue</button>
          </form>
          <p class="auth-hint">
            Usernames must be unique on this device. Rankings and “stay logged in” use browser storage (cache) — no server.
          </p>
        </div>
      </div>
    </section>

    <section id="game-view" class="game-view hidden" aria-label="Game">
      <main class="game-shell anime-edition">
        <div class="sparkle-field" aria-hidden="true"></div>
        <header class="game-header">
          <div class="title-block">
            <p class="edition-badge" lang="en">Anime edition</p>
            <h1 class="game-title"><span class="title-text">2048</span></h1>
            <p class="love-note" lang="en">Hi Milla, I love you.</p>
            <div class="session-bar">
              <span class="session-user" id="session-display"></span>
              <div class="session-actions">
                <button type="button" class="btn-text" id="btn-rankings">Rankings</button>
                <button type="button" class="btn-text btn-text-danger" id="btn-logout">Log out</button>
              </div>
            </div>
          </div>
          <div class="score-row">
            <div class="score-box">
              <span class="score-label">Score</span>
              <span class="score-value" id="score">0</span>
            </div>
            <div class="score-box">
              <span class="score-label">Best</span>
              <span class="score-value" id="best">0</span>
            </div>
          </div>
        </header>

        <section class="progress-panel" aria-label="Run stats">
          <div class="meta-row">
            <div class="meta-pill">
              <span class="meta-label">Time</span>
              <span class="meta-value mono" id="timer">0:00</span>
            </div>
            <div class="meta-pill">
              <span class="meta-label">Level</span>
              <span class="meta-value" id="level-val">1</span>
            </div>
            <div class="meta-pill">
              <span class="meta-label">Peak</span>
              <span class="meta-value" id="peak-tile">2</span>
            </div>
          </div>
          <div class="goal-track">
            <div class="goal-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" id="goal-bar">
              <div class="goal-bar-fill" id="goal-bar-fill"></div>
            </div>
            <p class="goal-label" id="goal-label">Next goal: tile 4</p>
          </div>
        </section>

        <p class="subtext" id="subtext"></p>

        <div class="toolbar">
          <button type="button" class="btn btn-new" id="new-game">New game</button>
        </div>

        <div
          class="board"
          id="board"
          tabindex="0"
          role="application"
          aria-label="2048 puzzle. Use arrow keys or swipe to slide tiles."
        ></div>

        <p class="help">
          Arrow keys or swipe — fuse your tiles and awaken <strong>2048</strong>!
        </p>

        <div class="toast hidden" id="toast" role="status" aria-live="polite">
          <p class="toast-title" id="toast-title"></p>
          <p class="toast-body" id="toast-body"></p>
        </div>

        <div class="overlay hidden" id="overlay" aria-hidden="true">
          <div class="overlay-card">
            <p class="overlay-title" id="overlay-title"></p>
            <p class="overlay-msg" id="overlay-msg"></p>
            <div class="overlay-actions">
              <button type="button" class="btn" id="overlay-primary"></button>
              <button type="button" class="btn btn-ghost hidden" id="overlay-secondary"></button>
            </div>
          </div>
        </div>

        <div class="overlay hidden" id="rank-overlay" aria-hidden="true">
          <div class="overlay-card rank-card">
            <p class="overlay-title">Level rankings</p>
            <p class="rank-sub">Sorted by level, then peak tile, then best score (this browser).</p>
            <div class="rank-table-wrap">
              <table class="rank-table" id="rank-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Player</th>
                    <th>Level</th>
                    <th>Peak</th>
                    <th>Best score</th>
                  </tr>
                </thead>
                <tbody id="rank-tbody"></tbody>
              </table>
            </div>
            <button type="button" class="btn" id="rank-close">Close</button>
          </div>
        </div>
      </main>
    </section>
  </div>
`;

const authView = document.getElementById("auth-view");
const gameView = document.getElementById("game-view");
const tabLogin = document.getElementById("tab-login");
const tabRegister = document.getElementById("tab-register");
const authForm = document.getElementById("auth-form");
const authError = document.getElementById("auth-error");
const authPass2Wrap = document.getElementById("auth-pass2-wrap");
const authSubmit = document.getElementById("auth-submit");
const sessionDisplayEl = document.getElementById("session-display");
const btnRankings = document.getElementById("btn-rankings");
const btnLogout = document.getElementById("btn-logout");
const rankOverlay = document.getElementById("rank-overlay");
const rankTbody = document.getElementById("rank-tbody");
const rankClose = document.getElementById("rank-close");

const boardEl = document.getElementById("board");
const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
const subtextEl = document.getElementById("subtext");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlay-title");
const overlayMsg = document.getElementById("overlay-msg");
const overlayPrimary = document.getElementById("overlay-primary");
const overlaySecondary = document.getElementById("overlay-secondary");
const toastEl = document.getElementById("toast");
const toastTitleEl = document.getElementById("toast-title");
const toastBodyEl = document.getElementById("toast-body");
const goalBarEl = document.getElementById("goal-bar");

let authMode = "login";

function setAuthMode(mode) {
  authMode = mode;
  const isReg = mode === "register";
  tabLogin.classList.toggle("is-active", !isReg);
  tabRegister.classList.toggle("is-active", isReg);
  tabLogin.setAttribute("aria-selected", String(!isReg));
  tabRegister.setAttribute("aria-selected", String(isReg));
  authPass2Wrap.classList.toggle("hidden", !isReg);
  authSubmit.textContent = isReg ? "Create account" : "Sign in";
  document.getElementById("auth-pass").autocomplete = isReg
    ? "new-password"
    : "current-password";
  authError.classList.add("hidden");
}

tabLogin.addEventListener("click", () => setAuthMode("login"));
tabRegister.addEventListener("click", () => setAuthMode("register"));

function showAuthError(msg) {
  authError.textContent = msg;
  authError.classList.remove("hidden");
}

authForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  authError.classList.add("hidden");
  const user = document.getElementById("auth-user").value;
  const pass = document.getElementById("auth-pass").value;
  const pass2 = document.getElementById("auth-pass2").value;
  authSubmit.disabled = true;
  try {
    if (authMode === "register") {
      if (pass !== pass2) {
        showAuthError("Passwords do not match.");
        return;
      }
      const s = await registerAccount(user, pass);
      setSession(s);
    } else {
      const s = await loginAccount(user, pass);
      setSession(s);
    }
    enterGame();
  } catch (err) {
    showAuthError(err instanceof Error ? err.message : "Something went wrong.");
  } finally {
    authSubmit.disabled = false;
  }
});

function syncSessionBar() {
  const s = getSession();
  sessionDisplayEl.textContent = s ? `Playing as ${s.displayName}` : "";
}

function renderRankings() {
  const rows = getLeaderboardRows();
  rankTbody.innerHTML = "";
  if (!rows.length) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 5;
    td.className = "rank-empty";
    td.textContent = "No runs recorded yet. Finish a game to appear here.";
    tr.appendChild(td);
    rankTbody.appendChild(tr);
    return;
  }
  rows.forEach((r, i) => {
    const tr = document.createElement("tr");
    if (getSession()?.key === r.userKey) tr.classList.add("rank-you");
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${escapeHtml(r.displayName)}</td>
      <td>${r.level}</td>
      <td>${r.peakTile}</td>
      <td>${r.score}</td>
    `;
    rankTbody.appendChild(tr);
  });
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

btnRankings.addEventListener("click", () => {
  renderRankings();
  rankOverlay.classList.remove("hidden");
  rankOverlay.setAttribute("aria-hidden", "false");
});

rankClose.addEventListener("click", () => {
  rankOverlay.classList.add("hidden");
  rankOverlay.setAttribute("aria-hidden", "true");
  boardEl.focus();
});

btnLogout.addEventListener("click", () => {
  logoutAccount();
  leaveGame();
});

function loadBest() {
  const s = getSession();
  if (!s) return 0;
  const n = Number(localStorage.getItem(bestScoreStorageKey(s.key)) || "0");
  return Number.isFinite(n) ? n : 0;
}

function saveBest(score) {
  const s = getSession();
  if (!s) return;
  const key = bestScoreStorageKey(s.key);
  const prev = Number(localStorage.getItem(key) || "0");
  if (score > prev) localStorage.setItem(key, String(score));
}

let state = newGameState();
let best = 0;
let sessionStart = null;
let sessionFrozenMs = null;
const milestoneSeen = new Set();
let toastHideId = 0;
let gameBooted = false;

function pad2(n) {
  return String(n).padStart(2, "0");
}

function formatElapsed(ms) {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${pad2(m)}:${pad2(s)}`;
  return `${m}:${pad2(s)}`;
}

function resetSessionTimer() {
  sessionStart = Date.now();
  sessionFrozenMs = null;
}

function tickTimer() {
  const el = document.getElementById("timer");
  if (!el || gameView.classList.contains("hidden")) return;
  if (sessionStart == null) {
    el.textContent = "0:00";
    return;
  }
  const ms = sessionFrozenMs ?? Date.now() - sessionStart;
  el.textContent = formatElapsed(ms);
}

function showToast(title, body) {
  toastTitleEl.textContent = title;
  toastBodyEl.textContent = body;
  toastEl.classList.remove("hidden");
  window.clearTimeout(toastHideId);
  toastHideId = window.setTimeout(() => {
    toastEl.classList.add("hidden");
  }, 3400);
}

function checkMilestones(peak) {
  const crossed = MILESTONES.filter(
    (m) => peak >= m.at && !milestoneSeen.has(m.at)
  );
  if (!crossed.length) return;
  for (const m of crossed) milestoneSeen.add(m.at);
  const hi = crossed[crossed.length - 1];
  showToast(hi.title, hi.body);
}

function updateProgressHud() {
  const peak = maxTileInGrid(state.grid);
  document.getElementById("level-val").textContent = String(
    levelFromMaxTile(peak)
  );
  document.getElementById("peak-tile").textContent = String(peak);
  const { next, pct } = goalProgress(peak);
  const fill = document.getElementById("goal-bar-fill");
  fill.style.width = `${pct}%`;
  goalBarEl.setAttribute("aria-valuenow", String(Math.round(pct)));
  document.getElementById("goal-label").textContent =
    next >= 16384
      ? `Next tile goal: ${next} · ${Math.round(pct)}% (legend run!)`
      : `Next tile goal: ${next} · ${Math.round(pct)}% of the way`;
}

function renderBoard() {
  boardEl.innerHTML = "";
  const { grid } = state;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const v = grid[r][c];
      const cell = document.createElement("div");
      cell.className = "cell";
      if (v !== 0) {
        const tile = document.createElement("div");
        const tier =
          v <= 2048 && [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048].includes(v)
            ? `tile-${v}`
            : "tile-super";
        tile.className = `tile ${tier}`;
        tile.textContent = String(v);
        cell.appendChild(tile);
      }
      boardEl.appendChild(cell);
    }
  }
}

function updateHud() {
  scoreEl.textContent = String(state.score);
  if (state.score > best) {
    best = state.score;
    bestEl.textContent = String(best);
    saveBest(best);
  }
}

function hideOverlay() {
  overlay.classList.add("hidden");
  overlay.setAttribute("aria-hidden", "true");
  overlaySecondary.classList.add("hidden");
  boardEl.focus();
}

function syncLeaderboardLive() {
  const s = getSession();
  if (!s) return;
  const peak = maxTileInGrid(state.grid);
  recordLeaderboardEntry(s.key, s.displayName, {
    level: levelFromMaxTile(peak),
    peakTile: peak,
    score: state.score,
  });
}

function showGameOver() {
  const runTime =
    sessionFrozenMs ??
    (sessionStart != null ? Date.now() - sessionStart : 0);
  overlayTitle.textContent = "Game over";
  overlayMsg.textContent = `Final score: ${state.score} · Time: ${formatElapsed(
    runTime
  )}. Ready for a rematch?`;
  overlayPrimary.textContent = "New game";
  overlaySecondary.classList.add("hidden");
  overlay.classList.remove("hidden");
  overlay.setAttribute("aria-hidden", "false");
  overlayPrimary.onclick = () => {
    hideOverlay();
    resetGame();
  };
}

function showYouWin() {
  overlayTitle.textContent = "Mission clear!";
  overlayMsg.textContent =
    "You forged 2048! Push further into legend… or begin a new story.";
  overlayPrimary.textContent = "Keep playing";
  overlaySecondary.textContent = "New game";
  overlaySecondary.classList.remove("hidden");
  overlay.classList.remove("hidden");
  overlay.setAttribute("aria-hidden", "false");
  overlayPrimary.onclick = () => {
    state = continueAfterWin(state);
    hideOverlay();
    subtextEl.textContent = "";
  };
  overlaySecondary.onclick = () => {
    hideOverlay();
    resetGame();
  };
}

function checkEndStates() {
  if (state.over) {
    if (sessionStart != null && sessionFrozenMs == null) {
      sessionFrozenMs = Date.now() - sessionStart;
      tickTimer();
    }
    saveBest(state.score);
    showGameOver();
    return;
  }
  if (state.won && !state.keepPlayingAfterWin && has2048Tile()) {
    showYouWin();
  }
}

function has2048Tile() {
  return state.grid.some((row) => row.some((v) => v >= 2048));
}

function resetGame() {
  state = newGameState();
  best = loadBest();
  bestEl.textContent = String(best);
  subtextEl.textContent = "";
  milestoneSeen.clear();
  resetSessionTimer();
  renderBoard();
  updateHud();
  updateProgressHud();
  tickTimer();
  boardEl.focus();
}

function tryMove(dir) {
  if (!overlay.classList.contains("hidden")) return;
  if (!rankOverlay.classList.contains("hidden")) return;
  const next = applyMove(state, dir);
  if (next === state) return;
  state = next;
  renderBoard();
  updateHud();
  checkMilestones(maxTileInGrid(state.grid));
  updateProgressHud();
  syncLeaderboardLive();
  checkEndStates();
}

function attachGameControlsOnce() {
  if (gameBooted) return;
  gameBooted = true;

  document.getElementById("new-game").addEventListener("click", () => {
    hideOverlay();
    resetGame();
  });

  window.addEventListener("keydown", (e) => {
    const t = e.target;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
    if (gameView.classList.contains("hidden")) return;
    if (!rankOverlay.classList.contains("hidden") && e.key === "Escape") {
      rankClose.click();
      return;
    }

    const key = e.key;
    if (key === "ArrowUp") {
      e.preventDefault();
      tryMove("up");
    } else if (key === "ArrowDown") {
      e.preventDefault();
      tryMove("down");
    } else if (key === "ArrowLeft") {
      e.preventDefault();
      tryMove("left");
    } else if (key === "ArrowRight") {
      e.preventDefault();
      tryMove("right");
    }
  });

  let touchX = 0;
  let touchY = 0;

  boardEl.addEventListener(
    "touchstart",
    (e) => {
      const p = e.changedTouches[0];
      touchX = p.clientX;
      touchY = p.clientY;
    },
    { passive: true }
  );

  boardEl.addEventListener(
    "touchmove",
    (e) => {
      if (e.cancelable) e.preventDefault();
    },
    { passive: false }
  );

  boardEl.addEventListener(
    "touchend",
    (e) => {
      const p = e.changedTouches[0];
      const dx = p.clientX - touchX;
      const dy = p.clientY - touchY;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);
      if (absX < 24 && absY < 24) return;
      if (absX > absY) {
        tryMove(dx > 0 ? "right" : "left");
      } else {
        tryMove(dy > 0 ? "down" : "up");
      }
    },
    { passive: true }
  );

  window.setInterval(tickTimer, 250);
}

function enterGame() {
  authView.classList.add("hidden");
  gameView.classList.remove("hidden");
  syncSessionBar();
  best = loadBest();
  bestEl.textContent = String(best);
  attachGameControlsOnce();
  resetGame();
}

function leaveGame() {
  gameView.classList.add("hidden");
  authView.classList.remove("hidden");
  rankOverlay.classList.add("hidden");
  setAuthMode("login");
  authForm.reset();
  authError.classList.add("hidden");
}

setAuthMode("login");

if (getSession()) {
  enterGame();
} else {
  authView.classList.remove("hidden");
  gameView.classList.add("hidden");
}
