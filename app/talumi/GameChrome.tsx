"use client";

import React from "react";

export function SoundToggle({
  on,
  onClick,
  className = "",
}: {
  on: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      className={`game-chrome-sound ${className}`.trim()}
      onClick={onClick}
      aria-label={on ? "Vypnúť zvuk" : "Zapnúť zvuk"}
    >
      <span aria-hidden="true">{on ? "🔊" : "🔇"}</span>
    </button>
  );
}

export function GameTopBar({
  title,
  meta,
  onBack,
  onPause,
  paused,
  sound,
  onToggleSound,
}: {
  title: React.ReactNode;
  meta?: React.ReactNode;
  onBack: () => void;
  onPause?: () => void;
  paused?: boolean;
  sound?: boolean;
  onToggleSound?: () => void;
}) {
  return (
    <header className="game-chrome-top">
      <button className="game-chrome-circle" onClick={onBack} aria-label="Späť">
        <span aria-hidden="true">‹</span>
      </button>
      <div className="game-chrome-title">
        <span>{title}</span>
        {meta && <span className="game-chrome-title-meta">{meta}</span>}
      </div>
      {onToggleSound && <SoundToggle on={!!sound} onClick={onToggleSound} />}
      {onPause ? (
        <button className="game-chrome-circle" onClick={onPause} aria-label={paused ? "Pokračovať" : "Pauza"}>
          <span aria-hidden="true">{paused ? "▶" : "❚❚"}</span>
        </button>
      ) : (
        <span className="game-chrome-circle game-chrome-circle--ghost" aria-hidden="true" />
      )}
    </header>
  );
}

export function GameHintButton({ onClick, label = "Nápoveda" }: { onClick: () => void; label?: string }) {
  return (
    <button className="game-chrome-hint" onClick={onClick}>
      <span className="game-chrome-hint-icon" aria-hidden="true">💡</span>
      {label}
    </button>
  );
}

export function GamePauseOverlay({ onResume }: { onResume: () => void }) {
  return (
    <div className="game-chrome-pause-overlay" role="dialog" aria-modal="true">
      <div className="game-chrome-pause-card">
        <p className="game-chrome-pause-icon" aria-hidden="true">❚❚</p>
        <h2>Hra je pozastavená</h2>
        <button className="game-chrome-hint" onClick={onResume}>
          <span aria-hidden="true">▶</span> Pokračovať
        </button>
      </div>
    </div>
  );
}
