"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { clearGame, conflictsFor, generatePuzzle, loadGame, saveGame } from "./engine";
import { SudokuGrid } from "./SudokuGrid";
import { HowToPlay } from "./SudokuIntro";
import { SIZE_META, type SavedSudoku, type SudokuSize, type SudokuSnapshot } from "./types";

const snapshot = (game: SavedSudoku): SudokuSnapshot => ({ values: [...game.values], notes: game.notes.map(n => [...n]), hints: [...game.hints] });

function NumberPad({ size, onNumber, completed }: { size: SudokuSize; onNumber: (n: number) => void; completed: number[] }) {
  return <div className="number-pad" aria-label="Číselná klávesnica">{Array.from({ length: size }, (_, i) => i + 1).map(n => <button key={n} className={completed.includes(n) ? "complete-number" : ""} onClick={() => onNumber(n)}>{n}</button>)}</div>;
}

function Toolbar({ notesMode, canUndo, canRedo, onNotes, onErase, onUndo, onRedo, onHint, onNew, onRules, onCheck, sound, onSound }: { notesMode: boolean; canUndo: boolean; canRedo: boolean; onNotes: () => void; onErase: () => void; onUndo: () => void; onRedo: () => void; onHint: () => void; onNew: () => void; onRules: () => void; onCheck: () => void; sound: boolean; onSound: () => void }) {
  return <div className="sudoku-toolbar"><button className={notesMode ? "active" : ""} onClick={onNotes} aria-pressed={notesMode}>✎ Poznámky</button><button onClick={onErase}>⌫ Vymazať</button><button onClick={onUndo} disabled={!canUndo}>↶ Späť</button><button onClick={onRedo} disabled={!canRedo}>↷ Znova</button><button onClick={onHint}>✦ Pomôcka</button><button onClick={onCheck}>✓ Skontrolovať</button><button onClick={onNew}>＋ Nová mriežka</button><button onClick={onRules}>? Pravidlá</button><button onClick={onSound} aria-label={sound ? "Vypnúť zvuk" : "Zapnúť zvuk"}>{sound ? "♪ Zvuk" : "♩ Bez zvuku"}</button></div>;
}

