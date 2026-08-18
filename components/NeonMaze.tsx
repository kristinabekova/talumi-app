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
  spriteIndex: number; // Index piktogramu z dodaného hárku
}

export default function NeonMaze({ onBack }: NeonMazeProps) {
  const [level, setLevel] = useState(1);
  const [gridSize, setGridSize] = useState(5);
  const [maze, setMaze] = useState<Cell[][]>([]);
  const [playerGrid, setPlayerGrid] = useState<{ r: number; c: number }>({ r: 0, c: 0 });
  const [items, setItems] = useState<Item[]>([]);
  const [isGateOpen, setIsGateOpen] = useState(false);
  const [isLevelCompleted, setIsLevelCompleted] = useState(false);

  // Plynulá pozícia Guľka (desatinné čísla pre animáciu bez sekania)
  const [smoothPos, setSmoothPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const targetPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const animFrameRef = useRef<number | null>(null);

  const boardRef = useRef<HTMLDivElement>(null);
  const isInteractingRef = useRef(false);

  // Web Audio zvuky
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
        osc.frequency.exponentialRampToValueAtTime(1318.5, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else if (type === "unlock") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.28);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.28);
      } else if (type === "win") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.35);
        gain.gain.setValueAtTime(0.22, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.38);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.38);
      }
    } catch {}
  };

  // Generátor labyrintu s garanciou riešenia (DFS)
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

  // Inicializácia úrovne + zvyšovanie po každých 5 leveloch
  const initLevel = () => {
    const currentSize = 5 + Math.floor((level - 1) / 5);
    const cappedSize = Math.min(currentSize, 8);
    setGridSize(cappedSize);

    const newMaze = generateMaze(cappedSize);
    setMaze(newMaze);
    setPlayerGrid({ r: 0, c: 0 });
    targetPosRef.current = { x: 0, y: 0 };
    setSmoothPos({ x: 0, y: 0 });
    setIsGateOpen(false);
    setIsLevelCompleted(false);

    // Počet a výber piktogramov z hárku
    const itemCount = Math.min(1 + Math.floor((level - 1) / 4), 3);
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
        newItems.push({
          id: newItems.length,
          r: rr,
          c: cc,
          collected: false,
          spriteIndex: Math.floor(Math.random() * 9), // Náhodný piktogram z hárku
        });
      }
    }
    setItems(newItems);
  };

  useEffect(() => {
    initLevel();
  }, [level]);

  // RequestAnimationFrame pre ultra plynulý pohyb bez trhania
  useEffect(() => {
    const updateSmoothPosition = () => {
      setSmoothPos((prev) => {
        const dx = targetPosRef.current.x - prev.x;
        const dy = targetPosRef.current.y - prev.y;
        if (Math.abs(dx) < 0.005 && Math.abs(dy) < 0.005) {
          return targetPosRef.current;
        }
        return {
          x: prev.x + dx * 0.28,
          y: prev.y + dy * 0.28,
        };
      });
      animFrameRef.current = requestAnimationFrame(updateSmoothPosition);
    };

    animFrameRef.current = requestAnimationFrame(updateSmoothPosition);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Posun o krok s kontrolou stien
  const tryMoveTo = (targetR: number, targetC: number) => {
    if (targetR < 0 || targetR >= gridSize || targetC < 0 || targetC >= gridSize) return;
    if (targetR === playerGrid.r && targetC === playerGrid.c) return;

    const dr = targetR - playerGrid.r;
    const dc = targetC - playerGrid.c;

    if (Math.abs(dr) + Math.abs(dc) !== 1) return;

    const currentCell = maze[playerGrid.r]?.[playerGrid.c];
    if (!currentCell) return;

    if (dr === -1 && currentCell.top) return;
    if (dr === 1 && currentCell.bottom) return;
    if (dc === -1 && currentCell.left) return;
    if (dc === 1 && currentCell.right) return;

    setPlayerGrid({ r: targetR, c: targetC });
    targetPosRef.current = { x: targetC, y: targetR };

    // Zber piktogramu
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

    // Cieľ
    if (targetR === gridSize - 1 && targetC === gridSize - 1) {
      const allCollected = items.every((it) => it.collected);
      if (allCollected && !isLevelCompleted) {
        playSound("win");
        setIsLevelCompleted(true);
        setTimeout(() => {
          setLevel((l) => l + 1);
        }, 1100);
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
            <span className="pill-icon spark-piktogram">✦</span>
            <span className="pill-text">
              {isGateOpen ? "Portál otvorený!" : `Objekty: ${remainingCount}`}
            </span>
          </div>
        </div>
      </header>

      <main className="maze-game-area">
        <div className="instructions">
          <h2>Svetelné labyrinty</h2>
          <p>Nájdi správnu cestu</p>
        </div>

        {/* 3D TALUMI LABYRINT DOSKA */}
        <div
          ref={boardRef}
          className={`maze-3d-board ${isGateOpen ? "portal-unlocked" : ""}`}
          style={{
            gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
            gridTemplateRows: `repeat(${gridSize}, 1fr)`,
          }}
          onPointerDown={(e) => {
            isInteractingRef.current = true;
            handlePointerInteraction(e.clientX, e.clientY);
          }}
          onPointerMove={(e) => {
            if (isInteractingRef.current) {
              handlePointerInteraction(e.clientX, e.clientY);
            }
          }}
          onPointerUp={() => {
            isInteractingRef.current = false;
          }}
          onPointerCancel={() => {
            isInteractingRef.current = false;
          }}
        >
          {maze.map((row, r) =>
            row.map((cell, c) => {
              const isGoal = r === gridSize - 1 && c === gridSize - 1;
              const currentItem = items.find((it) => it.r === r && it.c === c && !it.collected);

              return (
                <div
                  key={`${r}-${c}`}
                  className={`maze-3d-cell ${cell.top ? "wall-3d-top" : ""} ${
                    cell.right ? "wall-3d-right" : ""
                  } ${cell.bottom ? "wall-3d-bottom" : ""} ${cell.left ? "wall-3d-left" : ""}`}
                >
                  {/* Presný 3D Piktogram z dodaného hárku */}
                  {currentItem && (
                    <div
                      className={`exact-pictogram-item pic-idx-${currentItem.spriteIndex}`}
                    />
                  )}

                  {/* Cieľový 3D Portál */}
                  {isGoal && (
                    <div className={`goal-3d-portal ${isGateOpen ? "active-portal" : "locked-portal"}`}>
                      <div className="portal-inner-glow" />
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* ULTRA PLYNULÝ GUĽKO BEZ POZADIA */}
          <div
            className={`pure-smooth-gulko ${isLevelCompleted ? "celebrating" : ""}`}
            style={{
              width: `calc(100% / ${gridSize})`,
              height: `calc(100% / ${gridSize})`,
              transform: `translate3d(${smoothPos.x * 100}%, ${smoothPos.y * 100}%, 0)`,
            }}
          >
            <img
              src={isLevelCompleted ? "/talumi-gulko-wave.png" : "/talumi-gulko-default.png"}
              alt="Guľko"
              className="clean-gulko-img"
            />
          </div>
        </div>

        {/* Spodný Guľko maskot */}
        <div className={`gulko-bottom-mascot ${isLevelCompleted ? "wave-jump" : "float"}`}>
          <img
            src={isLevelCompleted ? "/talumi-gulko-wave.png" : "/talumi-gulko-default.png"}
            alt="Guľko maskot"
            className="clean-gulko-img"
          />
        </div>
      </main>

      <style jsx>{`
        .neon-maze-stage {
          min-height: 100vh;
          background: radial-gradient(circle at 50% 20%, #ffffff 0%, #f4faff 60%, #eaf4ff 100%);
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
          max-width: 650px;
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
          background: #ffffff;
          border-radius: 30px;
          padding: 8px 18px;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 4px 12px rgba(51, 0, 91, 0.05);
        }

        .pill-icon {
          font-size: 14px;
          color: #33005b;
        }

        .spark-piktogram {
          color: #00e5d1;
          font-weight: 900;
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

        /* 3D TALUMI LABYRINT DOSKA S PLASTICKÝMI STENAMI */
        .maze-3d-board {
          width: min(88vw, 440px);
          aspect-ratio: 1;
          background: #ffffff;
          border: 8px solid #00e5d1;
          border-radius: 32px;
          display: grid;
          padding: 4px;
          box-shadow: 0 20px 40px rgba(0, 229, 209, 0.22), inset 0 4px 12px rgba(0, 0, 0, 0.03);
          touch-action: none;
          position: relative;
          transition: all 0.3s ease;
        }

        .maze-3d-board.portal-unlocked {
          border-color: #ff00ee;
          box-shadow: 0 20px 45px rgba(255, 0, 238, 0.35);
        }

        .maze-3d-cell {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* KONZISTENTNÁ 3D HRÚBKA STIEN V TALUMI FARBÁCH */
        .wall-3d-top {
          border-top: 7px solid #00e5d1;
          box-shadow: inset 0 2px 0 #80fbf1, 0 3px 0 #008f87;
        }
        .wall-3d-right {
          border-right: 7px solid #00e5d1;
          box-shadow: inset -2px 0 0 #80fbf1, 3px 0 0 #008f87;
        }
        .wall-3d-bottom {
          border-bottom: 7px solid #00e5d1;
          box-shadow: inset 0 -2px 0 #80fbf1, 0 3px 0 #008f87;
        }
        .wall-3d-left {
          border-left: 7px solid #00e5d1;
          box-shadow: inset 2px 0 0 #80fbf1, -3px 0 0 #008f87;
        }

        /* PRESNÝ 3D PIKTOGRAM Z DODANÉHO OBRÁZKA (CSS SPRITE) */
        .exact-pictogram-item {
          width: 72%;
          height: 72%;
          border-radius: 50%;
          background-image: url("/piktogramy-odstraneny-tien-final.jpg");
          background-size: 300% 500%;
          background-repeat: no-repeat;
          filter: drop-shadow(0 4px 8px rgba(0, 229, 209, 0.4));
          animation: pulseItem 1.6s ease-in-out infinite alternate;
          pointer-events: none;
        }

        /* Mapovanie pozícií jednotlivých piktogramov z hárku */
        .pic-idx-0 { background-position: 0% 0%; }
        .pic-idx-1 { background-position: 50% 0%; }
        .pic-idx-2 { background-position: 100% 0%; }
        .pic-idx-3 { background-position: 0% 25%; }
        .pic-idx-4 { background-position: 50% 25%; }
        .pic-idx-5 { background-position: 100% 25%; }
        .pic-idx-6 { background-position: 0% 75%; }
        .pic-idx-7 { background-position: 50% 100%; }
        .pic-idx-8 { background-position: 100% 100%; }

        /* 3D CIEĽOVÝ PORTÁL */
        .goal-3d-portal {
          width: 80%;
          height: 80%;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          transition: all 0.3s ease;
        }

        .goal-3d-portal.locked-portal {
          border: 3px dashed #bba1d0;
          background: #fdfafd;
        }

        .goal-3d-portal.active-portal {
          background: radial-gradient(circle, #ff00ee 0%, #760cc7 65%);
          box-shadow: 0 0 20px rgba(255, 0, 238, 0.8);
          border: 3px solid #ffffff;
          animation: portalRotate 2.5s linear infinite;
        }

        .portal-inner-glow {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #ffffff;
          box-shadow: 0 0 10px #ffffff;
        }

        /* ULTRA PLYNULÝ GUĽKO BEZ POZADIA */
        .pure-smooth-gulko {
          position: absolute;
          top: 0;
          left: 0;
          pointer-events: none;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 6px;
          will-change: transform;
        }

        .clean-gulko-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          background: transparent !important;
          mix-blend-mode: multiply;
          filter: drop-shadow(0 6px 12px rgba(51, 0, 91, 0.22));
        }

        .pure-smooth-gulko.celebrating {
          animation: celebrateJump 0.5s ease infinite alternate;
        }

        .gulko-bottom-mascot {
          position: absolute;
          bottom: -10px;
          right: 0px;
          width: 90px;
          height: 90px;
          pointer-events: none;
        }

        .gulko-bottom-mascot.float {
          animation: floatY 3s ease-in-out infinite;
        }

        .gulko-bottom-mascot.wave-jump {
          animation: celebrateJump 0.6s ease-in-out infinite alternate;
        }

        @keyframes pulseItem {
          0% { transform: scale(0.92); }
          100% { transform: scale(1.08); }
        }

        @keyframes portalRotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes celebrateJump {
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