import test from "node:test";
import assert from "node:assert/strict";
import { countSolutions, generatePuzzle } from "../app/sudoku/engine";

for (const size of [4, 6, 9] as const) {
  test(`${size}x${size} generator creates valid puzzles with one solution`, () => {
    for (let sample = 0; sample < 3; sample++) {
      const { puzzle, solution } = generatePuzzle(size);
      assert.equal(puzzle.length, size * size);
      assert.equal(solution.length, size * size);
      assert.ok(puzzle.some(value => value === 0));
      assert.equal(countSolutions(puzzle, size), 1);
      puzzle.forEach((value, index) => { if (value) assert.equal(value, solution[index]); });
    }
  });
}
