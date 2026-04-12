const SIZE = 4;

export function emptyGrid() {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
}

function moveLineLeft(line) {
  const arr = line.filter((x) => x);
  const result = [];
  let scoreAdd = 0;
  let i = 0;
  while (i < arr.length) {
    if (i < arr.length - 1 && arr[i] === arr[i + 1]) {
      const v = arr[i] * 2;
      result.push(v);
      scoreAdd += v;
      i += 2;
    } else {
      result.push(arr[i]);
      i += 1;
    }
  }
  while (result.length < SIZE) result.push(0);
  return { line: result, scoreAdd };
}

function moveLineRight(line) {
  const arr = line.filter((x) => x);
  const result = [];
  let scoreAdd = 0;
  let i = arr.length - 1;
  while (i >= 0) {
    if (i > 0 && arr[i] === arr[i - 1]) {
      const v = arr[i] * 2;
      result.unshift(v);
      scoreAdd += v;
      i -= 2;
    } else {
      result.unshift(arr[i]);
      i -= 1;
    }
  }
  while (result.length < SIZE) result.unshift(0);
  return { line: result, scoreAdd };
}

function gridsEqual(a, b) {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (a[r][c] !== b[r][c]) return false;
    }
  }
  return true;
}

export function moveGrid(grid, dir) {
  const newGrid = emptyGrid();
  let scoreDelta = 0;

  if (dir === "left") {
    for (let r = 0; r < SIZE; r++) {
      const { line, scoreAdd } = moveLineLeft(grid[r]);
      scoreDelta += scoreAdd;
      newGrid[r] = line;
    }
  } else if (dir === "right") {
    for (let r = 0; r < SIZE; r++) {
      const { line, scoreAdd } = moveLineRight(grid[r]);
      scoreDelta += scoreAdd;
      newGrid[r] = line;
    }
  } else if (dir === "up") {
    for (let c = 0; c < SIZE; c++) {
      const col = [grid[0][c], grid[1][c], grid[2][c], grid[3][c]];
      const { line, scoreAdd } = moveLineLeft(col);
      scoreDelta += scoreAdd;
      for (let r = 0; r < SIZE; r++) newGrid[r][c] = line[r];
    }
  } else if (dir === "down") {
    for (let c = 0; c < SIZE; c++) {
      const col = [grid[0][c], grid[1][c], grid[2][c], grid[3][c]];
      const { line, scoreAdd } = moveLineRight(col);
      scoreDelta += scoreAdd;
      for (let r = 0; r < SIZE; r++) newGrid[r][c] = line[r];
    }
  }

  const moved = !gridsEqual(grid, newGrid);
  return { grid: newGrid, moved, scoreDelta };
}

export function addRandomTile(grid) {
  const empty = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c] === 0) empty.push([r, c]);
    }
  }
  if (empty.length === 0) return null;
  const pick = empty[Math.floor(Math.random() * empty.length)];
  const [r, c] = pick;
  const g = grid.map((row) => [...row]);
  g[r][c] = Math.random() < 0.9 ? 2 : 4;
  return g;
}

export function canMove(grid) {
  for (const dir of ["up", "down", "left", "right"]) {
    if (moveGrid(grid, dir).moved) return true;
  }
  return false;
}

export function has2048(grid) {
  return grid.some((row) => row.some((v) => v >= 2048));
}

export function newGameState() {
  let grid = emptyGrid();
  grid = addRandomTile(grid);
  grid = addRandomTile(grid);
  return {
    grid,
    score: 0,
    won: false,
    over: false,
    keepPlayingAfterWin: false,
  };
}

/**
 * @param {ReturnType<typeof newGameState>} state
 * @param {'up' | 'down' | 'left' | 'right'} dir
 */
export function applyMove(state, dir) {
  if (state.over) return state;

  const { grid, moved, scoreDelta } = moveGrid(state.grid, dir);
  if (!moved) return state;

  const spawned = addRandomTile(grid);
  const newGrid = spawned ?? grid;
  const score = state.score + scoreDelta;
  const won = state.won || has2048(newGrid);
  const over = !canMove(newGrid);

  return {
    grid: newGrid,
    score,
    won,
    over,
    keepPlayingAfterWin: state.keepPlayingAfterWin,
  };
}

export function continueAfterWin(state) {
  return { ...state, keepPlayingAfterWin: true };
}
