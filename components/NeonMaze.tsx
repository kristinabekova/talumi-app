"use client";

import React, { useState, useEffect, useRef } from "react";

interface NeonMazeProps {
  onBack?: () => void;
}

interface Cell {
  r: number;
  c: number;
  top: boolean;
  right: boolean;
  bottom: boolean;
  left: boolean;
}

interface Item {
  id: number;
  r: number;
  c: number;
  collected: boolean;
}

export default function NeonMaze({ onBack }: NeonMazeProps) {
  const [level, setLevel] = useState(1);
  const [gridSize, setGridSize] = useState(5);
  const [maze, setMaze] = useState<Cell[][]>([]);
  const [playerPos, setPlayerPos] = useState<{ r: number; c: number }>({ r: 0, c: 0 });
  const [items, setItems] = useState<Item[]>([]);
  const [isGateOpen, setIsGateOpen] = useState(false);
  const [isLevelCompleted, setIsLevelCompleted] = useState(false);

  const boardRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const playSound = (type: "pickup" | "unlock" | "win") => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      if (type === "pickup") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(659.25, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1318.5, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      } else if (type === "unlock") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else if (type === "win") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.35);
        gain.gain.setValueAtTime(0.22, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch {}
  };

  const generateMaze = (size: number) => {
    const grid: Cell[][] = [];
    for (let r = 0; r < size; r++) {
      grid[r] = [];
      for (let c = 0; c < size; c++) {
        grid[r][c] = { r, c, top: true, right: true, bottom: true, left: true };
      }
    }

    const visited = Array.from({ length: size }, () => Array(size).fill(false));
    const stack: [number, number][] = [];
    visited[0][0] = true;
    stack.push([0, 0]);

    while (stack.length > 0) {
      const [cr, cc] = stack[stack.length - 1];
      const neighbors: { r: number; c: number; dir: "top" | "right" | "bottom" | "left" }[] = [];

      if (cr > 0 && !visited[cr - 1][cc]) neighbors.push({ r: cr - 1, c: cc, dir: "top" });
      if (cr < size - 1 && !visited[cr + 1][cc]) neighbors.push({ r: cr + 1, c: cc, dir: "bottom" });
      if (cc > 0 && !visited[cr][cc - 1]) neighbors.push({ r: cr, c: cc - 1, dir: "left" });
      if (cc < size - 1 && !visited[cr][cc + 1]) neighbors.push({ r: cr, c: cc + 1, dir: "right" });

      if (neighbors.length > 0) {
        const next = neighbors[Math.floor(Math.random() * neighbors.length)];
        if (next.dir === "top") {
          grid[cr][cc].top = false;
          grid[next.r][next.c].bottom = false;
        } else if (next.dir === "bottom") {
          grid[cr][cc].bottom = false;
          grid[next.r][next.c].top = false;
        } else if (next.dir === "left") {
          grid[cr][cc].left = false;
          grid[next.r][next.c].right = false;
        } else if (next.dir === "right") {
          grid[cr][cc].right = false;
          grid[next.r][next.c].left = false;
        }
        visited[next.r][next.c] = true;
        stack.push([next.r, next.c]);
      } else {
        stack.pop();
      }
    }

    return grid;
  };

  const initLevel = () => {
    const currentSize = 5 + Math.floor((level - 1) / 5);
    const cappedSize = Math.min(currentSize, 8);
    setGridSize(cappedSize);

    const newMaze = generateMaze(cappedSize);
    setMaze(newMaze);
    setPlayerPos({ r: 0, c: 0 });
    setIsGateOpen(false);
    setIsLevelCompleted(false);

    const itemCount = Math.min(1 + Math.floor((level - 1) / 3), 3);
    const newItems: Item[] = [];
    const usedPositions = new Set<string>();
    usedPositions.add("0,0");
    usedPositions.add(`${cappedSize - 1},${cappedSize - 1}`);

    while (newItems.length < itemCount) {
      const rr = Math.floor(Math.random() * cappedSize);
      const cc = Math.floor(Math.random() * cappedSize);
      const key = `${rr},${cc}`;

      if (!usedPositions.has(key)) {
        usedPositions.add(key);
        newItems.push({ id: newItems.length, r: rr, c: cc, collected: false });
      }
    }

    setItems(newItems);
  };

  useEffect(() => {
    initLevel();
  }, [level]);

  const tryMoveTo = (targetR: number, targetC: number) => {
    if (targetR < 0 || targetR >= gridSize || targetC < 0 || targetC >= gridSize) return;
    if (targetR === playerPos.r && targetC === playerPos.c) return;

    const dr = targetR - playerPos.r;
    const dc = targetC - playerPos.c;

    if (Math.abs(dr) + Math.abs(dc) !== 1) return;

    const currentCell = maze[playerPos.r]?.[playerPos.c];
    if (!currentCell) return;

    if (dr === -1 && currentCell.top) return;
    if (dr === 1 && currentCell.bottom) return;
    if (dc === -1 && currentCell.left) return;
    if (dc === 1 && currentCell.right) return;

    setPlayerPos({ r: targetR, c: targetC });

    const foundItemIndex = items.findIndex((it) => it.r === targetR && it.c === targetC && !it.collected);
    if (foundItemIndex !== -1) {
      playSound("pickup");
      const updated = [...items];
      updated[foundItemIndex].collected = true;
      setItems(updated);

      if (updated.every((it) => it.collected)) {
        playSound("unlock");
        setIsGateOpen(true);
      }
    }

    if (targetR === gridSize - 1 && targetC === gridSize - 1) {
      const allCollected = items.every((it) => it.collected);
      if (allCollected && !isLevelCompleted) {
        playSound("win");
        setIsLevelCompleted(true);
        setTimeout(() => {
          setLevel((l) => l + 1);
        }, 1200);
      }
    }
  };

  const handlePointerInteraction = (clientX: number, clientY: number) => {
    if (!boardRef.current) return;
    const rect = boardRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;

    const cellWidth = rect.width / gridSize;
    const cellHeight = rect.height / gridSize;

    const targetC = Math.floor(x / cellWidth);
    const targetR = Math.floor(y / cellHeight);

    tryMoveTo(targetR, targetC);
  };

  const remainingCount = items.filter((it) => !it.collected).length;

  return (
    <div className="neon-maze-stage">
      <header className="neon-top-bar">
        <button className="back-btn" onClick={onBack} aria-label="Späť do Chill zóny">
          ←
        </button>

        <div className="talumi-header-pills">
          <div className="top-pill">
            <span className="pill-icon">✦</span>
            <span className="pill-text">Level {level}</span>
          </div>

          <div className="top-pill">
            <span className="pill-icon star-icon">★</span>
            <span className="pill-text">
              {isGateOpen ? "Cieľ odomknutý!" : `Hviezdy: ${remainingCount}`}
            </span>
          </div>
        </div>
      </header>

      <main className="maze-game-area">
        <div className="instructions">
          <h2>Svetelné labyrinty</h2>
          <p>Nájdi správnu cestu</p>
        </div>

        <div
          ref={boardRef}
          className={`maze-board ${isGateOpen ? "gate-ready" : ""}`}
          style={{
            gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
            gridTemplateRows: `repeat(${gridSize}, 1fr)`,
          }}
          onPointerDown={(e) => {
            isDraggingRef.current = true;
            handlePointerInteraction(e.clientX, e.clientY);
          }}
          onPointerMove={(e) => {
            if (isDraggingRef.current) {
              handlePointerInteraction(e.clientX, e.clientY);
            }
          }}
          onPointerUp={() => {
            isDraggingRef.current = false;
          }}
          onPointerCancel={() => {
            isDraggingRef.current = false;
          }}
        >
          {maze.map((row, r) =>
            row.map((cell, c) => {
              const isGoal = r === gridSize - 1 && c === gridSize - 1;
              const hasStar = items.some((it) => it.r === r && it.c === c && !it.collected);
              const isPlayer = playerPos.r === r && playerPos.c === c;

              return (
                <div
                  key={`${r}-${c}`}
                  className={`maze-cell ${cell.top ? "wall-top" : ""} ${
                    cell.right ? "wall-right" : ""
                  } ${cell.bottom ? "wall-bottom" : ""} ${cell.left ? "wall-left" : ""}`}
                >
                  {hasStar && (
                    <div className="star-collectible">
                      <span className="star-pulse">★</span>
                    </div>
                  )}

                  {isGoal && (
                    <div className={`goal-gate ${isGateOpen ? "open" : "locked"}`}>
                      <span>{isGateOpen ? "★" : "🔒"}</span>
                    </div>
                  )}

                  {isPlayer && (
                    <div className={`player-gulko ${isLevelCompleted ? "celebrating" : ""}`}>
                      <img
                        src={isLevelCompleted ? "/talumi-gulko-wave.png" : "/talumi-gulko-default.png"}
                        alt="Guľko"
                        className="player-gulko-img"
                      />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className={`gulko-bottom-mascot ${isLevelCompleted ? "wave-jump" : "float"}`}>
          <img
            src={isLevelCompleted ? "/talumi-gulko-wave.png" : "/talumi-gulko-default.png"}
            alt="Guľko maskot"
          />
        </div>
      </main>

      <style jsx>{`
        .neon-maze-stage {
          min-height: 100vh;
          background: radial-gradient(circle at 50% 20%, #f7f0ff 0%, #effdff 50%, #e2f7ff 100%);
          display: flex;
          flex-direction: column;
          user-select: none;
          touch-action: none;
          padding: 16px;
          position: relative;
          overflow: hidden;
        }

        .neon-top-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          max-width: 700px;
          margin: 0 auto;
          width: 100%;
          padding: 8px 0 16px;
        }

        .back-btn {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 0;
          background: #ffffff;
          box-shadow: 0 4px 14px rgba(51, 0, 91, 0.08);
          font-size: 20px;
          font-weight: 900;
          color: #33005b;
          cursor: pointer;
          transition: transform 0.15s ease;
        }
        .back-btn:hover {
          transform: scale(1.08);
        }

        .talumi-header-pills {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .top-pill {
          background: #fbf6ff;
          border-radius: 30px;
          padding: 8px 18px;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 2px 8px rgba(51, 0, 91, 0.03);
        }

        .pill-icon {
          font-size: 14px;
          color: #33005b;
        }

        .star-icon {
          color: #9d4edd;
        }

        .pill-text {
          font-size: 15px;
          font-weight: 900;
          color: #33005b;
        }

        .maze-game-area {
          max-width: 600px;
          margin: 0 auto;
          width: 100%;
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
        }

        .instructions {
          text-align: center;
          margin-bottom: 16px;
        }

        .instructions h2 {
          font-size: 28px;
          font-weight: 1000;
          color: #33005b;
          margin: 0 0 4px;
        }

        .instructions p {
          font-size: 15px;
          color: #645675;
          margin: 0;
          font-weight: 700;
        }

        .maze-board {
          width: min(88vw, 440px);
          aspect-ratio: 1;
          background: rgba(255, 255, 255, 0.95);
          border: 4px solid #00d3c5;
          border-radius: 28px;
          display: grid;
          padding: 6px;
          box-shadow: 0 16px 36px rgba(0, 211, 197, 0.15);
          touch-action: none;
          position: relative;
          transition: all 0.3s ease;
        }

        .maze-board.gate-ready {
          border-color: #9d4edd;
          box-shadow: 0 0 28px rgba(157, 78, 221, 0.4);
        }

        .maze-cell {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .wall-top {
          border-top: 4px solid #00b4a7;
        }
        .wall-right {
          border-right: 4px solid #00b4a7;
        }
        .wall-bottom {
          border-bottom: 4px solid #00b4a7;
        }
        .wall-left {
          border-left: 4px solid #00b4a7;
        }

        .star-collectible {
          font-size: clamp(22px, 5vw, 30px);
          color: #9d4edd;
          animation: pulseStar 1.4s ease-in-out infinite;
          pointer-events: none;
          text-shadow: 0 0 10px rgba(157, 78, 221, 0.6);
        }

        .goal-gate {
          width: 82%;
          height: 82%;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          font-weight: 900;
          transition: all 0.3s ease;
        }

        .goal-gate.locked {
          background: #f0e6f7;
          color: #8c7a9c;
          border: 2px dashed #bba1d0;
        }

        .goal-gate.open {
          background: linear-gradient(135deg, #9d4edd, #ff00ee);
          color: #ffffff;
          box-shadow: 0 0 20px rgba(255, 0, 238, 0.8);
          animation: glowGate 1.2s ease-in-out infinite alternate;
        }

        .player-gulko {
          position: absolute;
          width: 86%;
          height: 86%;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          z-index: 5;
          transition: all 0.1s ease-out;
        }

        .player-gulko-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          filter: drop-shadow(0 4px 8px rgba(51, 0, 91, 0.25));
        }

        .player-gulko.celebrating {
          animation: jumpCelebrate 0.5s ease infinite alternate;
        }

        .gulko-bottom-mascot {
          position: absolute;
          bottom: -10px;
          right: 0px;
          width: 90px;
          height: 90px;
          pointer-events: none;
        }

        .gulko-bottom-mascot img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .gulko-bottom-mascot.float {
          animation: floatY 3s ease-in-out infinite;
        }

        .gulko-bottom-mascot.wave-jump {
          animation: jumpCelebrate 0.6s ease-in-out infinite alternate;
        }

        @keyframes pulseStar {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 2px rgba(157, 78, 221, 0.4)); }
          50% { transform: scale(1.2); filter: drop-shadow(0 0 10px rgba(157, 78, 221, 0.9)); }
        }

        @keyframes glowGate {
          0% { transform: scale(0.96); box-shadow: 0 0 10px rgba(255, 0, 238, 0.5); }
          100% { transform: scale(1.06); box-shadow: 0 0 24px rgba(255, 0, 238, 0.95); }
        }

        @keyframes jumpCelebrate {
          0% { transform: translateY(0); }
          100% { transform: translateY(-12px); }
        }

        @keyframes floatY {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}