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
  const [milestoneMessage, setMilestoneMessage] = useState<string | null>(null);

  const [gulkoPos, setGulkoPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const currentPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const targetPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const gridPosRef = useRef<{ r: number; c: number }>({ r: 0, c: 0 });

  const mazeRef = useRef<Cell[][]>([]);
  const itemsRef = useRef<Item[]>([]);
  const isGateOpenRef = useRef(true);
  const isLockedRef = useRef(false);
  const animFrameRef = useRef<number | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isPointerActiveRef = useRef(false);

  const allowedCollectables = [
    "clover.png",
    "cross_x.png",
    "face_funny.png",
    "puzzle.png",
    "star_hollow.png",
  ];

  const playSound = (type: "pickup" | "unlock" | "win" | "milestone") => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.28);
        gain.gain.setValueAtTime(0.22, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.32);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.32);
      } else if (type === "win") {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        osc1.type = "sine";
        osc2.type = "triangle";
        osc1.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc1.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.3);
        osc2.frequency.setValueAtTime(659.25, ctx.currentTime);
        osc2.frequency.exponentialRampToValueAtTime(1318.5, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        osc1.start();
        osc2.start();
        osc1.stop(ctx.currentTime + 0.5);
        osc2.stop(ctx.currentTime + 0.5);
      } else if (type === "milestone") {
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);
          gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + idx * 0.1 + 0.2);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.1);
          osc.stop(ctx.currentTime + idx * 0.1 + 0.2);
        });
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

  const startLevel = (nextLvl: number) => {
    const currentSize = 6 + Math.floor((nextLvl - 1) / 5);
    const cappedSize = Math.min(currentSize, 8);
    setGridSize(cappedSize);

    const newMaze = generateComplexMaze(cappedSize);
    mazeRef.current = newMaze;
    setMaze(newMaze);

    gridPosRef.current = { r: 0, c: 0 };
    currentPosRef.current = { x: 0, y: 0 };
    targetPosRef.current = { x: 0, y: 0 };
    setGulkoPos({ x: 0, y: 0 });

    isLockedRef.current = false;
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
    startLevel(level);
  }, [level]);

  useEffect(() => {
    const renderLoop = () => {
      const cur = currentPosRef.current;
      const target = targetPosRef.current;

      const dx = target.x - cur.x;
      const dy = target.y - cur.y;

      if (Math.abs(dx) > 0.001 || Math.abs(dy) > 0.001) {
        cur.x += dx * 0.28;
        cur.y += dy * 0.28;
      } else {
        cur.x = target.x;
        cur.y = target.y;
      }

      setGulkoPos({ x: cur.x, y: cur.y });
      animFrameRef.current = requestAnimationFrame(renderLoop);
    };

    animFrameRef.current = requestAnimationFrame(renderLoop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const handleLevelFinished = (currentCompletedLevel: number) => {
    const nextLevel = currentCompletedLevel + 1;
    if (currentCompletedLevel % 5 === 0) {
      playSound("milestone");
      if (currentCompletedLevel === 5) {
        setMilestoneMessage("Si super! Máš úspešne zvládnutých prvých 5 levelov!");
      } else if (currentCompletedLevel === 10) {
        setMilestoneMessage("Už máš 10 levelov! Ide ti to fantasticky!");
      } else if (currentCompletedLevel === 15) {
        setMilestoneMessage("Neuveriteľné! Už máš 15 levelov, si naozaj top!");
      } else {
        setMilestoneMessage(`Skvelá práca! Už máš dokončených ${currentCompletedLevel} levelov!`);
      }
    } else {
      setLevel(nextLevel);
    }
  };

  const tryMoveTo = (targetR: number, targetC: number) => {
    if (isLockedRef.current || milestoneMessage) return;
    const curR = gridPosRef.current.r;
    const curC = gridPosRef.current.c;

    if (targetR < 0 || targetR >= gridSize || targetC < 0 || targetC >= gridSize) return;
    if (targetR === curR && targetC === curC) return;

    const dr = targetR - curR;
    const dc = targetC - curC;

    if (Math.abs(dr) + Math.abs(dc) !== 1) return;

    const currentCell = mazeRef.current[curR]?.[curC];
    if (!currentCell) return;

    if (dr === -1 && currentCell.top) return;
    if (dr === 1 && currentCell.bottom) return;
    if (dc === -1 && currentCell.left) return;
    if (dc === 1 && currentCell.right) return;

    // Presun
    gridPosRef.current = { r: targetR, c: targetC };
    targetPosRef.current = { x: targetC, y: targetR };

    const items = itemsRef.current;
    const foundIdx = items.findIndex((it) => it.r === targetR && it.c === targetC && !it.collected);
    if (foundIdx !== -1) {
      playSound("pickup");
      items[foundIdx].collected = true;
      setItems([...items]);

      if (items.every((it) => it.collected)) {
        playSound("unlock");
        isGateOpenRef.current = true;
        setIsGateOpen(true);
      }
    }

    // DOSIAHNUTIE CIEĽA: Zablokujeme pohyb a spustíme 1.4s oslavu v cieli
    if (targetR === gridSize - 1 && targetC === gridSize - 1) {
      if (isGateOpenRef.current && !isLockedRef.current) {
        isLockedRef.current = true;
        setIsLevelCompleted(true);
        playSound("win");

        // Zafixujeme pozíciu v cieli
        targetPosRef.current = { x: targetC, y: targetR };

        const currentLvl = level;
        setTimeout(() => {
          handleLevelFinished(currentLvl);
        }, 1400);
      }
    }
  };

  const handlePointerInteraction = (clientX: number, clientY: number) => {
    if (isLockedRef.current || milestoneMessage) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const padding = (14 / 440) * rect.width;
    const innerW = rect.width - padding * 2;
    const innerH = rect.height - padding * 2;
    const cellW = innerW / gridSize;
    const cellH = innerH / gridSize;

    const touchC = Math.floor((x - padding) / cellW);
    const touchR = Math.floor((y - padding) / cellH);

    const curR = gridPosRef.current.r;
    const curC = gridPosRef.current.c;

    if (Math.abs(touchR - curR) + Math.abs(touchC - curC) === 1) {
      tryMoveTo(touchR, touchC);
    } else {
      const dx = (x - padding) / cellW - (curC + 0.5);
      const dy = (y - padding) / cellH - (curR + 0.5);

      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0.4) tryMoveTo(curR, curC + 1);
        else if (dx < -0.4) tryMoveTo(curR, curC - 1);
      } else {
        if (dy > 0.4) tryMoveTo(curR + 1, curC);
        else if (dy < -0.4) tryMoveTo(curR - 1, curC);
      }
    }
  };

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
    const wallW = Math.max(10, Math.floor(cellW * 0.18));

    ctx.clearRect(0, 0, width, height);

    const bgGrad = ctx.createRadialGradient(
      width / 2,
      height / 2,
      20,
      width / 2,
      height / 2,
      width * 0.7
    );
    bgGrad.addColorStop(0, "#ffffff");
    bgGrad.addColorStop(1, "#f4fbff");

    ctx.fillStyle = bgGrad;
    ctx.beginPath();
    ctx.roundRect(padding, padding, innerW, innerH, 20);
    ctx.fill();

    ctx.strokeStyle = "rgba(0, 229, 209, 0.08)";
    ctx.lineWidth = 1.5;
    for (let i = 1; i < gridSize; i++) {
      ctx.beginPath();
      ctx.moveTo(padding + i * cellW, padding);
      ctx.lineTo(padding + i * cellW, padding + innerH);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(padding, padding + i * cellH);
      ctx.lineTo(padding + innerW, padding + i * cellH);
      ctx.stroke();
    }

    const buildWallPath = (offsetY: number) => {
      ctx.beginPath();
      ctx.roundRect(padding, padding + offsetY, innerW, innerH, 18);

      for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
          const cell = maze[r][c];
          const x = padding + c * cellW;
          const y = padding + r * cellH;

          if (cell.top && r > 0) {
            ctx.moveTo(x, y + offsetY);
            ctx.lineTo(x + cellW, y + offsetY);
          }
          if (cell.left && c > 0) {
            ctx.moveTo(x, y + offsetY);
            ctx.lineTo(x, y + cellH + offsetY);
          }
          if (cell.bottom && r < gridSize - 1) {
            ctx.moveTo(x, y + cellH + offsetY);
            ctx.lineTo(x + cellW, y + cellH + offsetY);
          }
          if (cell.right && c < gridSize - 1) {
            ctx.moveTo(x + cellW, y + offsetY);
            ctx.lineTo(x + cellW, y + cellH + offsetY);
          }
        }
      }
    };

    ctx.lineWidth = wallW;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#008f87";
    buildWallPath(5);
    ctx.stroke();

    ctx.lineWidth = wallW;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#00E5D1";
    buildWallPath(0);
    ctx.stroke();

    ctx.lineWidth = Math.max(3, wallW * 0.3);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#b3fff8";
    buildWallPath(-1.5);
    ctx.stroke();
  }, [maze, gridSize]);

  useEffect(() => {
    drawMazeCanvas();
  }, [drawMazeCanvas]);

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
              isPointerActiveRef.current = true;
              handlePointerInteraction(e.clientX, e.clientY);
            }}
            onPointerMove={(e) => {
              if (isPointerActiveRef.current) {
                handlePointerInteraction(e.clientX, e.clientY);
              }
            }}
            onPointerUp={() => {
              isPointerActiveRef.current = false;
            }}
            onPointerCancel={() => {
              isPointerActiveRef.current = false;
            }}
          />

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

          {/* CIEĽOVÁ MINCA COIN SPARK */}
          <div
            className="board-overlay-item"
            style={{
              width: `calc((100% - 32px) / ${gridSize})`,
              height: `calc((100% - 32px) / ${gridSize})`,
              transform: `translate3d(calc(16px + ${(gridSize - 1) * 100}%), calc(16px + ${(gridSize - 1) * 100}%), 0)`,
              zIndex: 5,
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

          {/* GUĽKO: V CIELI VIDITEĽNE PULZUJE A SKÁČE 1.4s NAD MINCOU */}
          <div
            className={`smooth-gulko-layer ${isLevelCompleted ? "celebrating-at-goal" : ""}`}
            style={{
              width: `calc((100% - 32px) / ${gridSize})`,
              height: `calc((100% - 32px) / ${gridSize})`,
              transform: `translate3d(calc(16px + ${gulkoPos.x * 100}%), calc(16px + ${gulkoPos.y * 100}%), 0)`,
              zIndex: 35,
            }}
          >
            <div className="clean-gulko-sphere">
              <img
                src={isLevelCompleted ? "/talumi-gulko-wave.png" : "/talumi-gulko-default.png"}
                alt="Guľko"
                className="sphere-img"
              />
            </div>
          </div>
        </div>

        {milestoneMessage && (
          <div className="milestone-modal-backdrop">
            <div className="milestone-modal-card">
              <div className="milestone-mascot-wrap">
                <div className="clean-gulko-sphere">
                  <img src="/talumi-gulko-wave.png" alt="Guľko sa teší" className="sphere-img" />
                </div>
              </div>
              <h3>Paráda!</h3>
              <p>{milestoneMessage}</p>
              <button
                className="milestone-btn"
                onClick={() => {
                  setMilestoneMessage(null);
                  setLevel((l) => l + 1);
                }}
              >
                Pokračovať ďalej →
              </button>
            </div>
          </div>
        )}

        <div className={`gulko-bottom-mascot ${isLevelCompleted ? "wave-jump" : "float"}`}>
          <div className="clean-gulko-sphere">
            <img
              src={isLevelCompleted ? "/talumi-gulko-wave.png" : "/talumi-gulko-default.png"}
              alt="Guľko maskot"
              className="sphere-img"
            />
          </div>
        </div>
      </main>

      <style jsx>{`
        .neon-maze-stage {
          min-height: 100dvh;
          background: radial-gradient(circle at 50% 20%, #ffffff 0%, #f4faff 60%, #eaf4ff 100%);
          display: flex;
          flex-direction: column;
          user-select: none;
          touch-action: none;
          padding: 16px 16px env(safe-area-inset-bottom, 24px);
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
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
          will-change: transform;
        }

        .clean-gulko-sphere {
          width: 100%;
          height: 100%;
          border-radius: 50% !important;
          -webkit-border-radius: 50% !important;
          clip-path: circle(50% at 50% 50%) !important;
          -webkit-clip-path: circle(50% at 50% 50%) !important;
          background: transparent !important;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden !important;
          filter: drop-shadow(0 4px 10px rgba(51, 0, 91, 0.25));
          -webkit-filter: drop-shadow(0 4px 10px rgba(51, 0, 91, 0.25));
        }

        .sphere-img {
          width: 100%;
          height: 100%;
          object-fit: cover !important;
          border-radius: 50% !important;
          display: block;
        }

        /* OSLAVNÉ PULZOVANIE A VÝSKOK V CIELI */
        .smooth-gulko-layer.celebrating-at-goal {
          animation: victoryGoalPulse 0.45s ease-in-out infinite alternate !important;
        }

        .milestone-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(51, 0, 91, 0.45);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          animation: fadeIn 0.25s ease;
          padding: 20px;
        }

        .milestone-modal-card {
          background: #ffffff;
          border-radius: 32px;
          padding: 28px 24px;
          text-align: center;
          max-width: 360px;
          width: 100%;
          box-shadow: 0 20px 45px rgba(51, 0, 91, 0.25);
          border: 4px solid #00e5d1;
          animation: scaleUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .milestone-mascot-wrap {
          width: 90px;
          height: 90px;
          margin: 0 auto 12px;
          animation: floatY 2.5s ease-in-out infinite;
        }

        .milestone-gulko-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          border-radius: 50%;
        }

        .milestone-modal-card h3 {
          font-size: 26px;
          font-weight: 1000;
          color: #33005b;
          margin: 0 0 8px;
        }

        .milestone-modal-card p {
          font-size: 16px;
          font-weight: 700;
          color: #645675;
          margin: 0 0 22px;
          line-height: 1.4;
        }

        .milestone-btn {
          width: 100%;
          padding: 14px;
          border-radius: 30px;
          border: 0;
          background: linear-gradient(135deg, #00e5d1, #00b4a7);
          color: #ffffff;
          font-size: 17px;
          font-weight: 900;
          cursor: pointer;
          box-shadow: 0 8px 18px rgba(0, 229, 209, 0.4);
          transition: transform 0.15s ease;
        }
        .milestone-btn:hover {
          transform: scale(1.04);
        }

        .gulko-bottom-mascot {
          position: absolute;
          bottom: calc(env(safe-area-inset-bottom, 0px) + 8px);
          right: 12px;
          width: 80px;
          height: 80px;
          pointer-events: none;
          z-index: 20;
        }

        .gulko-bottom-mascot.float {
          animation: floatY 3s ease-in-out infinite;
        }

        .gulko-bottom-mascot.wave-jump {
          animation: victoryGoalPulse 0.4s ease-in-out infinite alternate;
        }

        @keyframes floatPikto {
          0% { transform: scale(0.92) translateY(0); }
          100% { transform: scale(1.08) translateY(-4px); }
        }

        @keyframes glowCoinPulse {
          0% { transform: scale(0.95); }
          100% { transform: scale(1.12); }
        }

        @keyframes victoryGoalPulse {
          0% {
            transform: scale(1) translateY(0);
            filter: drop-shadow(0 4px 10px rgba(51, 0, 91, 0.3));
          }
          50% {
            transform: scale(1.35) translateY(-14px) rotate(8deg);
            filter: drop-shadow(0 0 18px rgba(0, 229, 209, 0.95));
          }
          100% {
            transform: scale(1.42) translateY(-18px) rotate(-8deg);
            filter: drop-shadow(0 0 26px rgba(255, 0, 238, 0.95));
          }
        }

        @keyframes floatY {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes scaleUp {
          from { transform: scale(0.85); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}