"use client";

import React, { useEffect, useRef, useState } from "react";
import { GameHintButton, GamePauseOverlay, GameTopBar } from "../GameChrome";
import { useReactorGame } from "./useReactorGame";

export function ReactorGame({ onBack }: { onBack: () => void }) {
  const [paused, setPaused] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const game = useReactorGame(paused);
  const wasSolvedRef = useRef(false);
  const wrongSeenRef = useRef(false);

  const playTone = (kind: "good" | "bad") => {
    if (!soundOn) return;
    try {
      const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(kind === "good" ? 560 : 220, ctx.currentTime);
      if (kind === "good") osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.09, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch { /* zvuk je len doplnok */ }
  };

  useEffect(() => {
    if (game.solved && !wasSolvedRef.current) playTone("good");
    wasSolvedRef.current = game.solved;
  }, [game.solved]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const hasWrong = game.status.some((row) => row.some((s) => s === "wrong"));
    if (hasWrong && !wrongSeenRef.current) playTone("bad");
    wrongSeenRef.current = hasWrong;
  }, [game.status]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <main className="reactor-screen">
      <GameTopBar
        title="Oprav reaktor"
        meta={`Level ${game.level}`}
        onBack={onBack}
        onPause={() => setPaused(true)}
        sound={soundOn}
        onToggleSound={() => setSoundOn((v) => !v)}
      />

      <div className="reactor-stats">
        <span className="reactor-pill">✦ {game.puzzle.size}-poschodová</span>
        <span className="reactor-pill">Doplnené {game.progress.done}/{game.progress.total}</span>
        <span className="reactor-pill gold">C {game.coins}</span>
      </div>

      <p className="reactor-hint-text">
        Ťukni na prázdne políčko a doplň číslo tak, aby platilo: horné = súčet dvoch spodných.
      </p>

      <div className="reactor-pyramid">
        {Array.from({ length: game.puzzle.size }, (_, i) => game.puzzle.size - 1 - i).map((row) => (
          <div className="reactor-row" key={row}>
            {game.puzzle.values[row].map((_, col) => {
              const given = game.puzzle.given[row][col];
              const isSelected = game.selected?.row === row && game.selected?.col === col;
              const value = given
                ? game.puzzle.values[row][col]
                : isSelected
                ? (game.buffer === "" ? null : Number(game.buffer))
                : game.entered[row][col];
              const status = game.status[row][col];
              const classes = [
                "reactor-cell",
                given ? "given" : "editable",
                isSelected ? "selected" : "",
                status !== "idle" ? status : "",
              ].filter(Boolean).join(" ");
              return (
                <button
                  key={col}
                  className={classes}
                  disabled={given}
                  onClick={() => game.selectCell(row, col)}
                  aria-label={given ? `Predvyplnené číslo ${value}` : `Políčko, ${value !== null ? `zadané číslo ${value}` : "prázdne"}`}
                >
                  {value !== null ? value : ""}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="reactor-keypad">
        <div className="reactor-keypad-grid">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
            <button key={d} onClick={() => game.pressDigit(d)} disabled={!game.selected}>{d}</button>
          ))}
          <button onClick={game.pressClear} disabled={!game.selected} aria-label="Zmazať">✕</button>
          <button onClick={() => game.pressDigit(0)} disabled={!game.selected}>0</button>
          <button className="reactor-confirm" onClick={game.pressConfirm} disabled={!game.selected} aria-label="Potvrdiť">✓</button>
        </div>
      </div>

      <GameHintButton onClick={game.useHint} label="Nápoveda" />

      {game.solved && (
        <div className="reactor-success" role="status">
          <span className="reactor-success-crystal">✦</span>
          Skvelé! Reaktor svieti naplno.
        </div>
      )}

      {paused && <GamePauseOverlay onResume={() => setPaused(false)} />}
    </main>
  );
}
