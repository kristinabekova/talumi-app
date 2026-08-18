"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

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
  iconFile: string;
}

export default function NeonMaze({ onBack }: NeonMazeProps) {
  const [level, setLevel] = useState(1);
  const [gridSize, setGridSize] = useState(5);
  const [maze, setMaze] = useState<Cell[][]>([]);
  const [playerGrid, setPlayerGrid] = useState<{ r: number; c: number }>({ r: 0, c: 0 });
  const [items, setItems] = useState<Item[]>([]);
  const [isGateOpen, setIsGateOpen] = useState(false);
  const [isLevelCompleted, setIsLevelCompleted] = useState(false);

  const [smoothPos, setSmoothPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const targetPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const animFrameRef = useRef<number | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isInteractingRef = useRef(false);

  // Zoznam všetkých 15 piktogramov z dodaného hárku
  const allPictograms = [
    "star_sharp.png",
    "lightning.png",
    "percent.png",
    "eyes_double.png",
    "spark_cluster.png",
    "dumbbell.png",
    "star_hollow.png",
    "face_funny.png",
    "puzzle.png",
    "arrow_up_right.png",
    "eye_single.png",
    "cross_x.png",
    "ring_oval.png",
    "clover.png",
    "coin_spark.png",
  ];

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
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.16);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.16);
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
    const cappedSize = Math.min(currentSize, 7);
    setGridSize(cappedSize);

    const newMaze = generateMaze(cappedSize);
    setMaze(newMaze);
    setPlayerGrid({ r: 0, c: 0 });
    targetPosRef.current = { x: 0, y: 0 };
    setSmoothPos({ x: 0, y: 0 });
    setIsGateOpen(false);
    setIsLevelCompleted(false);

    // Počet a náhodný výber zo všetkých 15 piktogramov
    const itemCount = Math.min(1 + Math.floor((level - 1) / 4), 3);
    const newItems: Item[] = [];
    const usedPositions = new Set<string>();
    usedPositions.add("0,0");
    usedPositions.add(`${cappedSize - 1},${cappedSize - 1}`);

    const shuffledIcons = [...allPictograms].sort(() => Math.random() - 0.5);

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
          iconFile: shuffledIcons[newItems.length % shuffledIcons.length],
        });
      }
    }
    setItems(newItems);
  };

  useEffect(() => {
    initLevel();
  }, [level]);

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

  const drawMazeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || maze.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const padding = 16;
    const innerW = width - padding * 2;
    const innerH = height - padding * 2;
    const cellW = innerW / gridSize;
    const cellH = innerH / gridSize;
    const wallW = Math.max(10, Math.floor(cellW * 0.16));

    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.roundRect(padding, padding, innerW, innerH, 20);
    ctx.fill();

    const draw3DWall = (x1: number, y1: number, x2: number, y2: number) => {
      ctx.lineWidth = wallW;
      ctx.lineCap = "round";
      ctx.strokeStyle = "#008f87";
      ctx.beginPath();
      ctx.moveTo(x1, y1 + 4);
      ctx.lineTo(x2, y2 + 4);
      ctx.stroke();

      ctx.strokeStyle = "#00E5D1";
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      ctx.lineWidth = Math.max(2, wallW * 0.28);
      ctx.strokeStyle = "#b8fff9";
      ctx.beginPath();
      ctx.moveTo(x1, y1 - 1);
      ctx.lineTo(x2, y2 - 1);
      ctx.stroke();
    };

    ctx.lineWidth = wallW + 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#008f87";
    ctx.strokeRect(padding, padding + 4, innerW, innerH);
    ctx.strokeStyle = "#00E5D1";
    ctx.strokeRect(padding, padding, innerW, innerH);

    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const cell = maze[r][c];
        const x = padding + c * cellW;
        const y = padding + r * cellH;

        if (cell.top && r > 0) draw3DWall(x, y, x + cellW, y);
        if (cell.left && c > 0) draw3DWall(x, y, x, y + cellH);
        if (cell.bottom && r < gridSize - 1) draw3DWall(x, y + cellH, x + cellW, y + cellH);
        if (cell.right && c < gridSize - 1) draw3DWall(x + cellW, y, x + cellW, y + cellH);
      }
    }
  }, [maze, gridSize]);

  useEffect(() => {
    drawMazeCanvas();
  }, [drawMazeCanvas]);

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
        }, 1100);
      }
    }
  };

  const handlePointerInteraction = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;

    const padding = (16 / 440) * rect.width;
    const innerW = rect.width - padding * 2;
    const innerH = rect.height - padding * 2;
    const cellW = innerW / gridSize;
    const cellH = innerH / gridSize;

    const targetC = Math.floor((x - padding) / cellW);
    const targetR = Math.floor((y - padding) / cellH);

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
              {isGateOpen ? "Cieľ otvorený!" : `Objekty: ${remainingCount}`}
            </span>
          </div>
        </div>
      </header>

      <main className="maze-game-area">
        <div className="instructions">
          <h2>Svetelné labyrinty</h2>
          <p>Nájdi správnu cestu</p>
        </div>

        <div className="maze-interactive-wrap">
          <canvas
            ref={canvasRef}
            width={440}
            height={440}
            className="maze-canvas-element"
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
          />

          {/* VŠETKY ORIGINÁLNE PIKTOGRAMY */}
          {items.map((it) => {
            if (it.collected) return null;
            return (
              <div
                key={it.id}
                className="board-overlay-item"
                style={{
                  width: `calc((100% - 32px) / ${gridSize})`,
                  height: `calc((100% - 32px) / ${gridSize})`,
                  transform: `translate3d(calc(16px + ${it.c * 100}%), calc(16px + ${it.r * 100}%), 0)`,
                }}
              >
                <img
                  src={`/talumi-decor/${it.iconFile}`}
                  alt="Piktogram"
                  className="exact-talumi-piktogram-img"
                />
              </div>
            );
          })}

          {/* CIEĽOVÝ PORTÁL */}
          <div
            className="board-overlay-item"
            style={{
              width: `calc((100% - 32px) / ${gridSize})`,
              height: `calc((100% - 32px) / ${gridSize})`,
              transform: `translate3d(calc(16px + ${(gridSize - 1) * 100}%), calc(16px + ${(gridSize - 1) * 100}%), 0)`,
            }}
          >
            <div className={`talumi-goal-portal ${isGateOpen ? "open-portal" : "locked-portal"}`}>
              <img
                src={isGateOpen ? "/talumi-decor/star_sharp.png" : "/talumi-decor/ring_oval.png"}
                alt="Cieľ"
                className={`portal-icon-img ${isGateOpen ? "pulse-star" : "idle-ring"}`}
              />
            </div>
          </div>

          {/* GUĽKO */}
          <div
            className={`smooth-gulko-layer ${isLevelCompleted ? "celebrating" : ""}`}
            style={{
              width: `calc((100% - 32px) / ${gridSize})`,
              height: `calc((100% - 32px) / ${gridSize})`,
              transform: `translate3d(calc(16px + ${smoothPos.x * 100}%), calc(16px + ${smoothPos.y * 100}%), 0)`,
            }}
          >
            <img
              src={isLevelCompleted ? "/talumi-gulko-wave.png" : "/talumi-gulko-default.png"}
              alt="Guľko"
              className="pure-gulko-render"
            />
          </div>
        </div>

        {/* Spodný Guľko maskot */}
        <div className={`gulko-bottom-mascot ${isLevelCompleted ? "wave-jump" : "float"}`}>
          <img
            src={isLevelCompleted ? "/talumi-gulko-wave.png" : "/talumi-gulko-default.png"}
            alt="Guľko maskot"
            className="pure-gulko-render"
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

        .maze-interactive-wrap {
          position: relative;
          width: min(88vw, 440px);
          aspect-ratio: 1;
          box-shadow: 0 20px 48px rgba(0, 229, 209, 0.22), 0 8px 20px rgba(51, 0, 91, 0.08);
          border-radius: 28px;
          touch-action: none;
        }

        .maze-canvas-element {
          width: 100%;
          height: 100%;
          display: block;
          border-radius: 28px;
          background: #ffffff;
        }

        .board-overlay-item {
          position: absolute;
          top: 0;
          left: 0;
          pointer-events: none;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 5;
        }

        .exact-talumi-piktogram-img {
          width: 64%;
          height: 64%;
          object-fit: contain;
          filter: drop-shadow(0 6px 12px rgba(0, 229, 209, 0.45));
          animation: floatPikto 1.8s ease-in-out infinite alternate;
        }

        .talumi-goal-portal {
          width: 76%;
          height: 76%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .portal-icon-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          transition: all 0.3s ease;
        }

        .idle-ring {
          opacity: 0.55;
        }

        .pulse-star {
          opacity: 1;
          filter: drop-shadow(0 0 16px rgba(255, 0, 238, 0.9));
          animation: starGlow 1.2s ease-in-out infinite alternate;
        }

        .smooth-gulko-layer {
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

        .pure-gulko-render {
          width: 100%;
          height: 100%;
          object-fit: contain;
          background: transparent !important;
          filter: drop-shadow(0 6px 12px rgba(51, 0, 91, 0.2));
        }

        .smooth-gulko-layer.celebrating {
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

        .gulko-bottom-mascot img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .gulko-bottom-mascot.float {
          animation: floatY 3s ease-in-out infinite;
        }

        .gulko-bottom-mascot.wave-jump {
          animation: celebrateJump 0.6s ease-in-out infinite alternate;
        }

        @keyframes floatPikto {
          0% { transform: scale(0.92) translateY(0); }
          100% { transform: scale(1.08) translateY(-4px); }
        }

        @keyframes starGlow {
          0% { transform: scale(0.95); filter: drop-shadow(0 0 10px rgba(255, 0, 238, 0.6)); }
          100% { transform: scale(1.15); filter: drop-shadow(0 0 22px rgba(255, 0, 238, 1)); }
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