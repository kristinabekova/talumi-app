"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Gulko } from "./Gulko";

type Problem = { a: number; b: number; op: "+" | "−"; answer: number; options: number[] };
type GameState = "intro" | "countdown" | "playing" | "paused" | "finished";
type Feedback = { kind: "correct" | "wrong" | "missed"; text: string; answer?: number } | null;
const ROUND_SECONDS = 45;
const INITIAL_PROBLEM: Problem = { a: 7, b: 6, op: "+", answer: 13, options: [11, 13, 14] };

function shuffle<T>(items: T[]) { return [...items].sort(() => Math.random() - 0.5); }
function makeProblem(): Problem {
  const isAddition = Math.random() > 0.35;
  let a = Math.floor(Math.random() * 10) + 3;
  let b = Math.floor(Math.random() * 9) + 2;
  if (!isAddition && b > a) [a, b] = [b, a];
  const answer = isAddition ? a + b : a - b;
  const distractors = new Set<number>();
  while (distractors.size < 2) {
    const delta = Math.floor(Math.random() * 7) - 3;
    const candidate = Math.max(0, answer + (delta === 0 ? 4 : delta));
    if (candidate !== answer) distractors.add(candidate);
  }
  return { a, b, op: isAddition ? "+" : "−", answer, options: shuffle([answer, ...distractors]) };
}
function Icon({ children }: { children: React.ReactNode }) { return <span className="icon" aria-hidden="true">{children}</span>; }

