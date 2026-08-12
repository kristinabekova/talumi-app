"use client";

import { useState } from "react";
import SudokuGame from "./SudokuGame";
import { SudokuIntro } from "./SudokuIntro";
import type { SudokuSize } from "./types";

export default function SudokuApp({ onBack }: { onBack: () => void }) {
  const [play, setPlay] = useState<{ size: SudokuSize; resume: boolean } | null>(null);
  if (play) return <SudokuGame size={play.size} resume={play.resume} onBack={onBack} onChooseSize={() => setPlay(null)} />;
  return <SudokuIntro onBack={onBack} onStart={(size, resume) => setPlay({ size, resume })} />;
}
