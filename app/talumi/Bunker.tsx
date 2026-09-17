"use client";

import React from "react";
import type { AvatarId } from "./AvatarSelect";

const BUNKER_SCENE: Record<AvatarId, string> = {
  dievca: "/bunker-scene-dievca.png",
  chlapec: "/bunker-scene-chlapec.png",
};

export function Bunker({
  avatar,
  onGaming,
  onChill,
  onSkola,
  onChangeAvatar,
}: {
  avatar: AvatarId;
  onGaming: () => void;
  onChill: () => void;
  onSkola: () => void;
  onChangeAvatar: () => void;
}) {
  return (
    <main className="bunker-screen">
      <div className="bunker-scene">
        <img className="bunker-scene-bg" src={BUNKER_SCENE[avatar]} alt="Môj bunker" draggable={false} />

        <button className="bunker-hotspot hotspot-chill" onClick={onChill} aria-label="Chill zóna" />

        <button className="bunker-hotspot hotspot-school" onClick={onSkola} aria-label="Školská časť" />

        <button className="bunker-hotspot hotspot-math" onClick={onGaming} aria-label="Matematické hry" />

        <button className="bunker-hotspot hotspot-wardrobe" disabled aria-disabled="true" aria-label="Môj šatník – čoskoro">
          <span className="soon-badge">čoskoro</span>
        </button>

        <button className="bunker-hotspot hotspot-back" onClick={onChangeAvatar} aria-label="Späť do sveta" />
      </div>
    </main>
  );
}
