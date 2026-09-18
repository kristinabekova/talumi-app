"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { generatePyramid } from "./generator";
import type { Difficulty, PyramidPuzzle, PyramidSize } from "./types";

export type CellStatus = "idle" | "wrong" | "hinted";

export type ReactorCell = { row: number; col: number };

/** Level 1–4 = 3-floor pyramid, oblasti 1–4. Level 5–8 = 4-floor, oblasti 1–4.
 *  Level 9+ stays on the hardest 4-floor / oblasť 4 combination. */
export function levelConfig(level: number): { size: PyramidSize; difficulty: Difficulty } {
  const capped = Math.min(Math.max(level, 1), 8);
  if (capped <= 4) return { size: 3, difficulty: capped as Difficulty };
  return { size: 4, difficulty: (capped - 4) as Difficulty };
}

function emptyEntered(size: PyramidSize): (number | null)[][] {
  return Array.from({ length: size }, (_, row) => Array(size - row).fill(null));
}

function emptyStatus(size: PyramidSize): CellStatus[][] {
  return Array.from({ length: size }, (_, row) => Array(size - row).fill("idle" as CellStatus));
}

export function useReactorGame(paused: boolean) {
  const [level, setLevel] = useState(1);
  const [puzzle, setPuzzle] = useState<PyramidPuzzle>(() => generatePyramid(3, 1));
  const [entered, setEntered] = useState<(number | null)[][]>(() => emptyEntered(3));
  const [status, setStatus] = useState<CellStatus[][]>(() => emptyStatus(3));
  const [selected, setSelected] = useState<ReactorCell | null>(null);
  const [buffer, setBuffer] = useState("");
  const [solved, setSolved] = useState(false);
  const [coins, setCoins] = useState(120);
  const wrongTimerRef = useRef<number | null>(null);

  const startLevel = useCallback((targetLevel: number) => {
    const { size, difficulty } = levelConfig(targetLevel);
    setPuzzle(generatePyramid(size, difficulty));
    setEntered(emptyEntered(size));
    setStatus(emptyStatus(size));
    setSelected(null);
    setBuffer("");
    setSolved(false);
  }, []);

  useEffect(() => { startLevel(level); }, [level, startLevel]);
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
      setSolved(true);
      setCoins((v) => v + 5);
      window.setTimeout(() => setLevel((v) => v + 1), 1200);
    } else {
      if (wrongTimerRef.current) window.clearTimeout(wrongTimerRef.current);
      wrongTimerRef.current = window.setTimeout(() => {
        setStatus((prev) => prev.map((row) => row.map((s) => (s === "wrong" ? "idle" : s))));
      }, 900);
    }
  }, [puzzle]);

  const selectCell = useCallback((row: number, col: number) => {
    if (paused || solved || puzzle.given[row][col]) return;
    setSelected({ row, col });
    const current = entered[row][col];
    setBuffer(current === null ? "" : String(current));
  }, [paused, solved, puzzle, entered]);

  const pressDigit = useCallback((digit: number) => {
    if (paused || solved || !selected) return;
    setBuffer((b) => (b.length >= 3 ? b : b + String(digit)));
  }, [paused, solved, selected]);

  const pressClear = useCallback(() => {
    if (paused || solved || !selected) return;
    setBuffer("");
  }, [paused, solved, selected]);

  const pressConfirm = useCallback(() => {
    if (paused || solved || !selected) return;
    const { row, col } = selected;
    const value = buffer === "" ? null : Number(buffer);
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
  }, [paused, solved, selected, buffer, isFilled, validateAll]);

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
    progress,
    selectCell,
    pressDigit,
    pressClear,
    pressConfirm,
    useHint,
    restart: () => startLevel(level),
  };
}
