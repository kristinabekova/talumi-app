export type PyramidSize = 3 | 4;
export type Difficulty = 1 | 2 | 3 | 4;

export type PyramidPuzzle = {
  size: PyramidSize;
  difficulty: Difficulty;
  /** Solution values, values[row][col] — row 0 is the base. */
  values: number[][];
  /** Which cells are pre-filled from the start. */
  given: boolean[][];
};

export type Relation = {
  row: number;
  col: number;
  leftRow: number;
  leftCol: number;
  rightRow: number;
  rightCol: number;
};
