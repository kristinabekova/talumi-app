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
  const [gridSize, setGridSize] = useState(6);
  const [maze, setMaze] = useState<Cell[][]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [isGateOpen, setIsGateOpen] = useState(true);
  const [isLevelCompleted, setIsLevelCompleted] = useState(false);

  // Pozície a fyzika
  const [gulkoPos, setGulkoPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const gulkoPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchTargetRef = useRef<{ x: number; y: number } | null>(null);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const mazeRef = useRef<Cell[][]>([]);
  const itemsRef = useRef<Item[]>([]);
  const isGateOpenRef = useRef(true);
  const isLevelCompletedRef = useRef(false);
  const animFrameRef = useRef<number | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isInteractingRef = useRef(false);

  // 5 vybraných piktogramov
  const allowedCollectables = [
    "clover.png",
    "cross_x.png",
    "face_funny.png",
    "puzzle.png",
    "star_hollow.png",
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
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.22, ctx.currentTime);
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
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch {}
  };

  const generateComplexMaze = (size: number) => {
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
      const idx = Math.random() < 0.35 ? Math.floor(Math.random() * stack.length) : stack.length - 1;
      const [cr, cc] = stack[idx];

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
        stack.splice(idx, 1);
      }
    }
    return grid;
  };

  const initLevel = () => {
    const currentSize = 6 + Math.floor((level - 1) / 5);
    const cappedSize = Math.min(currentSize, 8);
    setGridSize(cappedSize);

    const newMaze = generateComplexMaze(cappedSize);
    mazeRef.current = newMaze;
    setMaze(newMaze);

    gulkoPosRef.current = { x: 0, y: 0 };
    setGulkoPos({ x: 0, y: 0 });
    touchTargetRef.current = null;
    isLevelCompletedRef.current = false;
    setIsLevelCompleted(false);

    const hasItems = Math.random() < 0.3;
    let newItems: Item[] = [];

    if (hasItems) {
      const itemCount = Math.min(1 + Math.floor(Math.random() * 2), 2);
      const usedPositions = new Set<string>();
      usedPositions.add("0,0");
      usedPositions.add(`${cappedSize - 1},${cappedSize - 1}`);

      const shuffledIcons = [...allowedCollectables].sort(() => Math.random() - 0.5);

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
      isGateOpenRef.current = false;
      setIsGateOpen(false);
    } else {
      isGateOpenRef.current = true;
      setIsGateOpen(true);
    }

    itemsRef.current = newItems;
    setItems(newItems);
  };

  useEffect(() => {
    initLevel();
  }, [level]);

  // Optimalizovaný mobilný fyzikálny loop s plynulým vedením zákrut
  useEffect(() => {
    const updateEngine = () => {
      if (touchTargetRef.current && mazeRef.current.length > 0 && !isLevelCompletedRef.current) {
        const current = gulkoPosRef.current;
        const target = touchTargetRef.current;

        const currentCellR = Math.round(current.y);
        const currentCellC = Math.round(current.x);
        const cell = mazeRef.current[currentCellR]?.[currentCellC];

        if (cell) {
          const dx = target.x - current.x;
          const dy = target.y - current.y;
          const speed = 0.16; // Rýchlejšia odozva na prst

          let moveX = 0;
          let moveY = 0;

          // Voľba primárnej osi podľa sily ťahu prsta
          if (Math.abs(dx) >= Math.abs(dy)) {
            const dirX = Math.sign(dx);
            const canX =
              (dirX > 0 && (!cell.right || current.x < currentCellC)) ||
              (dirX < 0 && (!cell.left || current.x > currentCellC));

            if (canX) {
              moveX = dirX * Math.min(speed, Math.abs(dx));
            } else if (Math.abs(dy) > 0.08) {
              const dirY = Math.sign(dy);
              const canY =
                (dirY > 0 && (!cell.bottom || current.y < currentCellR)) ||
                (dirY < 0 && (!cell.top || current.y > currentCellR));
              if (canY) moveY = dirY * Math.min(speed, Math.abs(dy));
            }
          } else {
            const dirY = Math.sign(dy);
            const canY =
              (dirY > 0 && (!cell.bottom || current.y < currentCellR)) ||
              (dirY < 0 && (!cell.top || current.y > currentCellR));

            if (canY) {
              moveY = dirY * Math.min(speed, Math.abs(dy));
            } else if (Math.abs(dx) > 0.08) {
              const dirX = Math.sign(dx);
              const canX =
                (dirX > 0 && (!cell.right || current.x < currentCellC)) ||
                (dirX < 0 && (!cell.left || current.x > currentCellC));
              if (canX) moveX = dirX * Math.min(speed, Math.abs(dx));
            }
          }

          current.x += moveX;
          current.y += moveY;

          // Automatické hladké centrovanie v chodbe pre ľahké zatáčanie
          if (Math.abs(moveX) > 0 && Math.abs(moveY) === 0) {
            current.y += (currentCellR - current.y) * 0.25;
          }
          if (Math.abs(moveY) > 0 && Math.abs(moveX) === 0) {
            current.x += (currentCellC - current.x) * 0.25;
          }

          setGulkoPos({ x: current.x, y: current.y });

          // Zber piktogramov
          const items = itemsRef.current;
          for (let i = 0; i < items.length; i++) {
            if (!items[i].collected) {
              const dist = Math.hypot(current.x - items[i].c, current.y - items[i].r);
              if (dist < 0.5) {
                playSound("pickup");
                items[i].collected = true;
                setItems([...items]);

                if (items.every((it) => it.collected)) {
                  playSound("unlock");
                  isGateOpenRef.current = true;
                  setIsGateOpen(true);
                }
              }
            }
          }

          // Vstup do cieľa s polsekundovým poskokom radosti
          const goalDist = Math.hypot(current.x - (gridSize - 1), current.y - (gridSize - 1));
          if (goalDist < 0.4 && isGateOpenRef.current && !isLevelCompletedRef.current) {
            playSound("win");
            isLevelCompletedRef.current = true;
            setIsLevelCompleted(true);
            touchTargetRef.current = null;

            // 0.6s poskok pred prechodom do ďalšieho levelu
            setTimeout(() => {
              setLevel((l) => l + 1);
            }, 750);
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(updateEngine);
    };

    animFrameRef.current = requestAnimationFrame(updateEngine);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [gridSize]);

  // Vykreslenie 3D stien labyrintu
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
    const wallW = Math.max(9, Math.floor(cellW * 0.16));

    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.roundRect(padding, padding, innerW, innerH, 24);
    ctx.fill();

    const draw3DWall = (x1: number, y1: number, x2: number, y2: number) => {
      ctx.lineWidth = wallW;
      ctx.lineCap = "round";
      ctx.strokeStyle = "#008f87";
      ctx.beginPath();
      ctx.moveTo(x1, y1 + 5);
      ctx.lineTo(x2, y2 + 5);
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

    // Rám
    ctx.lineWidth = wallW + 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#008f87";
    ctx.strokeRect(padding, padding + 5, innerW, innerH);
    ctx.strokeStyle = "#00E5D1";
    ctx.strokeRect(padding, padding, innerW, innerH);

    // Vnútorné steny
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

  // Dotykové ovládanie pre mobily a tablety
  const handleTouchInteraction = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const padding = (16 / 440) * rect.width;
    const innerW = rect.width - padding * 2;
    const innerH = rect.height - padding * 2;
    const cellW = innerW / gridSize;
    const cellH = innerH / gridSize;

    const targetC = Math.max(0, Math.min(gridSize - 1, (x - padding) / cellW));
    const targetR = Math.max(0, Math.min(gridSize - 1, (y - padding) / cellH));

    touchTargetRef.current = { x: targetC, y: targetR };
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

          {items.length > 0 ? (
            <div className="top-pill">
              <span className="pill-icon spark-piktogram">✦</span>
              <span className="pill-text">
                {isGateOpen ? "Cieľ otvorený!" : `Objekty: ${remainingCount}`}
              </span>
            </div>
          ) : (
            <div className="top-pill">
              <span className="pill-icon spark-piktogram">★</span>
              <span className="pill-text">Cesta otvorená</span>
            </div>
          )}
        </div>
      </header>

      <main className="maze-game-area">
        <div className="instructions">
          <h2>Svetelné labyrinty</h2>
          <p>
            {isGateOpen
              ? "Cieľ žiari! Preveď Guľka do mince"
              : "Pozbieraj objekty a odomkni cieľovú mincu"}
          </p>
        </div>

        <div className="maze-interactive-wrap">
          <canvas
            ref={canvasRef}
            width={440}
            height={440}
            className="maze-canvas-element"
            onPointerDown={(e) => {
              isInteractingRef.current = true;
              handleTouchInteraction(e.clientX, e.clientY);
            }}
            onPointerMove={(e) => {
              if (isInteractingRef.current) {
                handleTouchInteraction(e.clientX, e.clientY);
              }
            }}
            onPointerUp={() => {
              isInteractingRef.current = false;
              touchTargetRef.current = null;
            }}
            onPointerCancel={() => {
              isInteractingRef.current = false;
              touchTargetRef.current = null;
            }}
          />

          {/* 5 VÝBEROVÝCH PIKTOGRAMOV */}
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
                  alt="Zberateľný objekt"
                  className="exact-talumi-piktogram-img"
                />
              </div>
            );
          })}

          {/* CIEĽOVÝ COIN SPARK */}
          <div
            className="board-overlay-item"
            style={{
              width: `calc((100% - 32px) / ${gridSize})`,
              height: `calc((100% - 32px) / ${gridSize})`,
              transform: `translate3d(calc(16px + ${(gridSize - 1) * 100}%), calc(16px + ${(gridSize - 1) * 100}%), 0)`,
            }}
          >
            <div className={`coin-spark-goal ${isGateOpen ? "glowing" : "veiled"}`}>
              <img
                src="/talumi-decor/coin_spark.png"
                alt="Cieľová minca"
                className="coin-spark-img"
              />
              <div className="goal-haze-overlay" />
            </div>
          </div>

          {/* GUĽKO S RADOSŤOU A POSKOKOM V CIELI */}
          <div
            className={`smooth-gulko-layer ${isLevelCompleted ? "celebrating-goal" : ""}`}
            style={{
              width: `calc((100% - 32px) / ${gridSize})`,
              height: `calc((100% - 32px) / ${gridSize})`,
              transform: `translate3d(calc(16px + ${gulkoPos.x * 100}%), calc(16px + ${gulkoPos.y * 100}%), 0)`,
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
          width: 66%;
          height: 66%;
          object-fit: contain;
          filter: drop-shadow(0 6px 12px rgba(0, 229, 209, 0.45));
          animation: floatPikto 1.8s ease-in-out infinite alternate;
        }

        .coin-spark-goal {
          width: 82%;
          height: 82%;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.4s ease;
        }

        .coin-spark-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          transition: all 0.4s ease;
        }

        .coin-spark-goal.veiled .coin-spark-img {
          opacity: 0.38;
          filter: blur(1.5px) grayscale(0.3) brightness(1.2);
        }

        .coin-spark-goal.veiled .goal-haze-overlay {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.85) 0%, rgba(240, 230, 255, 0.5) 70%, transparent 100%);
          border: 2px dashed #cbb7dc;
        }

        .coin-spark-goal.glowing .coin-spark-img {
          opacity: 1;
          filter: drop-shadow(0 0 16px rgba(0, 229, 209, 0.95)) drop-shadow(0 0 24px rgba(255, 209, 102, 0.8));
          animation: glowCoinPulse 1.4s ease-in-out infinite alternate;
        }

        .coin-spark-goal.glowing .goal-haze-overlay {
          display: none;
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
          filter: drop-shadow(0 6px 12px rgba(51, 0, 91, 0.22));
        }

        /* OSLAVNÝ POSKOK V CIELI */
        .smooth-gulko-layer.celebrating-goal {
          animation: goalHappyJump 0.35s ease-in-out infinite alternate;
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
          animation: goalHappyJump 0.4s ease-in-out infinite alternate;
        }

        @keyframes floatPikto {
          0% { transform: scale(0.92) translateY(0); }
          100% { transform: scale(1.08) translateY(-4px); }
        }

        @keyframes glowCoinPulse {
          0% { transform: scale(0.95); }
          100% { transform: scale(1.12); }
        }

        @keyframes goalHappyJump {
          0% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-16px) scale(1.15) rotate(6deg); }
          100% { transform: translateY(-20px) scale(1.2) rotate(-6deg); }
        }

        @keyframes floatY {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}