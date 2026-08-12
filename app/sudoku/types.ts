export type SudokuSize = 4 | 6 | 9;

export type SudokuSnapshot = {
  values: number[];
  notes: number[][];
  hints: boolean[];
};

export type SavedSudoku = SudokuSnapshot & {
  version: 1;
  size: SudokuSize;
  puzzle: number[];
  solution: number[];
  history: SudokuSnapshot[];
  future: SudokuSnapshot[];
  updatedAt: string;
};

export const SIZE_META = {
  4: { label: "4 × 4", mood: "Na zoznámenie", blockRows: 2, blockCols: 2, empty: 8 },
  6: { label: "6 × 6", mood: "Pokojná výzva", blockRows: 2, blockCols: 3, empty: 20 },
  9: { label: "9 × 9", mood: "Hlbšie sústredenie", blockRows: 3, blockCols: 3, empty: 45 },
} as const;
