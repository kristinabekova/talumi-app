"use client";

import React, { useEffect, useRef, useState } from "react";
import { GameHintButton, GamePauseOverlay, GameTopBar } from "../GameChrome";
import { frameUrl, REACTOR_COLORS, REACTOR_LAYOUTS, type Rect } from "./layout";
import { SERIES_LENGTH, useReactorGame } from "./useReactorGame";
import type { Difficulty } from "./types";

type Tone = "good" | "bad" | "release";

function rectStyle(r: Rect, grow = 0): React.CSSProperties {
  return {
    left: `${r.left - grow}%`,
    top: `${r.top - grow}%`,
    width: `${r.width + grow * 2}%`,
    height: `${r.height + grow * 2}%`,
  };
}

export function ReactorGame({ difficulty, onBack }: { difficulty: Difficulty; onBack: () => void }) {
  const [paused, setPaused] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const game = useReactorGame(paused, difficulty);
  const wasSolvedRef = useRef(false);
  const wasReleasingRef = useRef(false);
  const wrongSeenRef = useRef(false);

  const size = game.puzzle.size;
  const layout = REACTOR_LAYOUTS[size];
  // 0..3 while playing a series, jumps to 4 (full) the moment the level is solved.
  const charge = ((game.level - 1) % SERIES_LENGTH) + (game.solved ? 1 : 0);

  const playTone = (kind: Tone) => {
    if (!soundOn) return;
    try {
      const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const notes = kind === "release" ? [440, 554, 659, 880, 1108] : kind === "good" ? [560, 880] : [220];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t0 = ctx.currentTime + i * (kind === "release" ? 0.16 : 0.1);
        osc.type = kind === "bad" ? "triangle" : "sine";
        osc.frequency.setValueAtTime(freq, t0);
        gain.gain.setValueAtTime(0.09, t0);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + (kind === "release" ? 0.5 : 0.25));
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t0);
        osc.stop(t0 + (kind === "release" ? 0.5 : 0.25));
      });
    } catch { /* zvuk je len doplnok */ }
  };

  useEffect(() => {
    if (game.solved && !wasSolvedRef.current && !game.releasing) playTone("good");
    wasSolvedRef.current = game.solved;
  }, [game.solved]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (game.releasing && !wasReleasingRef.current) playTone("release");
    wasReleasingRef.current = game.releasing;
  }, [game.releasing]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const hasWrong = game.status.some((row) => row.some((s) => s === "wrong"));
    if (hasWrong && !wrongSeenRef.current) playTone("bad");
    wrongSeenRef.current = hasWrong;
  }, [game.status]); // eslint-disable-line react-hooks/exhaustive-deps

  // Warm the cache so the reactor never flashes empty when its colour changes.
  useEffect(() => {
    for (const s of [3, 4] as const) {
      for (const c of REACTOR_COLORS) new Image().src = frameUrl(s, c);
    }
  }, []);

  const cellHeightCqw = (layout.bands[0][0].height / 100 / layout.aspect) * 100;

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

      <div
        className={`reactor-stage${game.releasing ? " is-releasing" : ""}${game.solved ? " is-solved" : ""}`}
        data-color={game.color}
        data-size={size}
        style={{
          aspectRatio: layout.aspect,
          ["--charge" as string]: charge,
          ["--cell-font" as string]: `${cellHeightCqw * 0.5}cqw`,
        }}
      >
        <img
          key={`${size}-${game.color}`}
          className="reactor-art"
          src={frameUrl(size, game.color)}
          alt=""
          draggable={false}
        />

        <div className="reactor-crystal-dim" style={rectStyle(layout.crystal)} aria-hidden="true" />
        <div className="reactor-crystal-glow" style={rectStyle(layout.crystal)} aria-hidden="true" />

        {game.releasing && (
          <div className="reactor-release" style={rectStyle(layout.crystal)} aria-hidden="true">
            <span className="ring r1" />
            <span className="ring r2" />
            <span className="ring r3" />
            <span className="rays" />
            <span className="flash" />
          </div>
        )}

        {layout.bands.map((cells, band) => {
          const row = size - 1 - band;
          return cells.map((rect, col) => {
            const given = game.puzzle.given[row][col];
            const isSelected = game.selected?.row === row && game.selected?.col === col;
            const value = given
              ? game.puzzle.values[row][col]
              : isSelected
              ? (game.buffer === "" ? null : Number(game.buffer))
              : game.entered[row][col];
            const status = game.status[row][col];
            const classes = [
              "reactor-slot",
              given ? "given" : "editable",
              isSelected ? "selected" : "",
              status !== "idle" ? status : "",
            ].filter(Boolean).join(" ");
            return (
              <button
                key={`${row}-${col}`}
                className={classes}
                style={rectStyle(rect)}
                disabled={given}
                onClick={() => game.selectCell(row, col)}
                aria-label={given ? `Predvyplnené číslo ${value}` : `Políčko, ${value !== null ? `zadané číslo ${value}` : "prázdne"}`}
              >
                {value !== null ? value : ""}
              </button>
            );
          });
        })}

        {layout.digits.map((rect, i) => (
          <button
            key={i}
            className="reactor-key"
            style={rectStyle(rect, 0.5)}
            onClick={() => game.pressDigit(i + 1)}
            disabled={!game.selected}
            aria-label={String(i + 1)}
          />
        ))}
        <button className="reactor-key" style={rectStyle(layout.clear, 0.5)} onClick={game.pressClear} disabled={!game.selected} aria-label="Zmazať" />
        <button className="reactor-key" style={rectStyle(layout.zero, 0.5)} onClick={() => game.pressDigit(0)} disabled={!game.selected} aria-label="0" />
        <button className="reactor-key" style={rectStyle(layout.confirm, 0.5)} onClick={game.pressConfirm} disabled={!game.selected} aria-label="Potvrdiť" />
      </div>

      <GameHintButton onClick={game.useHint} label="Nápoveda" />

      {game.solved && (
        <div className="reactor-success" role="status">
          <span className="reactor-success-crystal">✦</span>
          {game.releasing ? "Kryštál je plný! Reaktor vypúšťa energiu." : "Skvelé! Reaktor svieti naplno."}
        </div>
      )}

      {paused && <GamePauseOverlay onResume={() => setPaused(false)} />}
    </main>
  );
}
