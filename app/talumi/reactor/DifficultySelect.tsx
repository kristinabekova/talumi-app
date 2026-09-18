"use client";

import type { Difficulty } from "./types";

const REGIONS: {
  difficulty: Difficulty;
  poschodia: 3 | 4;
  title: string;
  detail: string;
  example: string;
  badge: string;
}[] = [
  {
    difficulty: 1,
    poschodia: 3,
    title: "Bez prechodu cez 10",
    detail: "Súčty dvoch susediacich čísel neprekročia 10, vrchol je max 20. Ideálne pre začiatočníkov (1. ročník).",
    example: "1 + 2 = 3 · 3 + 4 = 7",
    badge: "Výsledok do 20",
  },
  {
    difficulty: 2,
    poschodia: 3,
    title: "S prechodom cez 10",
    detail: "Súčty vyžadujú prechod cez desiatku. Vrchol pyramídy je v rozmedzí 11 až 20.",
    example: "7 + 5 = 12 · 8 + 9 = 17",
    badge: "Výsledok do 20",
  },
  {
    difficulty: 3,
    poschodia: 4,
    title: "Bez prechodu cez desiatky",
    detail: "Počítanie s desiatkami a dvojcifernými číslami bez prechodu cez základ. Vrchol pyramídy je maximálne 100.",
    example: "21 + 13 = 34 · 30 + 40 = 70",
    badge: "Výsledok do 100",
  },
  {
    difficulty: 4,
    poschodia: 4,
    title: "S prechodom cez desiatku",
    detail: "Komplexnejšie sčítanie s prechodom, vrchol pyramídy je maximálne 100. Plná výzva pre pokročilejších hráčov.",
    example: "38 + 27 = 65 · 46 + 49 = 95",
    badge: "Výsledok do 100",
  },
];

export function DifficultySelect({
  onBack,
  onSelect,
}: {
  onBack: () => void;
  onSelect: (difficulty: Difficulty) => void;
}) {
  return (
    <main className="reactor-screen">
      <header className="reactor-select-top">
        <button onClick={onBack} aria-label="Späť do Gaming zóny">
          ←
        </button>
        <b>Oprav reaktor</b>
        <span />
      </header>

      <section className="reactor-select-intro">
        <p className="reactor-select-kicker">VYBER SI OBLASŤ</p>
        <h1>Akú náročnosť zvládneš?</h1>
        <p>Vyber si oblasť a všetky príklady v hre budú presne z nej.</p>
      </section>

      <div className="reactor-region-list">
        {REGIONS.map((region) => (
          <article className="reactor-region-card" key={region.difficulty}>
            <div className="reactor-region-head">
              <span className="reactor-region-num">{region.difficulty}</span>
              <div>
                <small>OBLASŤ {region.difficulty} · {region.poschodia}-poschodová</small>
                <h3>{region.title}</h3>
              </div>
            </div>
            <p>{region.detail}</p>
            <div className="reactor-region-meta">
              <span className="reactor-region-example">{region.example}</span>
              <span className="reactor-region-badge">{region.badge}</span>
            </div>
            <button className="reactor-region-start" onClick={() => onSelect(region.difficulty)}>
              Vybrať
            </button>
          </article>
        ))}
      </div>
    </main>
  );
}
