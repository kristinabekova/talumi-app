"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Cell, Challenge, createChallenge, createOrb, createOrbs, DIFFICULTY_CONFIG, Difficulty, matchesChallenge, NumberOrb, replaceOrbInSet } from "./math";
import { canTurn, Direction, hitsBody, nextHead } from "./engine";

export type { Direction } from "./engine";
export type GamePhase = "intro" | "rules" | "playing" | "paused" | "hit" | "levelup" | "gameover";
type Feedback = { kind: "correct" | "wrong" | "level"; text: string } | null;
export type GameOverReason = "lives" | "wall" | "body" | null;

const START_SNAKE: Cell[] = [{ x: 8, y: 9 }, { x: 7, y: 9 }, { x: 6, y: 9 }];
const START_LIVES = 3;
const ROUND_TARGET = 5;
const POINTS = 10;

export function useSnakeGame() {
  const [phase, setPhase] = useState<GamePhase>("intro");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [snake, setSnake] = useState<Cell[]>(START_SNAKE);
  const [direction, setDirectionState] = useState<Direction>("right");
  const [challenge, setChallenge] = useState<Challenge>(() => createChallenge("easy"));
  const [orbs, setOrbs] = useState<NumberOrb[]>([]);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [lives, setLives] = useState(START_LIVES);
  const [level, setLevel] = useState(1);
  const [roundCorrect, setRoundCorrect] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [correctStreak, setCorrectStreak] = useState(0);
  const [gulkoCelebrating, setGulkoCelebrating] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [gameOverReason, setGameOverReason] = useState<GameOverReason>(null);
  const [teleporting, setTeleporting] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const directionRef = useRef<Direction>(direction);
  const queuedDirectionRef = useRef<Direction>(direction);
  const loopRef = useRef<number | null>(null);
  const feedbackTimerRef = useRef<number | null>(null);
  const levelTimerRef = useRef<number | null>(null);
  const celebrationTimerRef = useRef<number | null>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const rulesReturnRef = useRef<"intro" | "paused">("intro");
  const snakeRef = useRef<Cell[]>(snake);
  const orbsRef = useRef<NumberOrb[]>(orbs);
  const challengeRef = useRef<Challenge>(challenge);
  const livesRef = useRef(lives);
  const roundCorrectRef = useRef(roundCorrect);
  const correctStreakRef = useRef(correctStreak);
  const scoreRef = useRef(score);

  useEffect(() => {
    snakeRef.current = snake;
    orbsRef.current = orbs;
    challengeRef.current = challenge;
    livesRef.current = lives;
    roundCorrectRef.current = roundCorrect;
    correctStreakRef.current = correctStreak;
    scoreRef.current = score;
  }, [challenge, correctStreak, lives, orbs, roundCorrect, score, snake]);

  useEffect(() => {
    const saved = Number(window.localStorage.getItem("talumi-snake-high-score") ?? 0);
    const timer = window.setTimeout(() => setHighScore(Number.isFinite(saved) ? saved : 0), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const clearTimers = useCallback(() => {
    if (loopRef.current) window.clearTimeout(loopRef.current);
    if (feedbackTimerRef.current) window.clearTimeout(feedbackTimerRef.current);
    if (levelTimerRef.current) window.clearTimeout(levelTimerRef.current);
    if (celebrationTimerRef.current) window.clearTimeout(celebrationTimerRef.current);
    loopRef.current = feedbackTimerRef.current = levelTimerRef.current = celebrationTimerRef.current = null;
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const playTone = useCallback((kind: "correct" | "wrong" | "level") => {
    if (!soundOn) return;
    try {
      const AudioCtor = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const context = audioRef.current ?? new AudioCtor();
      audioRef.current = context;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = kind === "wrong" ? 190 : kind === "level" ? 720 : 520;
      gain.gain.setValueAtTime(0.07, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.16);
      oscillator.connect(gain); gain.connect(context.destination); oscillator.start(); oscillator.stop(context.currentTime + 0.17);
    } catch { /* Zvuk je doplnok; hra funguje aj bez neho. */ }
  }, [soundOn]);

  const showFeedback = useCallback((next: Feedback, duration = 700) => {
    if (feedbackTimerRef.current) window.clearTimeout(feedbackTimerRef.current);
    setFeedback(next);
    feedbackTimerRef.current = window.setTimeout(() => setFeedback(null), duration);
  }, []);

  const finishGame = useCallback((reason: Exclude<GameOverReason, null>) => {
    clearTimers();
    setGameOverReason(reason);
    setPhase("gameover");
    const finalScore = scoreRef.current;
    setHighScore((best) => {
      const nextBest = Math.max(best, finalScore);
      window.localStorage.setItem("talumi-snake-high-score", String(nextBest));
      return nextBest;
    });
  }, [clearTimers]);

  const replaceEatenOrb = useCallback((currentOrbs: NumberOrb[], eatenId: string, currentSnake: Cell[], currentChallenge: Challenge, wanted: boolean) => {
    const remaining = currentOrbs.filter((orb) => orb.id !== eatenId);
    const replacement = createOrb(currentChallenge, difficulty, [...currentSnake, ...remaining], remaining.map((orb) => orb.value), wanted);
    return replaceOrbInSet(currentOrbs, eatenId, replacement);
  }, [difficulty]);

  const completeLevel = useCallback((currentSnake: Cell[], previousChallenge: Challenge) => {
    clearTimers();
    setPhase("levelup");
    setGulkoCelebrating(true);
    celebrationTimerRef.current = window.setTimeout(() => setGulkoCelebrating(false), 1800);
    setFeedback({ kind: "level", text: "Výborne! Nové zadanie" });
    playTone("level");
    levelTimerRef.current = window.setTimeout(() => {
      const nextChallenge = createChallenge(difficulty, previousChallenge.id);
      challengeRef.current = nextChallenge;
      setChallenge(nextChallenge);
      const nextOrbs = createOrbs(nextChallenge, difficulty, currentSnake);
      orbsRef.current = nextOrbs;
      setOrbs(nextOrbs);
      roundCorrectRef.current = 0;
      setRoundCorrect(0);
      setLevel((value) => value + 1);
      setFeedback(null);
      setPhase("playing");
    }, 1050);
  }, [clearTimers, difficulty, playTone]);

  const tick = useCallback(() => {
    const currentSnake = snakeRef.current;
    const currentOrbs = orbsRef.current;
    const currentChallenge = challengeRef.current;
    const nextDirection = queuedDirectionRef.current;
    directionRef.current = nextDirection;
    setDirectionState(nextDirection);
    const config = DIFFICULTY_CONFIG[difficulty];
    const movement = nextHead(currentSnake[0], nextDirection, config.wraps);
    if (movement.hitWall) { finishGame("wall"); return; }
    const nextCell = movement.cell;
    const wrapped = Math.abs(nextCell.x - currentSnake[0].x) > 1 || Math.abs(nextCell.y - currentSnake[0].y) > 1;
    if (wrapped) {
      setTeleporting(true);
      window.requestAnimationFrame(() => setTeleporting(false));
    }

    const eaten = currentOrbs.find((orb) => orb.x === nextCell.x && orb.y === nextCell.y);
    const correct = eaten ? matchesChallenge(eaten.value, currentChallenge) : false;
    const bodyToCheck = correct ? currentSnake : currentSnake.slice(0, -1);
    if (hitsBody(nextCell, bodyToCheck)) { finishGame("body"); return; }

    const movedSnake = [nextCell, ...currentSnake];
    if (!eaten) {
      const nextSnake = movedSnake.slice(0, -1);
      snakeRef.current = nextSnake;
      setSnake(nextSnake);
      return;
    }

    if (correct) {
      snakeRef.current = movedSnake;
      setSnake(movedSnake);
      const nextRoundCorrect = roundCorrectRef.current + 1;
      const nextScore = scoreRef.current + POINTS;
      roundCorrectRef.current = nextRoundCorrect;
      scoreRef.current = nextScore;
      setScore(nextScore);
      setTotalCorrect((value) => value + 1);
      const nextStreak = correctStreakRef.current + 1;
      correctStreakRef.current = nextStreak;
      setCorrectStreak(nextStreak);
      setRoundCorrect(nextRoundCorrect);
      showFeedback({ kind: "correct", text: `Správne! +${POINTS} bodov` });
      playTone("correct");
      if (nextRoundCorrect >= ROUND_TARGET) window.setTimeout(() => completeLevel(movedSnake, currentChallenge), 0);
      else {
        const nextOrbs = replaceEatenOrb(currentOrbs, eaten.id, movedSnake, currentChallenge, true);
        orbsRef.current = nextOrbs;
        setOrbs(nextOrbs);
      }
      return;
    }

    const nextSnake = movedSnake.slice(0, -1);
    snakeRef.current = nextSnake;
    setSnake(nextSnake);
    const nextLives = livesRef.current - 1;
    livesRef.current = nextLives;
    setLives(nextLives);
    correctStreakRef.current = 0;
    setCorrectStreak(0);
    setGulkoCelebrating(false);
    setPhase("hit");
    showFeedback({ kind: "wrong", text: "Nesprávne číslo! −1 život" }, 900);
    playTone("wrong");
    const nextOrbs = replaceEatenOrb(currentOrbs, eaten.id, nextSnake, currentChallenge, false);
    orbsRef.current = nextOrbs;
    setOrbs(nextOrbs);
    levelTimerRef.current = window.setTimeout(() => nextLives <= 0 ? finishGame("lives") : setPhase("playing"), 650);
  }, [completeLevel, difficulty, finishGame, playTone, replaceEatenOrb, showFeedback]);

  useEffect(() => {
    if (phase !== "playing") return;
    const speed = Math.max(105, DIFFICULTY_CONFIG[difficulty].tickMs - (level - 1) * 12);
    loopRef.current = window.setTimeout(tick, speed);
    return () => { if (loopRef.current) window.clearTimeout(loopRef.current); };
  }, [difficulty, level, phase, snake, tick]);

  const setDirection = useCallback((next: Direction) => {
    if (!canTurn(directionRef.current, next)) return false;
    queuedDirectionRef.current = next;
    return true;
  }, []);

  const startGame = useCallback(() => {
    clearTimers();
    const nextChallenge = createChallenge(difficulty);
    const nextOrbs = createOrbs(nextChallenge, difficulty, START_SNAKE);
    snakeRef.current = START_SNAKE;
    setSnake(START_SNAKE);
    setDirectionState("right"); directionRef.current = queuedDirectionRef.current = "right";
    challengeRef.current = nextChallenge; setChallenge(nextChallenge);
    orbsRef.current = nextOrbs; setOrbs(nextOrbs);
    scoreRef.current = 0; livesRef.current = START_LIVES; roundCorrectRef.current = 0; correctStreakRef.current = 0;
    setScore(0); setLives(START_LIVES); setLevel(1); setRoundCorrect(0); setTotalCorrect(0); setCorrectStreak(0); setGulkoCelebrating(false); setFeedback(null);
    setGameOverReason(null); setTeleporting(false);
    setPhase("playing");
  }, [clearTimers, difficulty]);

  const pause = useCallback(() => setPhase((value) => value === "playing" ? "paused" : value), []);
  const resume = useCallback(() => setPhase((value) => value === "paused" ? "playing" : value), []);
  const openRules = useCallback(() => setPhase((value) => {
    if (value === "playing") { rulesReturnRef.current = "paused"; return "rules"; }
    if (value === "intro") { rulesReturnRef.current = "intro"; return "rules"; }
    return value;
  }), []);
  const closeRules = useCallback(() => setPhase((value) => value === "rules" ? rulesReturnRef.current : value), []);
  const exitGame = useCallback(() => { clearTimers(); setPhase("intro"); }, [clearTimers]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const keys: Record<string, Direction> = { ArrowUp: "up", w: "up", W: "up", ArrowDown: "down", s: "down", S: "down", ArrowLeft: "left", a: "left", A: "left", ArrowRight: "right", d: "right", D: "right" };
      if (keys[event.key]) { event.preventDefault(); setDirection(keys[event.key]); }
      if (event.code === "Space") {
        event.preventDefault();
        if (phase === "playing") pause();
        else if (phase === "paused") resume();
      }
    };
    window.addEventListener("keydown", onKey, { passive: false });
    return () => window.removeEventListener("keydown", onKey);
  }, [pause, phase, resume, setDirection]);

  useEffect(() => {
    const pauseWhenHidden = () => { if (document.hidden) pause(); };
    const pauseOnBlur = () => pause();
    document.addEventListener("visibilitychange", pauseWhenHidden);
    window.addEventListener("blur", pauseOnBlur);
    return () => { document.removeEventListener("visibilitychange", pauseWhenHidden); window.removeEventListener("blur", pauseOnBlur); };
  }, [pause]);

  const moveMs = Math.max(105, DIFFICULTY_CONFIG[difficulty].tickMs - (level - 1) * 12);
  return { phase, setPhase, difficulty, setDifficulty, snake, direction, challenge, orbs, score, highScore, lives, level, roundCorrect, totalCorrect, correctStreak, gulkoCelebrating, feedback, gameOverReason, teleporting, soundOn, setSoundOn, setDirection, startGame, pause, resume, openRules, closeRules, exitGame, roundTarget: ROUND_TARGET, pointsPerCorrect: POINTS, startLives: START_LIVES, moveMs };
}
