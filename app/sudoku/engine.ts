import { SIZE_META, type SavedSudoku, type SudokuSize } from "./types";

const shuffled = <T,>(items: T[]) => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

export function makeSolution(size: SudokuSize) {
  const { blockRows, blockCols } = SIZE_META[size];
  const pattern = (row: number, col: number) => (blockCols * (row % blockRows) + Math.floor(row / blockRows) + col) % size;
  const rowBands = shuffled(Array.from({ length: size / blockRows }, (_, i) => i));
  const rows = rowBands.flatMap(band => shuffled(Array.from({ length: blockRows }, (_, i) => band * blockRows + i)));
  const colStacks = shuffled(Array.from({ length: size / blockCols }, (_, i) => i));
  const cols = colStacks.flatMap(stack => shuffled(Array.from({ length: blockCols }, (_, i) => stack * blockCols + i)));
  const digits = shuffled(Array.from({ length: size }, (_, i) => i + 1));
  return rows.flatMap(row => cols.map(col => digits[pattern(row, col)]));
}

function choices(board: number[], index: number, size: SudokuSize) {
  const { blockRows, blockCols } = SIZE_META[size];
  const row = Math.floor(index / size);
  const col = index % size;
  const used = new Set<number>();
  for (let i = 0; i < size; i++) {
    used.add(board[row * size + i]);
    used.add(board[i * size + col]);
  }
  const startRow = Math.floor(row / blockRows) * blockRows;
  const startCol = Math.floor(col / blockCols) * blockCols;
  for (let r = startRow; r < startRow + blockRows; r++) for (let c = startCol; c < startCol + blockCols; c++) used.add(board[r * size + c]);
  return Array.from({ length: size }, (_, i) => i + 1).filter(n => !used.has(n));
}

export function countSolutions(input: number[], size: SudokuSize, limit = 2) {
  const board = [...input];
  let count = 0;
  const solve = () => {
    if (count >= limit) return;
    let best = -1;
    let bestChoices: number[] = [];
    for (let i = 0; i < board.length; i++) {
      if (board[i]) continue;
      const available = choices(board, i, size);
      if (!available.length) return;
      if (best < 0 || available.length < bestChoices.length) {
        best = i;
        bestChoices = available;
        if (available.length === 1) break;
      }
    }
    if (best < 0) { count++; return; }
    for (const value of bestChoices) {
      board[best] = value;
      solve();
      board[best] = 0;
      if (count >= limit) return;
    }
  };
  solve();
  return count;
}

export function generatePuzzle(size: SudokuSize) {
  const solution = makeSolution(size);
  const puzzle = [...solution];
  let removed = 0;
  for (const index of shuffled(Array.from({ length: size * size }, (_, i) => i))) {
    if (removed >= SIZE_META[size].empty) break;
    const value = puzzle[index];
    puzzle[index] = 0;
    if (countSolutions(puzzle, size) !== 1) puzzle[index] = value;
    else removed++;
  }
  return { puzzle, solution };
}

export function conflictsFor(values: number[], size: SudokuSize) {
  const { blockRows, blockCols } = SIZE_META[size];
  const conflicts = new Set<number>();
  const mark = (indices: number[]) => {
    const byValue = new Map<number, number[]>();
    indices.forEach(index => {
      if (!values[index]) return;
      byValue.set(values[index], [...(byValue.get(values[index]) ?? []), index]);
    });
    byValue.forEach(group => { if (group.length > 1) group.forEach(index => conflicts.add(index)); });
  };
  for (let row = 0; row < size; row++) mark(Array.from({ length: size }, (_, col) => row * size + col));
  for (let col = 0; col < size; col++) mark(Array.from({ length: size }, (_, row) => row * size + col));
  for (let br = 0; br < size; br += blockRows) for (let bc = 0; bc < size; bc += blockCols) {
    const indices: number[] = [];
    for (let r = br; r < br + blockRows; r++) for (let c = bc; c < bc + blockCols; c++) indices.push(r * size + c);
    mark(indices);
  }
  return conflicts;
}

const key = (size: SudokuSize) => `talumi:crystal-sudoku:v1:${size}`;

export function loadGame(size: SudokuSize): SavedSudoku | null {
  if (typeof window === "undefined") return null;
  try {
    const parsed = JSON.parse(localStorage.getItem(key(size)) ?? "null") as SavedSudoku | null;
    if (!parsed || parsed.version !== 1 || parsed.size !== size || parsed.puzzle.length !== size * size || parsed.solution.length !== size * size || countSolutions(parsed.puzzle, size) !== 1) return null;
    return parsed;
  } catch { return null; }
}

export function saveGame(game: SavedSudoku) {
  localStorage.setItem(key(game.size), JSON.stringify({ ...game, updatedAt: new Date().toISOString() }));
}

export function clearGame(size: SudokuSize) {
  localStorage.removeItem(key(size));
}