export default function SudokuGame({ size, resume, onBack, onChooseSize }: { size: SudokuSize; resume: boolean; onBack: () => void; onChooseSize: () => void }) {
  const [game, setGame] = useState<SavedSudoku | null>(null);
  const [selected, setSelected] = useState(0);
  const [notesMode, setNotesMode] = useState(false);
  const [message, setMessage] = useState("Pokračuj vlastným tempom.");
  const [showRules, setShowRules] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [checkedWrong, setCheckedWrong] = useState<Set<number>>(new Set());
  const [sound, setSound] = useState(true);

  const freshGame = useCallback(() => {
    const { puzzle, solution } = generatePuzzle(size);
    const next: SavedSudoku = { version: 1, size, puzzle, solution, values: [...puzzle], notes: Array.from({ length: size * size }, () => []), hints: Array(size * size).fill(false), history: [], future: [], updatedAt: new Date().toISOString() };
    saveGame(next); setGame(next); setSelected(puzzle.findIndex(v => !v)); setShowComplete(false); setCheckedWrong(new Set()); setMessage("Každé políčko má svoje miesto.");
  }, [size]);

  useEffect(() => { const saved = resume ? loadGame(size) : null; if (saved) { setGame(saved); setSelected(Math.max(0, saved.puzzle.findIndex((v, i) => !v && !saved.values[i]))); } else freshGame(); }, [freshGame, resume, size]);
  useEffect(() => { if (game) saveGame(game); }, [game]);

  const tone = (kind: "place" | "hint" | "done") => {
    if (!sound) return;
    try { const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext; const ctx = new AudioCtx(); const osc = ctx.createOscillator(); const gain = ctx.createGain(); osc.frequency.value = kind === "done" ? 660 : kind === "hint" ? 520 : 390; gain.gain.setValueAtTime(.035, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + (kind === "done" ? .35 : .12)); osc.connect(gain); gain.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + (kind === "done" ? .35 : .12)); } catch { /* zvuk je len doplnok */ }
  };

  const commit = (change: (draft: SavedSudoku) => void, feedback?: string) => setGame(current => {
    if (!current) return current;
    const next: SavedSudoku = { ...current, values: [...current.values], notes: current.notes.map(n => [...n]), hints: [...current.hints], history: [...current.history, snapshot(current)].slice(-100), future: [] };
    change(next); if (feedback) setMessage(feedback);
    const complete = next.values.every((v, i) => v === next.solution[i]);
    if (complete) { setTimeout(() => { setShowComplete(true); tone("done"); clearGame(size); }, 180); }
    return next;
  });

  const enter = useCallback((number: number) => {
    if (!game || game.puzzle[selected]) return;
    if (notesMode) commit(next => { const values = next.notes[selected]; next.notes[selected] = values.includes(number) ? values.filter(n => n !== number) : [...values, number].sort(); }, "Poznámka je uložená.");
    else { commit(next => { next.values[selected] = number; next.notes[selected] = []; next.notes = next.notes.map((notes, index) => index !== selected && isPeer(index, selected, size) ? notes.filter(n => n !== number) : notes); }, "Číslo je na svojom mieste. Môžeš ho kedykoľvek upraviť."); tone("place"); }
    setCheckedWrong(new Set());
  }, [game, selected, notesMode, size]);

  const move = useCallback((deltaRow: number, deltaCol: number) => setSelected(index => { const row = Math.floor(index / size), col = index % size; return ((row + deltaRow + size) % size) * size + ((col + deltaCol + size) % size); }), [size]);
  useEffect(() => { document.querySelector<HTMLButtonElement>(`.sudoku-cell[data-index="${selected}"]`)?.focus({ preventScroll: true }); }, [selected]);
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (showRules || showComplete) return;
      if (/^[1-9]$/.test(event.key) && Number(event.key) <= size) { event.preventDefault(); enter(Number(event.key)); }
      else if (event.key === "Backspace" || event.key === "Delete") { event.preventDefault(); erase(); }
      else if (event.key === "ArrowUp") { event.preventDefault(); move(-1, 0); }
      else if (event.key === "ArrowDown") { event.preventDefault(); move(1, 0); }
      else if (event.key === "ArrowLeft") { event.preventDefault(); move(0, -1); }
      else if (event.key === "ArrowRight") { event.preventDefault(); move(0, 1); }
      else if (event.key === "Tab") { event.preventDefault(); setSelected(index => (index + (event.shiftKey ? -1 : 1) + size * size) % (size * size)); }
    };
    window.addEventListener("keydown", handler); return () => window.removeEventListener("keydown", handler);
  }, [enter, move, showRules, showComplete, size]);

  const erase = () => { if (!game || game.puzzle[selected] || (!game.values[selected] && !game.notes[selected].length)) return; commit(next => { next.values[selected] = 0; next.notes[selected] = []; next.hints[selected] = false; }, "Políčko je opäť prázdne."); };
  const undo = () => setGame(current => { if (!current?.history.length) return current; const previous = current.history.at(-1)!; return { ...current, ...previous, history: current.history.slice(0, -1), future: [snapshot(current), ...current.future] }; });
  const redo = () => setGame(current => { if (!current?.future.length) return current; const next = current.future[0]; return { ...current, ...next, history: [...current.history, snapshot(current)], future: current.future.slice(1) }; });
  const hint = () => { if (!game || !window.confirm("Chceš odhaliť jedno políčko?")) return; const candidates = game.values.map((v, i) => !game.puzzle[i] && v !== game.solution[i] ? i : -1).filter(i => i >= 0); const index = candidates[0]; if (index === undefined) return; commit(next => { next.values[index] = next.solution[index]; next.notes[index] = []; next.hints[index] = true; }, "Kryštál doplnil jedno políčko ako pomôcku."); setSelected(index); tone("hint"); };
  const startNew = () => { if (game && !window.confirm("Chceš začať novú mriežku? Aktuálny postup v tejto veľkosti sa nahradí.")) return; freshGame(); };
  const check = () => { if (!game) return; const wrong = new Set(game.values.map((v, i) => v && v !== game.solution[i] ? i : -1).filter(i => i >= 0)); setCheckedWrong(wrong); setMessage(wrong.size ? "Niektoré políčka si ešte môžeš prezrieť." : game.values.includes(0) ? "Zatiaľ je všetko v poriadku. Mriežka ešte nie je dokončená." : "Mriežka je dokončená."); };
  const conflicts = useMemo(() => game ? conflictsFor(game.values, size) : new Set<number>(), [game, size]);
  useEffect(() => { if (conflicts.size) setMessage("Toto číslo sa už v tejto časti nachádza."); }, [conflicts.size]);
  if (!game) return <main className="sudoku-page sudoku-loading"><div className="crystal-spinner">✦</div><p>Pripravujem kryštálovú mriežku…</p></main>;
  const completed = Array.from({ length: size }, (_, i) => i + 1).filter(n => game.values.filter(v => v === n).length === size);
  return <main className="sudoku-page game-mode"><header className="sudoku-top"><button onClick={onBack}>← <span>Späť do Chill zóny</span></button><b>Kryštálová mriežka</b><span>{SIZE_META[size].label}</span></header>
    <section className="sudoku-game"><div className="game-heading"><p className="sudoku-kicker">SUDOKU • {SIZE_META[size].mood.toUpperCase()}</p><h1>Kryštálová mriežka</h1><p className={conflicts.size ? "game-message warning" : "game-message"} role="status">{conflicts.size ? "⚠ " : "✦ "}{message}</p></div>
      <div className="grid-wrap"><SudokuGrid size={size} puzzle={game.puzzle} values={game.values} notes={game.notes} hints={game.hints} selected={selected} conflicts={conflicts} checkedWrong={checkedWrong} onSelect={setSelected} /></div>
      <aside className="sudoku-controls"><NumberPad size={size} onNumber={enter} completed={completed} /><Toolbar notesMode={notesMode} canUndo={!!game.history.length} canRedo={!!game.future.length} onNotes={() => setNotesMode(v => !v)} onErase={erase} onUndo={undo} onRedo={redo} onHint={hint} onNew={startNew} onRules={() => setShowRules(true)} onCheck={check} sound={sound} onSound={() => setSound(v => !v)} /></aside>
    </section>
    {showRules && <HowToPlay onClose={() => setShowRules(false)} />}
    {showComplete && <div className="sudoku-overlay" role="dialog" aria-modal="true"><section className="complete-card"><div className="complete-gem">✦</div><p className="sudoku-kicker">MRIEŽKA JE DOKONČENÁ</p><h2>Výborne, kryštálová mriežka zažiarila.</h2><p>Každé číslo si našlo svoje miesto.</p><button className="sudoku-primary" onClick={freshGame}>Nová mriežka</button><button onClick={onChooseSize}>Vybrať inú veľkosť</button><button onClick={onBack}>Späť do Chill zóny</button></section></div>}
  </main>;
}

function isPeer(a: number, b: number, size: SudokuSize) {
  const { blockRows, blockCols } = SIZE_META[size]; const ar = Math.floor(a / size), ac = a % size, br = Math.floor(b / size), bc = b % size;
  return ar === br || ac === bc || (Math.floor(ar / blockRows) === Math.floor(br / blockRows) && Math.floor(ac / blockCols) === Math.floor(bc / blockCols));
}
