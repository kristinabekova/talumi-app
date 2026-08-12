"use client";

import { useState } from "react";
import SnakeGame from "./snake/SnakeGame";
import { MeteorGame } from "./talumi/MeteorGame";
import { Gulko } from "./talumi/Gulko";
import SudokuApp from "./sudoku/SudokuApp";
import NeonBubbles from "../components/NeonBubbles";

type AppView = "zones" | "games" | "meteor" | "snake" | "bubbles" | "chill" | "sudoku";

function DecorativePictograms({ view }: { view: AppView }) {
  const icons = ["spark", "ring", "eye", "puzzle", "star"];
  return (
    <div className={`talumi-pictograms talumi-pictograms--${view}`} aria-hidden="true">
      {icons.map((icon, index) => (
        <img
          key={icon}
          className={`talumi-pictogram pictogram-${index + 1}`}
          src={`/talumi-decor/${icon}.png`}
          alt=""
        />
      ))}
    </div>
  );
}

function ZoneScreen({ onGaming, onChill }: { onGaming: () => void; onChill: () => void }) {
  return (
    <main className="zone-screen">
      <header className="zone-top">
        <span aria-hidden="true" />
        <h1>Vyber si zónu</h1>
        <div className="zone-coins">
          <span>C</span>
          <b>120</b>
        </div>
      </header>
      <section className="zone-content">
        <h2>Kam chceš ísť?</h2>
        <p>
          Vyber si zónu a pokračuj
          <br />v matematickom dobrodružstve.
        </p>
        <button className="zone-card gaming" onClick={onGaming}>
          <div>
            <strong>Gaming zóna</strong>
            <span>Hraj sa s číslami</span>
          </div>
        </button>
        <button className="zone-card chill" onClick={onChill}>
          <div>
            <strong>Chill zóna</strong>
            <span>
              Oddýchni si<br />s matematikou
            </span>
          </div>
        </button>
        <Gulko className="zone-mascot" />
      </section>
      <nav className="bottom-nav" aria-label="Hlavná navigácia">
        <button className="active" aria-label="Domov">
          ⌂
        </button>
        <button onClick={onGaming} aria-label="Gaming zóna">
          ♜
        </button>
        <button onClick={onChill} aria-label="Chill zóna">
          ◎
        </button>
      </nav>
    </main>
  );
}

function GamesScreen({
  onBack,
  onMeteor,
  onSnake,
  onBubbles,
}: {
  onBack: () => void;
  onMeteor: () => void;
  onSnake: () => void;
  onBubbles: () => void;
}) {
  return (
    <main className="games-screen">
      <header className="zone-top">
        <button onClick={onBack} aria-label="Späť na výber zón">
          ←
        </button>
        <h1>Gaming zóna</h1>
        <div className="zone-coins">
          <span>C</span>
          <b>120</b>
        </div>
      </header>
      <section className="games-content">
        <p className="games-kicker">VYBER SI HRU</p>
        <h2>Poď trénovať matematiku!</h2>
        <p>Krátke hry, veľa energie a čísla, ktoré si zapamätáš.</p>
        <div className="game-cards">
          <button className="game-card meteor-card" onClick={onMeteor} aria-label="Hrať Meteorický dážď">
            <span className="game-card-copy">
              <strong>Meteorický dážď</strong>
              <span>
                Rozbíjaj meteory<br />výsledkami
              </span>
            </span>
          </button>
          <button className="game-card snake-card" onClick={onSnake} aria-label="Hrať Energický had">
            <span className="game-card-copy">
              <strong>Energický had</strong>
              <span>Zbieraj čísla v sekvencii</span>
            </span>
          </button>
          <button className="game-card bubbles-card" onClick={onBubbles} aria-label="Hrať Neónové bubliny">
            <span className="game-card-copy">
              <strong>Neónové bubliny</strong>
              <span>Priraď správny výsledok</span>
            </span>
          </button>
        </div>
      </section>
    </main>
  );
}

function ChillScreen({ onBack, onSudoku }: { onBack: () => void; onSudoku: () => void }) {
  return (
    <main className="games-screen chill-games">
      <header className="zone-top">
        <button onClick={onBack} aria-label="Späť na výber zón">
          ←
        </button>
        <h1>Chill zóna</h1>
        <div className="zone-coins">
          <span>C</span>
          <b>120</b>
        </div>
      </header>
      <section className="games-content">
        <p className="games-kicker">VYBER SI HRU</p>
        <h2>Oddýchni si s matematikou</h2>
        <p>Pokojné hry bez času, bodov a porovnávania.</p>
        <div className="chill-cards">
          <button className="crystal-game-card" onClick={onSudoku} aria-label="Hrať Sudoku Kryštálová mriežka">
            <span className="crystal-copy">
              <small>Sudoku</small>
              <strong>
                Kryštálová<br />mriežka
              </strong>
              <em>4×4 • 6×6 • 9×9</em>
            </span>
            <img className="card-crystal-art" src="/talumi-crystal-grid-visual.png" alt="" aria-hidden="true" />
          </button>
        </div>
      </section>
    </main>
  );
}

export default function Home() {
  const [view, setView] = useState<AppView>("zones");
  let content;

  if (view === "meteor") content = <MeteorGame onBack={() => setView("games")} />;
  else if (view === "snake") content = <SnakeGame onBack={() => setView("games")} />;
  else if (view === "bubbles") content = <NeonBubbles onBack={() => setView("games")} />;
  else if (view === "sudoku") content = <SudokuApp onBack={() => setView("chill")} />;
  else if (view === "games")
    content = (
      <GamesScreen
        onBack={() => setView("zones")}
        onMeteor={() => setView("meteor")}
        onSnake={() => setView("snake")}
        onBubbles={() => setView("bubbles")}
      />
    );
  else if (view === "chill") content = <ChillScreen onBack={() => setView("zones")} onSudoku={() => setView("sudoku")} />;
  else content = <ZoneScreen onGaming={() => setView("games")} onChill={() => setView("chill")} />;

  return (
    <div className={`talumi-stage talumi-stage--${view}`}>
      {content}
      <DecorativePictograms view={view} />
    </div>
  );
}