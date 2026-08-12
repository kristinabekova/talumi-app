"use client";

import React, { useState, useEffect } from 'react';

const generateEquations = () => {
  const equations = [];
  const answers = new Set();

  while (equations.length < 3) {
    const isAddition = Math.random() > 0.5;
    let a, b, answer;

    if (isAddition) {
      a = Math.floor(Math.random() * 11);
      b = Math.floor(Math.random() * 11);
      answer = a + b;
    } else {
      a = Math.floor(Math.random() * 11) + 10;
      b = Math.floor(Math.random() * 11);
      answer = a - b;
    }

    if (!answers.has(answer)) {
      answers.add(answer);
      equations.push({
        id: equations.length,
        text: `${a} ${isAddition ? '+' : '-'} ${b} =`,
        answer: answer,
      });
    }
  }

  const shuffledBubbles = [...equations].sort(() => Math.random() - 0.5);
  return { equations, bubbles: shuffledBubbles };
};

export default function NeonBubbles() {
  const [equations, setEquations] = useState([]);
  const [bubbles, setBubbles] = useState([]);
  const [matched, setMatched] = useState({});
  const [selectedBubble, setSelectedBubble] = useState(null);
  const [isVictorious, setIsVictorious] = useState(false);

  useEffect(() => {
    startNewGame();
  }, []);

  const startNewGame = () => {
    const { equations, bubbles } = generateEquations();
    setEquations(equations);
    setBubbles(bubbles);
    setMatched({});
    setSelectedBubble(null);
    setIsVictorious(false);
  };

  const handleBubbleClick = (bubble) => {
    if (!Object.values(matched).includes(bubble.answer)) {
      setSelectedBubble(bubble);
    }
  };

  const handleEquationClick = (equation) => {
    if (!selectedBubble) return;

    if (equation.answer === selectedBubble.answer) {
      const newMatched = { ...matched, [equation.id]: selectedBubble.answer };
      setMatched(newMatched);
      setSelectedBubble(null);

      if (Object.keys(newMatched).length === 3) {
        setIsVictorious(true);
      }
    } else {
      setSelectedBubble(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 font-sans">
      <div className="flex flex-col items-center mb-8">
        <div className={`w-32 h-32 rounded-full mb-4 flex items-center justify-center transition-transform duration-500 ${isVictorious ? 'bg-green-400 scale-110 shadow-[0_0_40px_#4ade80]' : 'bg-purple-500 shadow-[0_0_20px_#a855f7] animate-pulse'}`}>
          <span className="text-4xl">{isVictorious ? '😄' : '🙂'}</span>
        </div>
        <h1 className="text-3xl text-white font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
          Neónové bubliny
        </h1>
        <p className="text-gray-400 mt-2">Priraď správny výsledok</p>
      </div>

      <div className="flex flex-col md:flex-row gap-12 w-full max-w-3xl">
        <div className="flex flex-col gap-6 flex-1">
          {equations.map((eq) => (
            <div key={eq.id} className="flex items-center justify-between bg-slate-900/50 p-4 rounded-2xl border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
              <span className="text-2xl text-white font-bold ml-4">{eq.text}</span>
              <button 
                onClick={() => handleEquationClick(eq)}
                className={`w-16 h-16 rounded-full border-2 border-dashed flex items-center justify-center text-xl font-bold transition-all
                  ${matched[eq.id] 
                    ? 'border-green-400 bg-green-400/20 text-green-300 shadow-[0_0_20px_#4ade80]' 
                    : 'border-purple-500/50 hover:border-purple-400 hover:bg-purple-500/10 text-transparent'}`}
              >
                {matched[eq.id] ? matched[eq.id] : '?'}
              </button>
            </div>
          ))}
        </div>

        <div className="flex flex-row md:flex-col justify-center gap-6">
          {bubbles.map((bubble, idx) => {
            const isMatched = Object.values(matched).includes(bubble.answer);
            if (isMatched) return <div key={idx} className="w-16 h-16 opacity-0" />;

            const isSelected = selectedBubble?.id === bubble.id;

            return (
              <button
                key={bubble.id}
                onClick={() => handleBubbleClick(bubble)}
                className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white transition-all transform hover:scale-110
                  ${isSelected 
                    ? 'bg-pink-500 shadow-[0_0_30px_#ec4899] scale-110' 
                    : 'bg-purple-600 shadow-[0_0_15px_#9333ea]'}
                  ${idx % 2 === 0 ? 'animate-[bounce_3s_infinite]' : 'animate-[bounce_4s_infinite]'}`}
              >
                {bubble.answer}
              </button>
            );
          })}
        </div>
      </div>

      {isVictorious && (
        <div className="mt-12 animate-bounce">
          <button 
            onClick={startNewGame}
            className="px-8 py-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full text-white font-bold text-lg shadow-[0_0_25px_#4ade80] hover:scale-105 transition-transform"
          >
            Ďalšie kolo!
          </button>
        </div>
      )}
    </div>
  );
}