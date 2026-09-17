"use client";

import React, { useState } from "react";
import { Lumi } from "./Lumi";
import type { AvatarId } from "./AvatarSelect";

type TabId = "outfity" | "hlava" | "okuliare" | "doplnky" | "obuv" | "specialne";

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "outfity", label: "Outfity", icon: "👕" },
  { id: "hlava", label: "Na hlavu", icon: "🧢" },
  { id: "okuliare", label: "Okuliare", icon: "🕶" },
  { id: "doplnky", label: "Doplnky", icon: "🎒" },
  { id: "obuv", label: "Obuv", icon: "👟" },
  { id: "specialne", label: "Špeciálne", icon: "⭐" },
];

const OUTFITS: Record<AvatarId, { id: string; label: string; colors: string }[]> = {
  chlapec: [
    { id: "galakticky", label: "Galaktický", colors: "linear-gradient(160deg,#8a6bff,#3a2a8f)" },
    { id: "dzunglovy", label: "Džungľový", colors: "linear-gradient(160deg,#7fe08a,#1f7a3f)" },
    { id: "pustny", label: "Púštny", colors: "linear-gradient(160deg,#ffcf8a,#c97a2b)" },
    { id: "polarny", label: "Polárny", colors: "linear-gradient(160deg,#bfefff,#4fa3d9)" },
    { id: "podmorsky", label: "Podmorský", colors: "linear-gradient(160deg,#6bd9ff,#1c5fa8)" },
    { id: "jaskynny", label: "Jaskynný", colors: "linear-gradient(160deg,#b79bff,#3a2a5c)" },
  ],
  dievca: [
    { id: "galakticka", label: "Galaktická", colors: "linear-gradient(160deg,#c79bff,#6a3fbf)" },
    { id: "dzunglova", label: "Džungľová", colors: "linear-gradient(160deg,#9be6a4,#2f8f52)" },
    { id: "pustna", label: "Púštna", colors: "linear-gradient(160deg,#ffdba6,#d68a3d)" },
    { id: "polarna", label: "Polárna", colors: "linear-gradient(160deg,#d3f4ff,#7cc3ea)" },
    { id: "podmorska", label: "Podmorská", colors: "linear-gradient(160deg,#9be9ff,#3a8fd0)" },
    { id: "jaskynna", label: "Jaskynná", colors: "linear-gradient(160deg,#d8c2ff,#6a4fa0)" },
  ],
};

const ACCESSORIES: Record<AvatarId, string[]> = {
  chlapec: ["Šiltovka", "Slúchadlá", "Ruksak", "Okuliare", "Hodinky", "Náhrdelník"],
  dievca: ["Šiltovka", "Mašľa", "Slúchadlá", "Ruksak", "Okuliare", "Hodinky", "Korunka"],
};

const SHOE_COLORS = ["#a78bfa", "#60d3ff", "#3ddc97", "#ffb454", "#ff7ab6", "#7c8cfb"];

const AVATAR_SRC: Record<AvatarId, string> = {
  dievca: "/avatar-dievca.png",
  chlapec: "/avatar-chlapec.png",
};

const SUBTITLE: Record<AvatarId, string> = {
  chlapec: "Vyber si svoj štýl a buď jedinečný!",
  dievca: "Vyber si svoj štýl a zaži nové dobrodružstvá!",
};

export function MojSatnik({ avatar, onBack }: { avatar: AvatarId; onBack: () => void }) {
  const [tab, setTab] = useState<TabId>("outfity");
  const [selectedOutfit, setSelectedOutfit] = useState(OUTFITS[avatar][0].id);

  return (
    <main className="satnik-screen">
      <div className="bunker-window" aria-hidden="true">
        <div className="bunker-window-planet" />
        <div className="bunker-window-stars" />
      </div>

      <header className="satnik-top">
        <button className="satnik-back" onClick={onBack} aria-label="Späť do bunkra">
          ←
        </button>
        <div className="satnik-heading">
          <h1>👔 Môj šatník</h1>
          <p>{SUBTITLE[avatar]}</p>
        </div>
        <div className="bunker-stats">
          <span className="bunker-stat"><i className="bunker-stat-icon coin">C</i>128</span>
          <span className="bunker-stat"><i className="bunker-stat-icon star">★</i>640</span>
          <span className="bunker-stat"><i className="bunker-stat-icon trophy">🏆</i>12</span>
        </div>
      </header>

      <div className="satnik-body">
        <nav className="satnik-tabs" aria-label="Kategórie šatníka">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`satnik-tab ${tab === t.id ? "active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              <span aria-hidden="true">{t.icon}</span> {t.label}
            </button>
          ))}
        </nav>

        <div className="satnik-content">
          <div className="satnik-preview">
            <img className="satnik-preview-avatar" src={AVATAR_SRC[avatar]} alt="" draggable={false} />
            <Lumi className="satnik-preview-mascot" />
          </div>

          {tab === "outfity" && (
            <section className="satnik-section">
              <div className="satnik-section-head">
                <h2>Outfity</h2>
                <span className="satnik-see-all">Zobraziť všetky ›</span>
              </div>
              <div className="satnik-outfit-grid">
                {OUTFITS[avatar].map((o) => (
                  <button
                    key={o.id}
                    className={`outfit-card ${selectedOutfit === o.id ? "selected" : ""}`}
                    style={{ background: o.colors }}
                    onClick={() => setSelectedOutfit(o.id)}
                  >
                    {selectedOutfit === o.id && <span className="outfit-check">✓</span>}
                    <span className="outfit-label">{o.label}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {tab === "doplnky" && (
            <section className="satnik-section">
              <div className="satnik-section-head">
                <h2>Doplnky</h2>
              </div>
              <div className="satnik-chip-grid">
                {ACCESSORIES[avatar].map((label) => (
                  <button key={label} className="chip-card" disabled>
                    <span className="chip-icon" aria-hidden="true">✦</span>
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {tab === "obuv" && (
            <section className="satnik-section">
              <div className="satnik-section-head">
                <h2>Obuv</h2>
              </div>
              <div className="satnik-chip-grid">
                {SHOE_COLORS.map((color, i) => (
                  <button key={i} className="chip-card shoe-chip" disabled>
                    <span className="chip-icon" style={{ background: color }} aria-hidden="true" />
                  </button>
                ))}
                <div className="chip-quote">
                  <span aria-hidden="true">♥</span> Malé detaily,<br />veľké príbehy
                </div>
              </div>
            </section>
          )}

          {(tab === "hlava" || tab === "okuliare" || tab === "specialne") && (
            <section className="satnik-section satnik-soon">
              <p>Táto kategória sa ešte pripravuje.</p>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
