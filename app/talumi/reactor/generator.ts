import type { Difficulty, PyramidPuzzle, PyramidSize, Relation } from "./types";

/** Block(row, col) = Block(row-1, col) + Block(row-1, col+1) for every row above the base. */
export function relationsFor(size: PyramidSize): Relation[] {
  const relations: Relation[] = [];
  for (let row = 1; row < size; row++) {
    const rowLen = size - row;
    for (let col = 0; col < rowLen; col++) {
      relations.push({ row, col, leftRow: row - 1, leftCol: col, rightRow: row - 1, rightCol: col + 1 });
    }
  }
  return relations;
}

export function allCells(size: PyramidSize): [number, number][] {
  const cells: [number, number][] = [];
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size - row; col++) cells.push([row, col]);
  }
  return cells;
}

function emptyGrid(size: PyramidSize): boolean[][] {
  return Array.from({ length: size }, (_, row) => Array(size - row).fill(false));
}

/**
 * A reveal pattern is only fair if every blank can be reached by repeatedly
 * solving one relation at a time (add two knowns, or subtract a known child
 * from a known parent) — never by solving two unknowns at once.
 */
export function isLocallySolvable(size: PyramidSize, given: boolean[][]): boolean {
  const known = given.map((row) => [...row]);
  const relations = relationsFor(size);
  let progress = true;
  while (progress) {
    progress = false;
    for (const rel of relations) {
      const p = known[rel.row][rel.col];
      const l = known[rel.leftRow][rel.leftCol];
      const r = known[rel.rightRow][rel.rightCol];
      const count = Number(p) + Number(l) + Number(r);
      if (count === 2) {
        if (!p) known[rel.row][rel.col] = true;
        else if (!l) known[rel.leftRow][rel.leftCol] = true;
        else known[rel.rightRow][rel.rightCol] = true;
        progress = true;
      }
    }
  }
  return known.every((row) => row.every(Boolean));
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function buildPyramid(size: PyramidSize, base: number[]): number[][] {
  const rows: number[][] = [base];
  for (let row = 1; row < size; row++) {
    const prev = rows[row - 1];
    const next: number[] = [];
    for (let i = 0; i < prev.length - 1; i++) next.push(prev[i] + prev[i + 1]);
    rows.push(next);
  }
  return rows;
}

function crossesTen(left: number, right: number) {
  return (left % 10) + (right % 10) >= 10;
}

function satisfiesCrossing(size: PyramidSize, values: number[][], mode: "never" | "always") {
  for (const rel of relationsFor(size)) {
    const crosses = crossesTen(values[rel.leftRow][rel.leftCol], values[rel.rightRow][rel.rightCol]);
    if (mode === "never" && crosses) return false;
    if (mode === "always" && !crosses) return false;
  }
  return true;
}

// Chained sums grow fast (a 4-floor apex can be many times the base numbers),
// so the "result stays in this range" rule is checked only on the base-level
// additions — the ones the child actually sees as single a+b=c steps, same
// shape as the spec's own examples (7+5=12, 21+13=34, ...). Crossing-ten still
// applies at every level, since that's a property of each addition step itself.
function satisfiesResultRange(size: PyramidSize, values: number[][], min: number, max: number) {
  for (const rel of relationsFor(size)) {
    if (rel.leftRow !== 0) continue;
    const result = values[rel.row][rel.col];
    if (result < min || result > max) return false;
  }
  return true;
}

const DIFFICULTY_RULES: Record<Difficulty, { crossing: "never" | "always"; resultMin: number; resultMax: number }> = {
  1: { crossing: "never", resultMin: 1, resultMax: 20 },
  2: { crossing: "always", resultMin: 11, resultMax: 20 },
  3: { crossing: "never", resultMin: 1, resultMax: 100 },
  4: { crossing: "always", resultMin: 1, resultMax: 100 },
};

function baseRange(difficulty: Difficulty, size: PyramidSize) {
  if (difficulty <= 2) return { min: 1, max: 9 };
  // Two-digit base numbers. The 4-floor pyramid gets a wider spread so its
  // ones digits vary enough for oblasť 4's "always crosses ten" rule to be
  // reachable (a narrow band like 10–15 has almost no ones digits ≥ 5).
  return size === 3 ? { min: 10, max: 30 } : { min: 10, max: 45 };
}

function generateValues(size: PyramidSize, difficulty: Difficulty): number[][] {
  const rule = DIFFICULTY_RULES[difficulty];
  const range = baseRange(difficulty, size);
  for (let attempt = 0; attempt < 20000; attempt++) {
    const base = Array.from({ length: size }, () => randInt(range.min, range.max));
    const values = buildPyramid(size, base);
    if (!satisfiesResultRange(size, values, rule.resultMin, rule.resultMax)) continue;
    if (!satisfiesCrossing(size, values, rule.crossing)) continue;
    return values;
  }
  // Safety net: extremely unlikely, but never leave the generator empty-handed.
  const base = Array.from({ length: size }, () => randInt(range.min, range.max));
  return buildPyramid(size, base);
}

function makeGiven(size: PyramidSize, cells: [number, number][]): boolean[][] {
  const grid = emptyGrid(size);
  for (const [row, col] of cells) grid[row][col] = true;
  return grid;
}

function generateReveal(size: PyramidSize): boolean[][] {
  const revealCount = size === 3 ? 3 : Math.random() < 0.5 ? 4 : 5;
  const cells = allCells(size);

  // Variant A: whole base revealed (only fits when the base size matches the reveal count).
  if (revealCount === size && Math.random() < 0.4) {
    const baseCells: [number, number][] = Array.from({ length: size }, (_, col) => [0, col]);
    const grid = makeGiven(size, baseCells);
    if (isLocallySolvable(size, grid)) return grid;
  }

  // Variant B (3-floor): one base cell + one middle cell + the apex, so the
  // player has to subtract at least once.
  if (size === 3 && Math.random() < 0.4) {
    const baseCol = randInt(0, 2);
    const midCol = randInt(0, 1);
    const grid = makeGiven(size, [[0, baseCol], [1, midCol], [2, 0]]);
    if (isLocallySolvable(size, grid)) return grid;
  }

  // Variant C: random layout, kept only if it is solvable one step at a time.
  for (let attempt = 0; attempt < 300; attempt++) {
    const shuffled = [...cells].sort(() => Math.random() - 0.5).slice(0, revealCount);
    const grid = makeGiven(size, shuffled);
    if (isLocallySolvable(size, grid)) return grid;
  }

  // Fallback: base cells are always solvable.
  return makeGiven(size, Array.from({ length: Math.min(revealCount, size) }, (_, col) => [0, col]));
}

export function generatePyramid(size: PyramidSize, difficulty: Difficulty): PyramidPuzzle {
  return {
    size,
    difficulty,
    values: generateValues(size, difficulty),
    given: generateReveal(size),
  };
}