export function MeteorGame({ onBack }: { onBack: () => void }) {
  const [gameState, setGameState] = useState<GameState>("intro");
  const [problem, setProblem] = useState<Problem>(INITIAL_PROBLEM);
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [countdown, setCountdown] = useState(3);
  const [progress, setProgress] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [attempted, setAttempted] = useState(0);
  const [coins, setCoins] = useState(120);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [gulkoCelebrating, setGulkoCelebrating] = useState(false);
  const [locked, setLocked] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [soundOn, setSoundOn] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const frameRef = useRef<number | null>(null);
  const celebrationTimerRef = useRef<number | null>(null);
  const lastRef = useRef(0);
  const progressRef = useRef(0);
  const stateRef = useRef<GameState>(gameState);
  const speedLevel = Math.min(4, 1 + Math.floor(correct / 3));
  const fallSeconds = [0, 7.2, 6.1, 5.2, 4.5][speedLevel];
  const accuracy = attempted ? Math.round((correct / attempted) * 100) : 0;

  useEffect(() => { stateRef.current = gameState; }, [gameState]);
  useEffect(() => { progressRef.current = progress; }, [progress]);
  useEffect(() => () => { if (celebrationTimerRef.current) window.clearTimeout(celebrationTimerRef.current); }, []);

  const playTone = useCallback((good: boolean) => {
    if (!soundOn || typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx(); const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.type = "sine"; osc.frequency.setValueAtTime(good ? 520 : 230, ctx.currentTime);
      if (good) osc.frequency.exponentialRampToValueAtTime(760, ctx.currentTime + 0.13);
      gain.gain.setValueAtTime(0.08, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.connect(gain); gain.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + 0.2);
    } catch { /* Zvuk je voliteľný. */ }
  }, [soundOn]);

  const nextProblem = useCallback(() => {
    setProblem(makeProblem()); setProgress(0); progressRef.current = 0; setFeedback(null); setSelected(null); setLocked(false); lastRef.current = performance.now();
  }, []);
  const handleMiss = useCallback(() => {
    if (locked || stateRef.current !== "playing") return;
    setLocked(true); setAttempted((v) => v + 1); setStreak(0); setGulkoCelebrating(false); setFeedback({ kind: "missed", text: "Nevadí, nabudúce to stihneš!", answer: problem.answer }); playTone(false);
    window.setTimeout(nextProblem, 1300);
  }, [locked, nextProblem, playTone, problem.answer]);

  useEffect(() => {
    if (gameState !== "playing" || locked) return;
    const animate = (now: number) => {
      if (!lastRef.current) lastRef.current = now;
      const next = progressRef.current + (now - lastRef.current) / (fallSeconds * 1000); lastRef.current = now;
      if (next >= 1) { setProgress(1); progressRef.current = 1; handleMiss(); return; }
      setProgress(next); progressRef.current = next; frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [fallSeconds, gameState, handleMiss, locked, problem]);

  useEffect(() => {
    if (gameState !== "playing") return;
    const timer = window.setInterval(() => setTimeLeft((t) => { if (t <= 1) { setGameState("finished"); return 0; } return t - 1; }), 1000);
    return () => clearInterval(timer);
  }, [gameState]);
  useEffect(() => {
    if (gameState !== "countdown") return;
    if (countdown === 0) { const id = window.setTimeout(() => { setGameState("playing"); lastRef.current = performance.now(); }, 450); return () => clearTimeout(id); }
    const id = window.setTimeout(() => setCountdown((v) => v - 1), 700); return () => clearTimeout(id);
  }, [countdown, gameState]);

  const startGame = useCallback(() => {
    if (celebrationTimerRef.current) window.clearTimeout(celebrationTimerRef.current);
    setGulkoCelebrating(false);
    setTimeLeft(ROUND_SECONDS); setCorrect(0); setAttempted(0); setStreak(0); setBestStreak(0); setProgress(0); progressRef.current = 0;
    setFeedback(null); setLocked(false); setSelected(null); setProblem(makeProblem()); setCountdown(3); setGameState("countdown");
  }, []);
  const choose = useCallback((value: number) => {
    if (gameState !== "playing" || locked) return;
    setSelected(value); setLocked(true); setAttempted((v) => v + 1);
    if (value === problem.answer) {
      const nextStreak = streak + 1; setCorrect((v) => v + 1); setStreak(nextStreak); setBestStreak((v) => Math.max(v, nextStreak));
      if (nextStreak % 3 === 0) {
        setCoins((v) => v + 1);
        setGulkoCelebrating(true);
        if (celebrationTimerRef.current) window.clearTimeout(celebrationTimerRef.current);
        celebrationTimerRef.current = window.setTimeout(() => setGulkoCelebrating(false), 1800);
      }
      setFeedback({ kind: "correct", text: nextStreak >= 3 ? `Skvelá séria ×${nextStreak}!` : "Výborne!" }); playTone(true);
    } else { setStreak(0); setGulkoCelebrating(false); setFeedback({ kind: "wrong", text: "Takmer! Správny výsledok je", answer: problem.answer }); playTone(false); }
    window.setTimeout(nextProblem, value === problem.answer ? 800 : 1350);
  }, [gameState, locked, nextProblem, playTone, problem.answer, streak]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === " " && (gameState === "playing" || gameState === "paused")) { event.preventDefault(); setGameState((s) => s === "playing" ? "paused" : "playing"); lastRef.current = performance.now(); }
      const index = Number(event.key) - 1; if (index >= 0 && index < 3) choose(problem.options[index]);
    };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, [choose, gameState, problem.options]);
  const dropStyle = useMemo(() => ({ "--fall": `${Math.min(progress, 1) * 100}%` } as React.CSSProperties), [progress]);

  return <main className={`app meteor-app ${reducedMotion ? "reduce-motion" : ""}`}>
    <header className="topbar"><button className="back" onClick={onBack} aria-label="Späť do Gaming zóny"><span>←</span> Gaming zóna</button><h1>Meteorický dážď</h1><div className="hud"><div className="hud-pill"><Icon>◷</Icon><strong>00:{String(timeLeft).padStart(2, "0")}</strong></div><div className="hud-pill"><Icon>◆</Icon><strong>Séria {streak}</strong></div><div className="hud-pill"><span className="coin">C</span><strong>{coins}</strong></div><button className="round-button" onClick={() => { if (gameState === "playing") setGameState("paused"); else if (gameState === "paused") { lastRef.current = performance.now(); setGameState("playing"); } }} aria-label={gameState === "paused" ? "Pokračovať" : "Pozastaviť"}>{gameState === "paused" ? "▶" : "Ⅱ"}</button></div></header>
    <aside className="sidebar"><p className="eyebrow">HLAVNÉ MENU</p><button onClick={onBack}><Icon>⌂</Icon> Domov</button><button className="active"><Icon>ϟ</Icon> Gaming zóna</button><button><Icon>✦</Icon> Chill zóna</button><p className="eyebrow progress-title">TVOJ POKROK</p><div className="side-card"><span>Dnešná séria</span><strong>4 dni</strong><div className="mini-progress"><i/></div></div><div className="side-card game-progress"><strong>{correct} správne</strong><div className="mini-progress"><i style={{ width: `${Math.min(100, correct * 10)}%` }}/></div><hr/><span className="tempo">◴ <b>Tempo {speedLevel}</b></span></div></aside>
    <section className="game-wrap"><div className="mobile-stats"><span><Icon>◆</Icon> Séria <b>{streak}</b></span><span><Icon>◴</Icon> Tempo <b>{speedLevel}</b></span><span><span className="coin">C</span> <b>{coins}</b></span></div><div className="instruction"><button aria-label="Prehrať zvuk zadania" onClick={() => playTone(true)}>◖))</button><span>Vyber správny výsledok, kým meteorit dopadne.</span><div className="round-progress"><i style={{ width: `${timeLeft / ROUND_SECONDS * 100}%` }}/></div></div>
      <div className="sky" aria-live="polite"><div className={`drop ${feedback?.kind === "correct" ? "pop" : ""}`} style={dropStyle}><div className="shine"/><span>{problem.a} {problem.op} {problem.b}</span></div><div className="danger-line"><span>bezpečná zóna</span></div><div className={`feedback ${feedback ? `show ${feedback.kind}` : ""}`}>{feedback?.kind === "correct" ? <><b>✓</b> {feedback.text}</> : <>{feedback?.text} {feedback?.answer !== undefined && <b>{feedback.answer}</b>}</>}</div><Gulko className="mascot" celebrating={gulkoCelebrating} /><div className="answers">{problem.options.map((option, index) => { const className = selected === option ? (option === problem.answer ? "correct" : "wrong") : (locked && option === problem.answer && feedback?.kind !== "correct" ? "reveal" : ""); return <button key={`${problem.a}-${problem.b}-${option}`} className={className} disabled={locked || gameState !== "playing"} onClick={() => choose(option)}><span>{option}</span><small>{index + 1}</small></button>; })}</div></div>
    </section>
    {(gameState === "intro" || gameState === "countdown" || gameState === "paused" || gameState === "finished") && <div className="overlay" role="dialog" aria-modal="true"><div className={`modal modal-${gameState}`}>{gameState === "intro" && <><div className="mini-drop">7 + 6</div><p className="modal-kicker">45 SEKÚND MATEMATIKY</p><h2>Meteorický dážď</h2><p>Vyber správny výsledok skôr, než meteorit dopadne. Za každé tri správne odpovede získaš mincu.</p><button className="primary" onClick={startGame}>ZAČAŤ HRU <span>→</span></button><button className="motion-toggle" onClick={() => setReducedMotion((v) => !v)}>{reducedMotion ? "✓ " : ""}Pokojnejší pohyb</button></>}{gameState === "countdown" && <div className="countdown"><p>Pripraviť sa…</p><strong>{countdown || "ŠTART!"}</strong></div>}{gameState === "paused" && <><div className="pause-icon">Ⅱ</div><h2>Hra je pozastavená</h2><p>Meteorit na teba počká.</p><button className="primary" onClick={() => { lastRef.current = performance.now(); setGameState("playing"); }}>POKRAČOVAŤ</button></>}{gameState === "finished" && <><Gulko className="result-mascot" /><p className="modal-kicker">KOLO JE HOTOVÉ</p><h2>Skvelá práca!</h2><div className="stats"><div><span>Správne</span><b>{correct}</b></div><div><span>Úspešnosť</span><b>{accuracy}%</b></div><div><span>Najlepšia séria</span><b>{bestStreak}</b></div></div><button className="primary" onClick={startGame}>HRAŤ ZNOVA</button></>}</div></div>}
    <button className="sound" onClick={() => setSoundOn((v) => !v)} aria-label={soundOn ? "Vypnúť zvuk" : "Zapnúť zvuk"}>{soundOn ? "♪" : "×"}</button>
  </main>;
}
