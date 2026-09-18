"use client";

import React from "react";
import type { AvatarId } from "./AvatarSelect";

const SATNIK_SCENE: Record<AvatarId, string> = {
  dievca: "/satnik-scene-dievca.png",
  chlapec: "/satnik-scene-chlapec.png",
};

export function MojSatnik({ avatar, onBack }: { avatar: AvatarId; onBack: () => void }) {
  return (
    <main className="bunker-screen">
      <div className="bunker-scene">
        <img className="bunker-scene-bg" src={SATNIK_SCENE[avatar]} alt="Môj šatník" draggable={false} />

        <button className="bunker-hotspot hotspot-satnik-back" onClick={onBack} aria-label="Späť do bunkra" />
      </div>
    </main>
  );
}
