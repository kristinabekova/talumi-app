"use client";

import { useRef } from "react";
import { DIFFICULTY_CONFIG, Difficulty } from "./math";
import { useSnakeGame } from "./useSnakeGame";
import { TalumiLogo } from "../talumi/TalumiLogo";
import { Gulko } from "../talumi/Gulko";

function Icon({ name }: { name: "play" | "info" | "sound" | "mute" | "pause" | "check" | "cross" | "home" }) {
  const paths = {
    play: <path d="M8 5l11 7-11 7z" />,
    info: <><circle cx="12" cy="12" r="9"/><path d="M12 10v7M12 7h.01"/></>,
    sound: <><path d="M5 10v4h4l5 4V6L9 10z"/><path d="M17 9c1.2 1.5 1.2 4.5 0 6M19.5 6.5c3 3 3 8 0 11"/></>,
    mute: <><path d="M5 10v4h4l5 4V6L9 10z"/><path d="M17 9l5 6M22 9l-5 6"/></>,
    pause: <><path d="M8 6v12M16 6v12"/></>,
    check: <path d="M5 12l4 4L19 6"/>,
    cross: <path d="M6 6l12 12M18 6L6 18"/>,
    home: <><path d="M4 11l8-7 8 7"/><path d="M7 10v10h10V10"/></>,
  };
  return <svg className="ui-icon" viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
}

function DifficultyPicker({ value, onChange }: { value: Difficulty; onChange: (value: Difficulty) => void }) {
  return <fieldset className="difficulty-picker"><legend>Vyber náročnosť</legend><div>
    {(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map((key) => <button type="button" aria-pressed={value === key} className={value === key ? "selected" : ""} onClick={() => onChange(key)} key={key}>
      <strong>{DIFFICULTY_CONFIG[key].label}</strong><small>{key === "easy" ? "1 – 20 · prechod cez okraj" : key === "medium" ? "1 – 50 · pevné steny" : "1 – 100 · rýchle tempo"}</small>
    </button>)}
  </div></fieldset>;
}

function IntroScreen({ difficulty, setDifficulty, start, rules }: { difficulty: Difficulty; setDifficulty: (value: Difficulty) => void; start: () => void; rules: () => void }) {
  return <main className="intro-screen">
    <section className="intro-copy">
      <TalumiLogo className="talumi-mark" />
      <p className="kicker">MATEMATICKÁ HRA</p>
      <h1>Energický had</h1>
      <p className="intro-lead">Veď hadíka k číslam, ktoré spĺňajú zadanie.</p>
      <DifficultyPicker value={difficulty} onChange={setDifficulty} />
      <div className="intro-actions"><button className="button primary-button" onClick={start}><Icon name="play"/> Spustiť hru</button><button className="button secondary-button" onClick={rules}><Icon name="info"/> Ako hrať</button></div>
    </section>
    <div className="intro-snake" aria-hidden="true"><i/><i/><i/><b><span/><span/></b></div>
  </main>;
}

function RulesScreen({ close }: { close: () => void }) {
  return <div className="modal-layer" role="dialog" aria-modal="true" aria-labelledby="rules-title"><section className="rules-card">
    <p className="kicker">PRAVIDLÁ</p><h2 id="rules-title">Ako hrať</h2>
    <p>Ovládaj hadíka a zbieraj iba čísla, ktoré spĺňajú zadanie. Nezjedené guličky zostávajú rovnaké; nová nahradí iba tú, ktorú hadík zjedol.</p>
    <div className="answer-examples"><div className="answer-good"><Icon name="check"/><span><strong>Správne číslo</strong>+10 bodov a dlhší hadík</span></div><div className="answer-bad"><Icon name="cross"/><span><strong>Nesprávne číslo</strong>−1 život</span></div></div>
    <div className="rule-summary"><p><b>5 správnych</b><span>= dokončený level a nové zadanie</span></p><p><b>3 stratené životy</b><span>= koniec hry</span></p><p><b>Náraz</b><span>do tela alebo steny na strednej a ťažkej = koniec</span></p></div>
    <div className="control-help"><b>Počítač</b><span>Šípky alebo W A S D</span><b>Mobil</b><span>Potiahni prstom alebo ťukni na hraciu plochu</span></div>
    <button className="button primary-button" onClick={close}>Rozumiem</button>
  </section></div>;
}

function GameBoard({ game }: { game: ReturnType<typeof useSnakeGame> }) {
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const onPointerDown = (event: React.PointerEvent) => { swipeStart.current = { x: event.clientX, y: event.clientY }; };
  const onPointerUp = (event: React.PointerEvent) => {
    if (!swipeStart.current) return;
    const dx = event.clientX - swipeStart.current.x;
    const dy = event.clientY - swipeStart.current.y;
    swipeStart.current = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) >= 18) {
      game.setDirection(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up"));
      return;
    }
    const board = event.currentTarget.getBoundingClientRect();
    const headX = (game.snake[0].x + .5) / 18 * board.width;
    const headY = (game.snake[0].y + .5) / 18 * board.height;
    const tapX = event.clientX - board.left - headX;
    const tapY = event.clientY - board.top - headY;
    game.setDirection(Math.abs(tapX) > Math.abs(tapY) ? (tapX > 0 ? "right" : "left") : (tapY > 0 ? "down" : "up"));
  };
  return <div className="board-shell">
    <div className={`snake-board ${game.phase === "playing" && !game.teleporting ? "is-moving" : ""}`} style={{ "--move-ms": `${Math.max(80, game.moveMs - 24)}ms` } as React.CSSProperties} onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerCancel={() => { swipeStart.current = null; }} aria-label="Herná plocha. Kliknutím, dotykom alebo potiahnutím zmeníš smer hada.">
      {game.orbs.map((orb) => <div className="number-orb" key={orb.id} style={{ "--x": orb.x, "--y": orb.y, "--orb-color": orb.color, "--text-color": orb.textColor } as React.CSSProperties}><span>{orb.value}</span></div>)}
      {game.snake.map((cell, index) => <div className={index === 0 ? "snake-cell snake-head" : "snake-cell"} key={index} style={{ "--x": cell.x, "--y": cell.y } as React.CSSProperties}>{index === 0 && <span className="snake-face"><i/><i/></span>}</div>)}
      {game.feedback && <div className={`game-feedback ${game.feedback.kind}`}>{game.feedback.text}</div>}
    </div>
  </div>;
}

