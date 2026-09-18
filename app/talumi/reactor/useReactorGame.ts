"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { generatePyramid } from "./generator";
import { randomColor, type ReactorColor } from "./layout";
import type { Difficulty, PyramidPuzzle, PyramidSize } from "./types";

/** The crystal fills up over this many solved levels, then releases its energy. */
export const SERIES_LENGTH = 4;
export const RELEASE_MS = 2600;

export type CellStatus = "idle" | "wrong" | "hinted";

export type ReactorCell = { row: number; col: number };

/** Oblasti 1–2 are 3-floor pyramids, oblasti 3–4 are 4-floor pyramids. */
export function sizeForDifficulty(difficulty: Difficulty): PyramidSize {
  return difficulty <= 2 ? 3 : 4;
}

function emptyEntered(size: PyramidSize): (number | null)[][] {
  return Array.from({ length: size }, (_, row) => Array(size - row).fill(null));
}

function emptyStatus(size: PyramidSize): CellStatus[][] {
  return Array.from({ length: size }, (_, row) => Array(size - row).fill("idle" as CellStatus));
}

export function useReactorGame(paused: boolean, difficulty: Difficulty) {
  const size = sizeForDifficulty(difficulty);
  const [level, setLevel] = useState(1);
  const [puzzle, setPuzzle] = useState<PyramidPuzzle>(() => generatePyramid(size, difficulty));
  const [entered, setEntered] = useState<(number | null)[][]>(() => emptyEntered(size));
  const [status, setStatus] = useState<CellStatus[][]>(() => emptyStatus(size));
  const [selected, setSelected] = useState<ReactorCell | null>(null);
  const [buffer, setBuffer] = useState("");
  const [solved, setSolved] = useState(false);
  const [coins, setCoins] = useState(120);
  const [color, setColor] = useState<ReactorColor>(() => randomColor());
  const [releasing, setReleasing] = useState(false);
  const wrongTimerRef = useRef<number | null>(null);

  const startLevel = useCallback(() => {
    setPuzzle(generatePyramid(size, difficulty));
    setEntered(emptyEntered(size));
    setStatus(emptyStatus(size));
    setSelected(null);
    setBuffer("");
    setSolved(false);
  }, [size, difficulty]);

  useEffect(() => { startLevel(); }, [level, startLevel]);
  useEffect(() => () => { if (wrongTimerRef.current) window.clearTimeout(wrongTimerRef.current); }, []);

  const isFilled = useCallback(
    (grid: (number | null)[][]) =>
      puzzle.given.every((row, r) => row.every((given, c) => given || grid[r][c] !== null)),
    [puzzle]
  );

  const validateAll = useCallback((grid: (number | null)[][]) => {
    let allCorrect = true;
    const nextStatus = emptyStatus(puzzle.size);
    for (let r = 0; r < puzzle.size; r++) {
      for (let c = 0; c < puzzle.values[r].length; c++) {
        if (puzzle.given[r][c]) continue;
        const correct = grid[r][c] === puzzle.values[r][c];
        nextStatus[r][c] = correct ? "idle" : "wrong";
        if (!correct) allCorrect = false;
      }
    }
    setStatus((prev) => {
      // Keep "hinted" styling on cells that were revealed via the hint button.
      return nextStatus.map((row, r) => row.map((s, c) => (prev[r][c] === "hinted" ? "hinted" : s)));
    });
    if (allCorrect) {
      const isRelease = level % SERIES_LENGTH === 0;
      setSolved(true);
      setCoins((v) => v + 5);
      if (isRelease) setReleasing(true);
      window.setTimeout(() => {
        if (isRelease) {
          setReleasing(false);
          setColor((c) => randomColor(c));
        }
        setLevel((v) => v + 1);
      }, isRelease ? RELEASE_MS : 1200);
    } else {
      if (wrongTimerRef.current) window.clearTimeout(wrongTimerRef.current);
      wrongTimerRef.current = window.setTimeout(() => {
        setStatus((prev) => prev.map((row) => row.map((s) => (s === "wrong" ? "idle" : s))));
      }, 900);
    }
  }, [puzzle, level]);

  const selectCell = useCallback((row: number, col: number) => {
    if (paused || solved || puzzle.given[row][col]) return;
    setSelected({ row, col });
    // Re-tapping a filled cell starts a fresh entry instead of appending to the old number.
    setBuffer("");
  }, [paused, solved, puzzle]);

  const commitCell = useCallback((row: number, col: number, value: number | null) => {
    setEntered((prev) => {
      const next = prev.map((r) => [...r]);
      next[row][col] = value;
      if (isFilled(next)) validateAll(next);
      return next;
    });
    setStatus((prev) => {
      if (prev[row][col] === "idle") return prev;
      const next = prev.map((r) => [...r]);
      next[row][col] = "idle";
      return next;
    });
    setSelected(null);
    setBuffer("");
  }, [isFilled, validateAll]);

  // The number is entered as soon as it has as many digits as the correct answer.
  const pressDigit = useCallback((digit: number) => {
    if (paused || solved || !selected) return;
    const { row, col } = selected;
    const expectedDigits = String(puzzle.values[row][col]).length;
    const next = buffer + String(digit);
    if (next.length < expectedDigits) {
      setBuffer(next);
      return;
    }
    commitCell(row, col, Number(next));
  }, [paused, solved, selected, buffer, puzzle, commitCell]);

  const pressClear = useCallback(() => {
    if (paused || solved || !selected) return;
    if (buffer !== "") {
      setBuffer("");
      return;
    }
    commitCell(selected.row, selected.col, null);
  }, [paused, solved, selected, buffer, commitCell]);

  const pressConfirm = useCallback(() => {
    if (paused || solved || !selected) return;
    if (buffer === "") {
      setSelected(null);
      return;
    }
    commitCell(selected.row, selected.col, Number(buffer));
  }, [paused, solved, selected, buffer, commitCell]);

  const useHint = useCallback(() => {
    if (paused || solved) return;
    const blanks: ReactorCell[] = [];
    for (let r = 0; r < puzzle.size; r++) {
      for (let c = 0; c < puzzle.values[r].length; c++) {
        if (!puzzle.given[r][c] && entered[r][c] === null) blanks.push({ row: r, col: c });
      }
    }
    if (!blanks.length) return;
    const pick = blanks[Math.floor(Math.random() * blanks.length)];
    setEntered((prev) => {
      const next = prev.map((r) => [...r]);
      next[pick.row][pick.col] = puzzle.values[pick.row][pick.col];
      if (isFilled(next)) validateAll(next);
      return next;
    });
    setStatus((prev) => {
      const next = prev.map((r) => [...r]);
      next[pick.row][pick.col] = "hinted";
      return next;
    });
  }, [paused, solved, puzzle, entered, isFilled, validateAll]);

  const progress = useMemo(() => {
    const total = puzzle.given.reduce((sum, row) => sum + row.filter((g) => !g).length, 0);
    const done = entered.reduce((sum, row) => sum + row.filter((v) => v !== null).length, 0);
    return { total, done };
  }, [puzzle, entered]);

  return {
    level,
    puzzle,
    entered,
    status,
    selected,
    buffer,
    solved,
    coins,
    color,
    releasing,
    progress,
    selectCell,
    pressDigit,
    pressClear,
    pressConfirm,
    useHint,
    restart: startLevel,
  };
}
