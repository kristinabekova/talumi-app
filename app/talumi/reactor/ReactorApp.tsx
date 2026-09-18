"use client";

import { useState } from "react";
import { DifficultySelect } from "./DifficultySelect";
import { ReactorGame } from "./ReactorGame";
import type { Difficulty } from "./types";

export function ReactorApp({ onBack }: { onBack: () => void }) {
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  if (difficulty)
    return (
      <ReactorGame difficulty={difficulty} onBack={() => setDifficulty(null)} />
    );
  return <DifficultySelect onBack={onBack} onSelect={setDifficulty} />;
}
