"use client";

import React, { useState, useEffect, useRef } from "react";

interface NeonBubblesProps {
  onBack?: () => void;
}

interface Question {
  id: number;
  text: string;
  answer: number;
}

interface BubbleItem {
  id: number;
  value: number;
  colorClass: string;
}

export default function NeonBubbles({ onBack }: NeonBubblesProps) {
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [bubbles, setBubbles] = useState<BubbleItem[]>([]);
  const [matched, setMatched] = useState<{ [key: number]: number }>({});
  const [wrongQuestionId, setWrongQuestionId] = useState<number | null>(null);
  const [isLevelCompleted, setIsLevelCompleted] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Drag states
  const [draggedBubble, setDraggedBubble] = useState<BubbleItem | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredQuestionId, setHoveredQuestionId] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const colorPalette = ["bubble-cyan", "bubble-purple", "bubble-blue"];

  // Zvuková odozva cez Web Audio API
  const playSound = (type: "correct" | "wrong") => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      if (type === "correct") {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = "sine";
        osc2.type = "triangle";

        osc1.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc1.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.12);

        osc2.frequency.setValueAtTime(1046.5, ctx.currentTime);
        osc2.frequency.exponentialRampToValueAtTime(1318.5, ctx.currentTime + 0.12);

        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start();
        osc2.start();
        osc1.stop(ctx.currentTime + 0.25);
        osc2.stop(ctx.currentTime + 0.25);
      } else {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(160, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.18);

        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      }
    } catch {
      // Audio kontekt je ignorovaný ak prehliadač blokuje autoplay
    }
  };

  // Generovanie príkladov + garantované zamiešanie poradí bublín
  const generateLevel = () => {
    const newQuestions: Question[] = [];
    const usedAnswers = new Set<number>();

    while (newQuestions.length < 3) {
      const isAddition = Math.random() > 0.5;
      let text = "";
      let ans = 0;

      if (isAddition) {
        const num1 = Math.floor(Math.random() * 15) + 1;
        const maxNum2 = 20 - num1;
        const num2 = Math.floor(Math.random() * maxNum2) + 1;
        ans = num1 + num2;
        text = `${num1} + ${num2}`;
      } else {
        const num1 = Math.floor(Math.random() * 16) + 5;
        const num2 = Math.floor(Math.random() * (num1 - 1)) + 1;
        ans = num1 - num2;
        text = `${num1} − ${num2}`;
      }

      if (!usedAnswers.has(ans)) {
        usedAnswers.add(ans);
        newQuestions.push({
          id: Date.now() + newQuestions.length,
          text: text,
          answer: ans,
        });
      }
    }

    // Vytvorenie zoznamu odpovedí
    let answerValues = newQuestions.map((q) => q.answer);

    // Garantované premiešanie, aby žiadna odpoveď nezostala v rovnakom riadku ako príklad
    let shuffled = [...answerValues];
    let isSamePosition = true;
    let attempts = 0;

    while (isSamePosition && attempts < 20) {
      shuffled.sort(() => Math.random() - 0.5);
      // Kontrola, či aspoň jedna položka nie je na pôvodnom indexe
      isSamePosition = shuffled.some((val, idx) => val === newQuestions[idx].answer);
      attempts++;
    }

    const newBubbles: BubbleItem[] = shuffled.map((val, idx) => ({
      id: idx,
      value: val,
      colorClass: colorPalette[idx % colorPalette.length],
    }));

    setQuestions(newQuestions);
    setBubbles(newBubbles);
    setMatched({});
    setIsLevelCompleted(false);
  };

  useEffect(() => {
    generateLevel();
  }, [level]);

  const handleStartDrag = (bubble: BubbleItem, clientX: number, clientY: number) => {
    if (Object.values(matched).includes(bubble.value)) return;
    setDraggedBubble(bubble);
    setDragPos({ x: clientX, y: clientY });
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!draggedBubble) return;
    setDragPos({ x: clientX, y: clientY });

    const elements = document.elementsFromPoint(clientX, clientY);
    const questionEl = elements.find((el) => el.hasAttribute("data-question-id"));

    if (questionEl) {
      const qId = Number(questionEl.getAttribute("data-question-id"));
      setHoveredQuestionId(qId);
    } else {
      setHoveredQuestionId(null);
    }
  };

  const handleEndDrag = () => {
    if (!draggedBubble) return;

    if (hoveredQuestionId !== null) {
      const targetQuestion = questions.find((q) => q.id === hoveredQuestionId);

      if (targetQuestion && targetQuestion.answer === draggedBubble.value) {
        playSound("correct");
        const newMatched = { ...matched, [hoveredQuestionId]: draggedBubble.value };
        setMatched(newMatched);
        setScore((prev) => prev + 10);
        setFeedback("Výborne!");

        setTimeout(() => setFeedback(null), 800);

        if (Object.keys(newMatched).length === 3) {
          setIsLevelCompleted(true);
          setTimeout(() => {
            setLevel((l) => l + 1);
          }, 1200);
        }
      } else {
        playSound("wrong");
        setWrongQuestionId(hoveredQuestionId);
        setFeedback("Skús znova!");

        setTimeout(() => {
          setWrongQuestionId(null);
          setFeedback(null);
        }, 600);
      }
    }

    setDraggedBubble(null);
    setHoveredQuestionId(null);
  };

  return (
    <div
      ref={containerRef}
      className="neon-bubbles-stage"
      onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
      onMouseUp={handleEndDrag}
      onTouchMove={(e) => {
        if (e.touches.length > 0) {
          handleMove(e.touches[0].clientX, e.touches[0].clientY);
        }
      }}
      onTouchEnd={handleEndDrag}
    >
      {/* Horná lišta */}
      <header className="neon-top-bar">
        <button className="back-btn" onClick={onBack} aria-label="Späť na výber zón">
          ←
        </button>
        <h1 className="game-title">Neónové bubliny</h1>
        <div className="game-status-pills">
          <span className="pill">LEVEL <b>{level}</b></span>
          <span className="pill gold">SKÓRE <b>{score}</b></span>
        </div>
      </header>

      {/* Hlavná herná plocha */}
      <main className="neon-game-area">
        <div className="instructions">
          <h2>Priraď správny výsledok k príkladu</h2>
          <p>Sčítavanie a odčítavanie do 20</p>
        </div>

        {feedback && <div className="game-toast-feedback">{feedback}</div>}

        <div className="matching-grid">
          {/* ĽAVÝ STĹPEC: 3 Príklady */}
          <div className="questions-column">
            {questions.map((q) => {
              const isSolved = matched[q.id] !== undefined;
              const isHovered = hoveredQuestionId === q.id;
              const isWrong = wrongQuestionId === q.id;

              return (
                <div
                  key={q.id}
                  data-question-id={q.id}
                  className={`question-card ${isSolved ? "solved" : ""} ${isHovered ? "drop-hover" : ""} ${
                    isWrong ? "wrong-shake" : ""
                  }`}
                >
                  <span className="math-expr">{q.text} =</span>
                  <div className="answer-slot">
                    {isSolved ? (
                      <div className="placed-bubble">{matched[q.id]}</div>
                    ) : (
                      <span className="slot-placeholder">?</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* PRAVÝ STĹPEC: Náhodne premiešané bubliny */}
          <div className="bubbles-column">
            {bubbles.map((b) => {
              const isUsed = Object.values(matched).includes(b.value);

              return (
                <div
                  key={b.id}
                  className={`bubble-item ${b.colorClass} ${isUsed ? "used" : ""}`}
                  onMouseDown={(e) => handleStartDrag(b, e.clientX, e.clientY)}
                  onTouchStart={(e) => {
                    if (e.touches.length > 0) {
                      handleStartDrag(b, e.touches[0].clientX, e.touches[0].clientY);
                    }
                  }}
                >
                  <span className="bubble-val">{b.value}</span>
                  <div className="bubble-shine" />
                </div>
              );
            })}
          </div>
        </div>

        {/* GUĽKO MASKOT */}
        <div className={`gulko-mascot-wrapper ${isLevelCompleted ? "celebrate" : "floating"}`}>
          <img
            src={isLevelCompleted ? "/talumi-gulko-wave.png" : "/talumi-gulko-default.png"}
            alt="Guľko maskot"
            className="gulko-mascot-img"
          />
        </div>
      </main>

      {/* Ghost bublina pri ťahaní */}
      {draggedBubble && (
        <div
          className={`dragged-bubble-ghost ${draggedBubble.colorClass}`}
          style={{
            left: `${dragPos.x}px`,
            top: `${dragPos.y}px`,
          }}
        >
          <span>{draggedBubble.value}</span>
          <div className="bubble-shine" />
        </div>
      )}

      <style jsx>{`
        .neon-bubbles-stage {
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
          max-width: 900px;
          margin: 0 auto;
          width: 100%;
          padding: 8px 0 16px;
        }

        .back-btn {
          width: 46px;
          height: 46px;
          border-radius: 50%;
          border: 0;
          background: #ffffff;
          box-shadow: 0 4px 14px rgba(51, 0, 91, 0.12);
          font-size: 22px;
          font-weight: 900;
          color: #33005b;
          cursor: pointer;
          transition: transform 0.15s ease;
        }
        .back-btn:hover {
          transform: scale(1.08);
        }

        .game-title {
          font-size: 24px;
          font-weight: 1000;
          color: #33005b;
          margin: 0;
        }

        .game-status-pills {
          display: flex;
          gap: 8px;
        }

        .pill {
          background: rgba(255, 255, 255, 0.9);
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 900;
          color: #33005b;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        }

        .pill.gold {
          background: #ffd166;
          color: #33005b;
        }

        .neon-game-area {
          max-width: 800px;
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
          margin-bottom: 20px;
        }

        .instructions h2 {
          font-size: 26px;
          font-weight: 1000;
          color: #33005b;
          margin: 0 0 4px;
        }

        .instructions p {
          font-size: 14px;
          color: #645675;
          margin: 0;
          font-weight: 600;
        }

        .game-toast-feedback {
          position: absolute;
          top: 85px;
          background: #33005b;
          color: #00e5d1;
          padding: 8px 24px;
          border-radius: 30px;
          font-weight: 900;
          font-size: 18px;
          box-shadow: 0 10px 25px rgba(51, 0, 91, 0.25);
          animation: popIn 0.2s ease;
          z-index: 10;
        }

        .matching-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 28px;
          width: 100%;
          align-items: center;
          margin-top: 10px;
        }

        .questions-column {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .question-card {
          background: rgba(255, 255, 255, 0.88);
          backdrop-filter: blur(8px);
          border: 2px solid #e1d3eb;
          border-radius: 24px;
          padding: 14px 22px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 8px 20px rgba(51, 0, 91, 0.06);
          transition: all 0.2s ease;
        }

        .question-card.drop-hover {
          border-color: #00e5d1;
          background: rgba(234, 255, 253, 0.95);
          transform: scale(1.02);
        }

        .question-card.solved {
          border-color: #00e5d1;
          background: #ffffff;
        }

        .question-card.wrong-shake {
          border-color: #ff0055 !important;
          background: #ffe6ee !important;
          box-shadow: 0 0 20px rgba(255, 0, 85, 0.35) !important;
          animation: shake 0.35s ease;
        }

        .math-expr {
          font-size: 28px;
          font-weight: 1000;
          color: #33005b;
        }

        .answer-slot {
          width: 58px;
          height: 58px;
          border-radius: 50%;
          border: 2px dashed #bba1d0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .slot-placeholder {
          font-size: 20px;
          color: #a491b8;
          font-weight: 800;
        }

        .placed-bubble {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, #00e5d1, #00aaa3);
          color: #ffffff;
          font-weight: 1000;
          font-size: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0, 229, 209, 0.4);
        }

        .bubbles-column {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 18px;
        }

        .bubble-item {
          width: 96px;
          height: 96px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          cursor: grab;
          transition: transform 0.2s ease, opacity 0.2s ease;
          touch-action: none;
        }

        .bubble-item:hover {
          transform: scale(1.06);
        }

        .bubble-item.used {
          opacity: 0.18;
          pointer-events: none;
        }

        .bubble-val {
          font-size: 38px;
          font-weight: 1000;
          color: #ffffff;
          z-index: 2;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
        }

        .bubble-shine {
          position: absolute;
          top: 12%;
          left: 18%;
          width: 24px;
          height: 13px;
          background: rgba(255, 255, 255, 0.65);
          border-radius: 50%;
          transform: rotate(-30deg);
          z-index: 1;
        }

        .bubble-cyan {
          background: radial-gradient(circle at 35% 35%, #80fbf1 0%, #00d3c5 50%, #008f87 100%);
          box-shadow: 0 10px 25px rgba(0, 211, 197, 0.45), inset 0 -6px 12px rgba(0, 0, 0, 0.15);
          border: 3px solid #b3fff8;
        }

        .bubble-purple {
          background: radial-gradient(circle at 35% 35%, #e8aaff 0%, #b850ff 50%, #760cc7 100%);
          box-shadow: 0 10px 25px rgba(184, 80, 255, 0.45), inset 0 -6px 12px rgba(0, 0, 0, 0.15);
          border: 3px solid #f3d4ff;
        }

        .bubble-blue {
          background: radial-gradient(circle at 35% 35%, #82c3ff 0%, #2b82ff 50%, #0045b5 100%);
          box-shadow: 0 10px 25px rgba(43, 130, 255, 0.45), inset 0 -6px 12px rgba(0, 0, 0, 0.15);
          border: 3px solid #cae4ff;
        }

        .dragged-bubble-ghost {
          position: fixed;
          width: 88px;
          height: 88px;
          border-radius: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
          z-index: 999;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0.92;
        }

        .dragged-bubble-ghost span {
          font-size: 36px;
          font-weight: 1000;
          color: #ffffff;
        }

        .gulko-mascot-wrapper {
          position: absolute;
          bottom: -10px;
          right: 0px;
          width: 105px;
          height: 105px;
          pointer-events: none;
          z-index: 5;
        }

        .gulko-mascot-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          filter: drop-shadow(0 8px 16px rgba(51, 0, 91, 0.18));
        }

        .gulko-mascot-wrapper.floating {
          animation: floatY 3s ease-in-out infinite;
        }

        .gulko-mascot-wrapper.celebrate {
          animation: waveJump 0.6s ease-in-out infinite alternate;
        }

        @keyframes floatY {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }

        @keyframes waveJump {
          0% { transform: translateY(0) scale(1); }
          100% { transform: translateY(-16px) scale(1.08); }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }

        @keyframes popIn {
          0% { transform: scale(0.8); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }

        @media (max-width: 600px) {
          .matching-grid {
            grid-template-columns: 1fr;
            gap: 18px;
          }
          .bubbles-column {
            flex-direction: row;
            justify-content: center;
          }
          .bubble-item {
            width: 78px;
            height: 78px;
          }
          .bubble-val {
            font-size: 30px;
          }
          .gulko-mascot-wrapper {
            width: 75px;
            height: 75px;
            bottom: -5px;
            right: -5px;
          }
        }
      `}</style>
    </div>
  );
}