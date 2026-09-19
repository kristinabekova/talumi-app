"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { GameTopBar } from "./GameChrome";

const WORLDS = [
  { id: 1, name: "Jaskynný svet" },
  { id: 2, name: "Džungľový svet" },
  { id: 3, name: "Podmorský svet" },
  { id: 4, name: "Polárny svet" },
  { id: 5, name: "Púštny svet" },
] as const;

const bgUrl = (id: number) => `/skola/svet-${id}.webp`;
const iconUrl = (id: number) => `/skola/ikona-${id}.webp`;

export function SkolskaCast({ onBack }: { onBack: () => void }) {
  const [world, setWorld] = useState<number>(1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ y: number; top: number } | null>(null);
  const current = WORLDS.find((w) => w.id === world) ?? WORLDS[0];

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  useEffect(() => { scrollToBottom(); }, [world, scrollToBottom]);

  useEffect(() => {
    for (const w of WORLDS) new Image().src = bgUrl(w.id);
  }, []);

  // Touch scrolling is native; this adds click-and-drag for a mouse.
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || !scrollRef.current) return;
    drag.current = { y: e.clientY, top: scrollRef.current.scrollTop };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current || !scrollRef.current) return;
    scrollRef.current.scrollTop = drag.current.top - (e.clientY - drag.current.y);
  };
  const endDrag = () => { drag.current = null; };

  return (
    <main className="skola-screen">
      <img key={`backdrop-${world}`} className="skola-backdrop" src={bgUrl(world)} alt="" aria-hidden="true" draggable={false} />

      <div
        className="skola-scroll"
        ref={scrollRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <img
          key={world}
          className="skola-bg"
          src={bgUrl(world)}
          alt={current.name}
          draggable={false}
          onLoad={scrollToBottom}
        />
      </div>

      <div className="skola-topbar">
        <GameTopBar title={current.name} onBack={onBack} />
      </div>

      <nav className="skola-worlds" aria-label="Výber sveta">
        {WORLDS.map((w) => (
          <button
            key={w.id}
            className={`skola-world${w.id === world ? " active" : ""}`}
            onClick={() => setWorld(w.id)}
            aria-label={w.name}
            aria-pressed={w.id === world}
          >
            <img src={iconUrl(w.id)} alt="" draggable={false} />
          </button>
        ))}
      </nav>
    </main>
  );
}
