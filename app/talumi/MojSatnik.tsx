"use client";

import React, { useState } from "react";
import type { AvatarId } from "./AvatarSelect";

const SATNIK_SCENE: Record<AvatarId, string> = {
  dievca: "/satnik-scene-dievca.png",
  chlapec: "/satnik-scene-chlapec.png",
};

// Reference frame: the actual pixel size of the scene PNGs. All row/cell
// geometry below is measured in this frame, then converted to percentages
// so it scales with the responsive layout.
const IMG_W = 941;
const IMG_H = 1672;

const OUTFIT_COUNT = 6;
const OUTFIT_ROW = { top: 0.5562, height: 0.1525 }; // fraction of IMG_H
const ACCESSORY_COUNT: Record<AvatarId, number> = { chlapec: 6, dievca: 7 };
const ACCESSORY_ROW = { top: 0.7327, height: 0.0777 };
const SHOE_COUNT = 6;
const SHOE_ROW = { top: 0.8284, height: 0.0837 };

// Box the "live preview" (swapped outfit) fills, below the header and
// above the outfit row.
const PREVIEW_BOX = { left: 20, top: 150, width: 901, height: 774.6 }; // px in reference frame
const PREVIEW_SCALE = PREVIEW_BOX.height / (IMG_H * OUTFIT_ROW.height);
const PREVIEW_IMG_WIDTH_PCT = (IMG_W * PREVIEW_SCALE) / PREVIEW_BOX.width * 100;
const PREVIEW_IMG_TOP_PCT = (-(IMG_H * OUTFIT_ROW.top) * PREVIEW_SCALE) / PREVIEW_BOX.height * 100;
const OUTFIT_CELL_W = IMG_W / OUTFIT_COUNT;
const PREVIEW_CENTER_OFFSET = (PREVIEW_BOX.width - OUTFIT_CELL_W * PREVIEW_SCALE) / 2;

function previewLeftPct(index: number) {
  const px = PREVIEW_CENTER_OFFSET - index * OUTFIT_CELL_W * PREVIEW_SCALE;
  return (px / PREVIEW_BOX.width) * 100;
}

function rowCellStyle(row: { top: number; height: number }, count: number, index: number): React.CSSProperties {
  return {
    left: `${(index / count) * 100}%`,
    top: `${row.top * 100}%`,
    width: `${(1 / count) * 100}%`,
    height: `${row.height * 100}%`,
  };
}

export function MojSatnik({ avatar, onBack }: { avatar: AvatarId; onBack: () => void }) {
  const [outfit, setOutfit] = useState<number | null>(null);
  const [accessory, setAccessory] = useState<number | null>(null);
  const [shoe, setShoe] = useState<number | null>(null);
  const accessoryCount = ACCESSORY_COUNT[avatar];
  const scene = SATNIK_SCENE[avatar];

  return (
    <main className="bunker-screen">
      <div className="bunker-scene">
        <img className="bunker-scene-bg" src={scene} alt="Môj šatník" draggable={false} />

        {outfit !== null && (
          <div
            className="satnik-preview-box"
            style={{
              left: `${(PREVIEW_BOX.left / IMG_W) * 100}%`,
              top: `${(PREVIEW_BOX.top / IMG_H) * 100}%`,
              width: `${(PREVIEW_BOX.width / IMG_W) * 100}%`,
              height: `${(PREVIEW_BOX.height / IMG_H) * 100}%`,
            }}
          >
            <img
              src={scene}
              alt=""
              aria-hidden="true"
              style={{
                position: "absolute",
                maxWidth: "none",
                width: `${PREVIEW_IMG_WIDTH_PCT}%`,
                left: `${previewLeftPct(outfit)}%`,
                top: `${PREVIEW_IMG_TOP_PCT}%`,
              }}
            />
          </div>
        )}

        <button className="bunker-hotspot hotspot-satnik-back" onClick={onBack} aria-label="Späť do bunkra" />

        {Array.from({ length: OUTFIT_COUNT }).map((_, i) => (
          <button
            key={`outfit-${i}`}
            className={`bunker-hotspot satnik-pick ${outfit === i ? "selected" : ""}`}
            style={rowCellStyle(OUTFIT_ROW, OUTFIT_COUNT, i)}
            onClick={() => setOutfit(i)}
            aria-label={`Outfit ${i + 1}`}
          />
        ))}

        {Array.from({ length: accessoryCount }).map((_, i) => (
          <button
            key={`accessory-${i}`}
            className={`bunker-hotspot satnik-pick ${accessory === i ? "selected" : ""}`}
            style={rowCellStyle(ACCESSORY_ROW, accessoryCount, i)}
            onClick={() => setAccessory(accessory === i ? null : i)}
            aria-label={`Doplnok ${i + 1}`}
          />
        ))}

        {Array.from({ length: SHOE_COUNT }).map((_, i) => (
          <button
            key={`shoe-${i}`}
            className={`bunker-hotspot satnik-pick ${shoe === i ? "selected" : ""}`}
            style={rowCellStyle(SHOE_ROW, SHOE_COUNT, i)}
            onClick={() => setShoe(shoe === i ? null : i)}
            aria-label={`Obuv ${i + 1}`}
          />
        ))}
      </div>
    </main>
  );
}
