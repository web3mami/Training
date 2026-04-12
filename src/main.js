import { greet } from "./utils.js";
import {
  newGameState,
  applyMove,
  continueAfterWin,
} from "./game.js";
import "./style.css";

const BEST_KEY = "training-2048-best";

const app = document.querySelector("#app");

app.innerHTML = `
  <main class="game-shell anime-edition">
    <div class="sparkle-field" aria-hidden="true"></div>
    <header class="game-header">
      <div class="title-block">
        <p class="edition-badge" lang="en">Anime edition</p>
        <h1 class="game-title"><span class="title-text">2048</span></h1>
        <p class="love-note" lang="en">Hi Milla, I love you.</p>
        <p class="tagline" id="tagline"></p>
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
  </main>
`;

document.getElementById("tagline").textContent = greet("Mami");

const boardEl = document.getElementById("board");
const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
const subtextEl = document.getElementById("subtext");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlay-title");
const overlayMsg = document.getElementById("overlay-msg");
const overlayPrimary = document.getElementById("overlay-primary");
const overlaySecondary = document.getElementById("overlay-secondary");

function loadBest() {
  const n = Number(localStorage.getItem(BEST_KEY) || "0");
  return Number.isFinite(n) ? n : 0;
}

function saveBest(score) {
  const prev = loadBest();
  if (score > prev) localStorage.setItem(BEST_KEY, String(score));
}

let state = newGameState();
let best = loadBest();
bestEl.textContent = String(best);

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

function showGameOver() {
  overlayTitle.textContent = "Game over";
  overlayMsg.textContent = `Final score: ${state.score}. Ready for a rematch?`;
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
  renderBoard();
  updateHud();
  boardEl.focus();
}

function tryMove(dir) {
  if (!overlay.classList.contains("hidden")) return;
  const next = applyMove(state, dir);
  if (next === state) return;
  state = next;
  renderBoard();
  updateHud();
  checkEndStates();
}

document.getElementById("new-game").addEventListener("click", () => {
  hideOverlay();
  resetGame();
});

window.addEventListener("keydown", (e) => {
  const t = e.target;
  if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;

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

renderBoard();
updateHud();
boardEl.focus();
