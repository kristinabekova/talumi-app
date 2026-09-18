"use client";

import { useEffect, useState } from "react";
import SnakeGame from "./snake/SnakeGame";
import { MeteorGame } from "./talumi/MeteorGame";
import SudokuApp from "./sudoku/SudokuApp";
import NeonBubbles from "../components/NeonBubbles";
import NeonMaze from "../components/NeonMaze";
import { AvatarSelect, type AvatarId } from "./talumi/AvatarSelect";
import { Bunker } from "./talumi/Bunker";
import { SkolskaCast } from "./talumi/SkolskaCast";
import { MojSatnik } from "./talumi/MojSatnik";
import { ReactorGame } from "./talumi/ReactorGame";

const AVATAR_STORAGE_KEY = "talumi_avatar";

type AppView = "avatar" | "zones" | "games" | "meteor" | "snake" | "bubbles" | "reactor" | "chill" | "sudoku" | "maze" | "skola" | "satnik";

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

function GamesScreen({
  onBack,
  onMeteor,
  onSnake,
  onBubbles,
  onReactor,
}: {
  onBack: () => void;
  onMeteor: () => void;
  onSnake: () => void;
  onBubbles: () => void;
  onReactor: () => void;
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
            <img
              src="/talumi-neon-bubbles-card-bg.png"
              alt="Neónové bubliny"
              className="card-art"
            />
          </button>
          <button className="game-card reactor-card" onClick={onReactor} aria-label="Hrať Oprav reaktor">
            <span className="game-card-copy">
              <strong>Oprav reaktor</strong>
              <span>
                Nová hra<br />už čoskoro
              </span>
            </span>
          </button>
        </div>
      </section>
    </main>
  );
}

function ChillScreen({
  onBack,
  onSudoku,
  onMaze,
}: {
  onBack: () => void;
  onSudoku: () => void;
  onMaze: () => void;
}) {
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

          <button className="crystal-game-card maze-card" onClick={onMaze} aria-label="Hrať Svetelné labyrinty">
            <span className="crystal-copy">
              <small>Bludiská</small>
              <strong>
                Svetelné<br />labyrinty
              </strong>
              <em>Nájdi správnu cestu</em>
            </span>
            <img className="card-crystal-art" src="/talumi-maze-card.jpeg" alt="Svetelné labyrinty" />
          </button>
        </div>
      </section>
    </main>
  );
}

export default function Home() {
  const [view, setView] = useState<AppView>("avatar");
  const [avatar, setAvatar] = useState<AvatarId | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(AVATAR_STORAGE_KEY);
    if (stored === "dievca" || stored === "chlapec") {
      setAvatar(stored);
      setView("zones");
    }
  }, []);

  const selectAvatar = (chosen: AvatarId) => {
    window.localStorage.setItem(AVATAR_STORAGE_KEY, chosen);
    setAvatar(chosen);
    setView("zones");
  };

  const changeAvatar = () => {
    window.localStorage.removeItem(AVATAR_STORAGE_KEY);
    setAvatar(null);
    setView("avatar");
  };

  let content;

  if (view === "meteor") content = <MeteorGame onBack={() => setView("games")} />;
  else if (view === "snake") content = <SnakeGame onBack={() => setView("games")} />;
  else if (view === "bubbles") content = <NeonBubbles onBack={() => setView("games")} />;
  else if (view === "reactor") content = <ReactorGame onBack={() => setView("games")} />;
  else if (view === "sudoku") content = <SudokuApp onBack={() => setView("chill")} />;
  else if (view === "maze") content = <NeonMaze onBack={() => setView("chill")} />;
  else if (view === "skola") content = <SkolskaCast onBack={() => setView("zones")} />;
  else if (view === "satnik" && avatar) content = <MojSatnik avatar={avatar} onBack={() => setView("zones")} />;
  else if (view === "games")
    content = (
      <GamesScreen
        onBack={() => setView("zones")}
        onMeteor={() => setView("meteor")}
        onSnake={() => setView("snake")}
        onBubbles={() => setView("bubbles")}
        onReactor={() => setView("reactor")}
      />
    );
  else if (view === "chill")
    content = (
      <ChillScreen
        onBack={() => setView("zones")}
        onSudoku={() => setView("sudoku")}
        onMaze={() => setView("maze")}
      />
    );
  else if (view === "zones" && avatar)
    content = (
      <Bunker
        avatar={avatar}
        onGaming={() => setView("games")}
        onChill={() => setView("chill")}
        onSkola={() => setView("skola")}
        onSatnik={() => setView("satnik")}
        onChangeAvatar={changeAvatar}
      />
    );
  else content = <AvatarSelect onSelect={selectAvatar} />;

  return (
    <div className={`talumi-stage talumi-stage--${view}`}>
      {content}
      <DecorativePictograms view={view} />
    </div>
  );
}