function GameScreen({ game }: { game: ReturnType<typeof useSnakeGame> }) {
  return <main className="game-screen">
    <section className="game-stats" aria-label="Priebeh hry">
      <div><small>Skóre</small><b>{game.score}</b></div><div><small>Rekord</small><b>{game.highScore}</b></div><div><small>Životy</small><b className="lives" aria-label={`${game.lives} životy`}>{Array.from({ length: 3 }, (_, index) => <i className={index < game.lives ? "full" : ""} key={index}/>)}</b></div><div><small>Úroveň</small><b>{game.level}</b></div>
    </section>
    <GameBoard game={game}/>
    <Gulko className="snake-gulko" celebrating={game.gulkoCelebrating} />
    <section className="challenge-panel" aria-live="polite"><small>AKTUÁLNE ZADANIE</small><h1>{game.challenge.label}</h1><div className="level-progress"><span>Postup levelu</span><b>{game.roundCorrect} / {game.roundTarget} správnych</b><div aria-hidden="true"><i style={{ width: `${game.roundCorrect / game.roundTarget * 100}%` }}/></div><small>Ešte {game.roundTarget - game.roundCorrect} správne</small></div><p className="game-rule-summary">+10 bodov za správnu · nesprávna = −1 život · 0 životov = koniec</p></section>
  </main>;
}

function PauseScreen({ resume, exit }: { resume: () => void; exit: () => void }) {
  return <div className="modal-layer" role="dialog" aria-modal="true"><section className="small-modal"><Icon name="pause"/><h2>Hra je pozastavená</h2><button className="button primary-button" onClick={resume}>Pokračovať</button><button className="button secondary-button" onClick={exit}>Ukončiť hru</button></section></div>;
}

function GameOverScreen({ game, onBack }: { game: ReturnType<typeof useSnakeGame>; onBack: () => void }) {
  const reason = game.gameOverReason === "lives" ? "Minuli sa ti všetky 3 životy." : game.gameOverReason === "body" ? "Hadík narazil do vlastného tela." : "Hadík narazil do steny.";
  return <div className="modal-layer" role="dialog" aria-modal="true"><section className="result-card"><p className="kicker">VÝSLEDOK</p><h2>Koniec hry</h2><p className="game-over-reason">{reason}</p><div className="result-score"><span>Skóre</span><b>{game.score}</b></div><div className="result-grid"><div><span>Najvyššie skóre</span><b>{game.highScore}</b></div><div><span>Úroveň</span><b>{game.level}</b></div><div><span>Správne odpovede</span><b>{game.totalCorrect}</b></div></div><button className="button primary-button" onClick={game.startGame}>Hrať znova</button><button className="button secondary-button" onClick={onBack}><Icon name="home"/> Späť na výber hier</button></section></div>;
}

export default function SnakeGame({ onBack }: { onBack?: () => void }) {
  const game = useSnakeGame();
  const backToGames = onBack ?? game.exitGame;
  const inGame = ["playing", "paused", "hit", "levelup"].includes(game.phase);
  return <div className="talumi-app">
    <header className="app-header"><button className="brand-button" onClick={backToGames} aria-label="Talumi – späť na výber hier"><TalumiLogo /></button><nav><button onClick={backToGames}>Hry</button><button onClick={game.openRules}>Ako hrať</button></nav>{inGame ? <div className="header-actions"><button onClick={game.openRules} aria-label="Otvoriť pravidlá"><Icon name="info"/></button><button onClick={() => game.setSoundOn(!game.soundOn)} aria-label={game.soundOn ? "Vypnúť zvuk" : "Zapnúť zvuk"}><Icon name={game.soundOn ? "sound" : "mute"}/></button><button onClick={game.pause} aria-label="Pozastaviť hru"><Icon name="pause"/></button></div> : <span className="header-label">Energický had</span>}</header>
    {game.phase === "intro" && <IntroScreen difficulty={game.difficulty} setDifficulty={game.setDifficulty} start={game.startGame} rules={game.openRules}/>} 
    {game.phase !== "intro" && game.phase !== "rules" && game.phase !== "gameover" && <GameScreen game={game}/>} 
    {game.phase === "rules" && <RulesScreen close={game.closeRules}/>}
    {game.phase === "paused" && <PauseScreen resume={game.resume} exit={game.exitGame}/>}
    {game.phase === "gameover" && <GameOverScreen game={game} onBack={backToGames}/>}
  </div>;
}
