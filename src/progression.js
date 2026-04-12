/** @type {{ at: number, title: string, body: string }[]} */
export const MILESTONES = [
  { at: 32, title: "Warm-up cleared!", body: "32 on the board — momentum begins." },
  { at: 64, title: "Sixty-four surge", body: "The grid is heating up." },
  { at: 128, title: "Bronze fusion", body: "Triple digits. Nice merge." },
  { at: 256, title: "Silver bloom", body: "Power climb in progress." },
  { at: 512, title: "Gold rush", body: "Halfway to the big four digits." },
  { at: 1024, title: "Star tier", body: "Four digits — stay sharp." },
  { at: 2048, title: "Legend forged", body: "You summoned the title tile!" },
  { at: 4096, title: "Beyond legend", body: "The story didn’t end at 2048." },
  { at: 8192, title: "Mythic height", body: "Seriously impressive run." },
];

export function nextTileGoal(maxTile) {
  if (!maxTile || maxTile < 2) return 4;
  let p = 4;
  while (p <= maxTile) p *= 2;
  return p;
}

export function levelFromMaxTile(maxTile) {
  if (!maxTile || maxTile < 2) return 1;
  return Math.floor(Math.log2(maxTile));
}

export function goalProgress(maxTile) {
  const next = nextTileGoal(maxTile);
  const prev = next / 2;
  if (maxTile >= next) return { next, pct: 100 };
  const pct = ((maxTile - prev) / (next - prev)) * 100;
  return { next, pct: Math.max(0, Math.min(100, pct)) };
}
