"use client";

import React from "react";
import { Lumi } from "./Lumi";

export function ReactorGame({ onBack }: { onBack: () => void }) {
  return (
    <main className="avatar-select-screen">
      <div className="bunker-window" aria-hidden="true">
        <div className="bunker-window-planet" />
        <div className="bunker-window-stars" />
      </div>
      <div className="avatar-select-content">
        <p className="skola-kicker">GAMING ZÓNA</p>
        <h1>Oprav reaktor</h1>
        <p className="avatar-select-lead">Táto hra sa pripravuje...</p>
        <Lumi className="avatar-select-mascot" />
        <button className="button primary-button skola-back" onClick={onBack}>
          <span aria-hidden="true">←</span> Späť do Gaming zóny
        </button>
      </div>
    </main>
  );
}
