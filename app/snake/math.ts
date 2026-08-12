export type Difficulty = "easy" | "medium" | "hard";
export type ChallengeKind = "even" | "odd" | "multiple" | "divisible" | "greater" | "less" | "range" | "prime" | "ends" | "divisibleBoth";

export type Challenge = {
  id: string;
  kind: ChallengeKind;
  label: string;
  a?: number;
  b?: number;
};

export type Cell = { x: number; y: number };
export type NumberOrb = Cell & { id: string; value: number; color: string; textColor: string };

export const GRID_SIZE = 18;
export const ORB_COLORS = ["#18DCE2", "#6550D9", "#8C63E8"];

export const DIFFICULTY_CONFIG = {
  easy: { label: "Ľahká", max: 20, tickMs: 360, orbCount: 6, wraps: true },
  medium: { label: "Stredná", max: 50, tickMs: 285, orbCount: 6, wraps: false },
  hard: { label: "Ťažká", max: 100, tickMs: 225, orbCount: 8, wraps: false },
} as const;

const randomItem = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)];

export function isPrime(value: number) {
  if (value < 2) return false;
  for (let divisor = 2; divisor <= Math.sqrt(value); divisor += 1) {
    if (value % divisor === 0) return false;
  }
  return true;
}

export function matchesChallenge(value: number, challenge: Challenge) {
  switch (challenge.kind) {
    case "even": return value % 2 === 0;
    case "odd": return value % 2 !== 0;
    case "multiple":
    case "divisible": return value % (challenge.a ?? 1) === 0;
    case "greater": return value > (challenge.a ?? 0);
    case "less": return value < (challenge.a ?? 0);
    case "range": return value >= (challenge.a ?? 0) && value <= (challenge.b ?? 0);
    case "prime": return isPrime(value);
    case "ends": return value % 10 === challenge.a;
    case "divisibleBoth": return value % (challenge.a ?? 1) === 0 && value % (challenge.b ?? 1) === 0;
  }
}

function challengePool(difficulty: Difficulty): Challenge[] {
  if (difficulty === "easy") return [
    { id: "even", kind: "even", label: "Jedz teraz párne čísla" },
    { id: "odd", kind: "odd", label: "Jedz teraz nepárne čísla" },
    { id: "gt-10", kind: "greater", label: "Jedz teraz čísla väčšie ako 10", a: 10 },
    { id: "lt-12", kind: "less", label: "Jedz teraz čísla menšie ako 12", a: 12 },
  ];
  if (difficulty === "medium") return [
    { id: "even", kind: "even", label: "Jedz teraz párne čísla" },
    { id: "odd", kind: "odd", label: "Jedz teraz nepárne čísla" },
    { id: "m3", kind: "multiple", label: "Jedz teraz násobky čísla 3", a: 3 },
    { id: "m4", kind: "multiple", label: "Jedz teraz násobky čísla 4", a: 4 },
    { id: "d5", kind: "divisible", label: "Jedz teraz čísla deliteľné číslom 5", a: 5 },
    { id: "range-10-30", kind: "range", label: "Jedz teraz čísla od 10 do 30 (vrátane)", a: 10, b: 30 },
  ];
  return [
    { id: "m4", kind: "multiple", label: "Jedz teraz násobky čísla 4", a: 4 },
    { id: "m5", kind: "multiple", label: "Jedz teraz násobky čísla 5", a: 5 },
    { id: "d3", kind: "divisible", label: "Jedz teraz čísla deliteľné číslom 3", a: 3 },
    { id: "prime", kind: "prime", label: "Jedz teraz prvočísla" },
    { id: "range-10-30", kind: "range", label: "Jedz teraz čísla od 10 do 30 (vrátane)", a: 10, b: 30 },
    { id: "ends-0", kind: "ends", label: "Jedz teraz čísla s poslednou číslicou 0", a: 0 },
    { id: "ends-5", kind: "ends", label: "Jedz teraz čísla s poslednou číslicou 5", a: 5 },
    { id: "d2d3", kind: "divisibleBoth", label: "Jedz teraz čísla deliteľné 2 aj 3", a: 2, b: 3 },
  ];
}

export function createChallenge(difficulty: Difficulty, previousId?: string) {
  const pool = challengePool(difficulty).filter((item) => item.id !== previousId);
  return randomItem(pool);
}

function sameCell(a: Cell, b: Cell) { return a.x === b.x && a.y === b.y; }

function openCell(occupied: Cell[]) {
  const candidates: Cell[] = [];
  for (let y = 1; y < GRID_SIZE - 1; y += 1) {
    for (let x = 1; x < GRID_SIZE - 1; x += 1) {
      if (!occupied.some((cell) => Math.hypot(cell.x - x, cell.y - y) < 2)) candidates.push({ x, y });
    }
  }
  if (!candidates.length) throw new Error("Na hernej ploche nie je voľné miesto.");
  return randomItem(candidates);
}

function valuePool(challenge: Challenge, max: number, wanted: boolean, used: number[]) {
  return Array.from({ length: max }, (_, index) => index + 1)
    .filter((value) => matchesChallenge(value, challenge) === wanted && !used.includes(value));
}

export function createOrb(challenge: Challenge, difficulty: Difficulty, occupied: Cell[], usedValues: number[], wanted: boolean): NumberOrb {
  const pool = valuePool(challenge, DIFFICULTY_CONFIG[difficulty].max, wanted, usedValues);
  if (!pool.length) throw new Error("Pre zadanie nie je možné vytvoriť matematicky správnu ponuku.");
  const cell = openCell(occupied);
  const value = randomItem(pool);
  const color = randomItem(ORB_COLORS);
  const textColor = "#FFFFFF";
  return { ...cell, value, color, textColor, id: `${value}-${cell.x}-${cell.y}-${Math.random()}` };
}

export function createOrbs(challenge: Challenge, difficulty: Difficulty, snake: Cell[]): NumberOrb[] {
  const count = DIFFICULTY_CONFIG[difficulty].orbCount;
  const wanted = shuffleFlags(count);
  const orbs: NumberOrb[] = [];
  for (const correct of wanted) {
    orbs.push(createOrb(challenge, difficulty, [...snake, ...orbs], orbs.map((orb) => orb.value), correct));
  }
  return orbs;
}

/** Nahradí iba zjedenú guličku. Ostatným ponechá hodnotu, farbu aj polohu. */
export function replaceOrbInSet(orbs: NumberOrb[], eatenId: string, replacement: NumberOrb) {
  return orbs.map((orb) => orb.id === eatenId ? replacement : orb);
}

function shuffleFlags(count: number) {
  const flags = [true, true, false, false];
  while (flags.length < count) flags.push(Math.random() > 0.5);
  return flags.sort(() => Math.random() - 0.5);
}

export function validateOrbSet(orbs: NumberOrb[], challenge: Challenge, snake: Cell[]) {
  const valuesUnique = new Set(orbs.map((orb) => orb.value)).size === orbs.length;
  const cellsUnique = new Set(orbs.map((orb) => `${orb.x}:${orb.y}`)).size === orbs.length;
  const avoidsSnake = orbs.every((orb) => !snake.some((cell) => sameCell(cell, orb)));
  const correct = orbs.filter((orb) => matchesChallenge(orb.value, challenge)).length;
  return valuesUnique && cellsUnique && avoidsSnake && correct >= 2 && orbs.length - correct >= 2;
}
