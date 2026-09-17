"use client";

import React from "react";
import { Lumi } from "./Lumi";
import { TalumiLogo } from "./TalumiLogo";

export type AvatarId = "dievca" | "chlapec";

export function AvatarSelect({ onSelect }: { onSelect: (avatar: AvatarId) => void }) {
  return (
    <main className="avatar-select-screen">
      <div className="bunker-window" aria-hidden="true">
        <div className="bunker-window-planet" />
        <div className="bunker-window-stars" />
      </div>
      <div className="avatar-select-content">
        <TalumiLogo className="avatar-select-logo" />
        <h1>Kto ide objavovať?</h1>
        <p className="avatar-select-lead">Vyber si postavičku, s ktorou budeš objavovať matematiku.</p>
        <div className="avatar-options">
          <button className="avatar-option" onClick={() => onSelect("dievca")} aria-label="Vybrať dievča">
            <img src="/avatar-dievca.png" alt="" draggable={false} />
            <span>Dievča</span>
          </button>
          <button className="avatar-option" onClick={() => onSelect("chlapec")} aria-label="Vybrať chlapca">
            <img src="/avatar-chlapec.png" alt="" draggable={false} />
            <span>Chlapec</span>
          </button>
        </div>
        <Lumi className="avatar-select-mascot" />
      </div>
    </main>
  );
}
