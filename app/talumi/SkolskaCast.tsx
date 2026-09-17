"use client";

import React from "react";
import { Lumi } from "./Lumi";

export function SkolskaCast({ onBack }: { onBack: () => void }) {
  return (
    <main className="avatar-select-screen">
      <div className="bunker-window" aria-hidden="true">
        <div className="bunker-window-planet" />
        <div className="bunker-window-stars" />
      </div>
      <div className="avatar-select-content">
        <p className="skola-kicker">ŠKOLSKÁ ČASŤ</p>
        <h1>Pripravuje sa</h1>
        <p className="avatar-select-lead">Mišo premýšľa...</p>
        <Lumi className="avatar-select-mascot" />
        <button className="button primary-button skola-back" onClick={onBack}>
          <span aria-hidden="true">←</span> Späť do bunkra
        </button>
      </div>
    </main>
  );
}
