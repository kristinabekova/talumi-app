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
  const [matched, setMatched] = useState<{ [key: number]: number }>({}); // questionId -> answer
  const [feedback, setFeedback] = useState<string | null>(null);

  // Drag states
  const [draggedBubble, setDraggedBubble] = useState<BubbleItem | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredQuestionId, setHoveredQuestionId] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Farby bublín podľa vzoru z obrázka (tirkysová, fialovo-ružová, svetlomodrá)
  const colorPalette = ["bubble-cyan", "bubble-purple", "bubble-blue"];

  // Generovanie 3 nových príkladov a 3 prislúchajúcich výsledkov
  const generateLevel = () => {
    const newQuestions: Question[] = [];
    const usedAnswers = new Set<number>();

    while (newQuestions.length < 3) {
      const num1 = Math.floor(Math.random() * 8) + 2;
      const num2 = Math.floor(Math.random() * 8) + 2;
      const ans = num1 * num2;

      if (!usedAnswers.has(ans)) {
        usedAnswers.add(ans);
        newQuestions.push({
          id: Date.now() + newQuestions.length,
          text: `${num1} × ${num2}`,
          answer: ans,
        });
      }
    }

    // Zamiešanie bublín pre pravú stranu
    const newBubbles: BubbleItem[] = Array.from(usedAnswers)
      .sort(() => Math.random() - 0.5)
      .map((val, idx) => ({
        id: idx,
        value: val,
        colorClass: colorPalette[idx % colorPalette.length],
      }));

    setQuestions(newQuestions);
    setBubbles(newBubbles);
    setMatched({});
  };

  useEffect(() => {
    generateLevel();
  }, [level]);

  // Začiatok drag-and-drop (Touch aj Mouse)
  const handleStartDrag = (bubble: BubbleItem, clientX: number, clientY: number) => {
    // Ak už bola táto bublina použitá, nedá sa ťahať
    if (Object.values(matched).includes(bubble.value)) return;

    setDraggedBubble(bubble);
    setDragPos({ x: clientX, y: clientY });
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!draggedBubble) return;
    setDragPos({ x: clientX, y: clientY });

    // Detekcia, nad ktorým príkladom sa nachádzame
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
        // Správne priradenie!
        const newMatched = { ...matched, [hoveredQuestionId]: draggedBubble.value };
        setMatched(newMatched);
        setScore((prev) => prev + 10);
        setFeedback("Super!");

        setTimeout(() => setFeedback(null), 800);

        // Ak sú vyriešené všetky 3 príklady, ide sa na nový level
        if (Object.keys(newMatched).length === 3) {
          setTimeout(() => {
            setLevel((l) => l + 1);
            setFeedback("Level dokončený! 🎉");
          }, 600);
        }
      } else {
        // Nesprávne priradenie
        setFeedback("Skús znova!");
        setTimeout(() => setFeedback(null), 800);
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
      {/* Horná lišta s tlačidlom SPÄŤ a skóre */}
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
          <p>Chytni bublinu a presuň ju na príklad</p>
        </div>

        {feedback && <div className="game-toast-feedback">{feedback}</div>}

        <div className="matching-grid">
          {/* ĽAVÝ STĹPEC: 3 Príklady */}
          <div className="questions-column">
            {questions.map((q) => {
              const isSolved = matched[q.id] !== undefined;
              const isHovered = hoveredQuestionId === q.id;

              return (
                <div
                  key={q.id}
                  data-question-id={q.id}
                  className={`question-card ${isSolved ? "solved" : ""} ${isHovered ? "drop-hover" : ""}`}
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

          {/* PRAVÝ STĹPEC: 3 Neónové Bubliny z priloženého obrázka */}
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
      </main>

      {/* Dragged Bubble Ghost (Bublina pod prstom/myšou) */}
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

      {/* CSS priamo zabudované pre hru */}
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
          padding: 8px 0 20px;
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
        }

        .instructions {
          text-align: center;
          margin-bottom: 24px;
        }

        .instructions h2 {
          font-size: 28px;
          font-weight: 1000;
          color: #33005b;
          margin: 0 0 6px;
        }

        .instructions p {
          font-size: 15px;
          color: #645675;
          margin: 0;
          font-weight: 600;
        }

        .game-toast-feedback {
          position: absolute;
          top: 100px;
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
          gap: 32px;
          width: 100%;
          align-items: center;
          margin-top: 10px;
        }

        /* Ľavé karty s príkladmi */
        .questions-column {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .question-card {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(8px);
          border: 2px solid #e1d3eb;
          border-radius: 24px;
          padding: 16px 24px;
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

        .math-expr {
          font-size: 28px;
          font-weight: 1000;
          color: #33005b;
        }

        .answer-slot {
          width: 60px;
          height: 60px;
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
          width: 58px;
          height: 58px;
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

        /* Pravý stĺpec - Bubliny */
        .bubbles-column {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }

        /* BUBBLING VISUAL STYLING PODĽA OBRÁZKA */
        .bubble-item {
          width: 100px;
          height: 100px;
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
          opacity: 0.2;
          pointer-events: none;
        }

        .bubble-val {
          font-size: 40px;
          font-weight: 1000;
          color: #ffffff;
          z-index: 2;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
        }

        /* Lesk na bubline */
        .bubble-shine {
          position: absolute;
          top: 12%;
          left: 18%;
          width: 26px;
          height: 14px;
          background: rgba(255, 255, 255, 0.65);
          border-radius: 50%;
          transform: rotate(-30deg);
          z-index: 1;
        }

        /* Vzorové farebné kombinácie neónových bublín */
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

        /* Ghost bublina pri ťahaní */
        .dragged-bubble-ghost {
          position: fixed;
          width: 90px;
          height: 90px;
          border-radius: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
          z-index: 999;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0.9;
        }

        .dragged-bubble-ghost span {
          font-size: 36px;
          font-weight: 1000;
          color: #ffffff;
        }

        @keyframes popIn {
          0% { transform: scale(0.8); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }

        @media (max-width: 600px) {
          .matching-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }
          .bubbles-column {
            flex-direction: row;
            justify-content: center;
          }
          .bubble-item {
            width: 80px;
            height: 80px;
          }
          .bubble-val {
            font-size: 32px;
          }
        }
      `}</style>
    </div>
  );
}