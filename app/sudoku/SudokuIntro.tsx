import { useEffect, useState } from "react";
import { loadGame } from "./engine";
import { MiniGrid, CrystalVisual } from "./SudokuVisual";
import { SIZE_META, type SudokuSize } from "./types";

export function SizePicker({ onStart }: { onStart: (size: SudokuSize, resume: boolean) => void }) {
  const [saved, setSaved] = useState<Record<number, boolean>>({});
  useEffect(() => setSaved({ 4: !!loadGame(4), 6: !!loadGame(6), 9: !!loadGame(9) }), []);
  return <div className="size-picker">{([4, 6, 9] as SudokuSize[]).map(size => <article key={size} className="size-card">
    <MiniGrid size={size} />
    <div><small>{SIZE_META[size].label}</small><h3>{SIZE_META[size].mood}</h3><p>Čísla 1 až {size} • bloky {SIZE_META[size].blockRows} × {SIZE_META[size].blockCols}</p></div>
    <div className="size-actions">{saved[size] && <button onClick={() => onStart(size, true)}>Pokračovať</button>}<button className="start" onClick={() => onStart(size, false)}>{saved[size] ? "Nová mriežka" : "Vybrať"}</button></div>
  </article>)}</div>;
}

export function HowToPlay({ onClose }: { onClose: () => void }) {
  return <div className="sudoku-overlay" role="dialog" aria-modal="true" aria-labelledby="how-title"><section className="how-card"><p className="sudoku-kicker">JEDNODUCHÉ PRAVIDLÁ</p><h2 id="how-title">Ako hrať</h2><p>Doplň čísla tak, aby sa v žiadnom riadku, stĺpci ani zvýraznenom bloku neopakovali. Predvyplnené čísla zostávajú na svojom mieste. Hraj pokojne a bez časového obmedzenia.</p>
    <div className="how-demo"><span className="demo-cell given"><b>3</b><small>predvyplnené</small></span><span className="demo-cell selected"><small>vybrané</small></span><span className="demo-cell player"><b>2</b><small>doplnené</small></span><span className="demo-cell"><i>1 4</i><small>poznámka</small></span><span className="demo-cell conflict"><b>3 !</b><small>konflikt</small></span></div>
    <p className="calm-note">Každé políčko má svoje miesto. Dopraj si chvíľu na premyslenie.</p><button className="sudoku-primary" onClick={onClose}>ROZUMIEM</button></section></div>;
}

export function SudokuIntro({ onBack, onStart }: { onBack: () => void; onStart: (size: SudokuSize, resume: boolean) => void }) {
  const [how, setHow] = useState(false);
  return <main className="sudoku-page"><header className="sudoku-top"><button onClick={onBack}>← <span>Späť do Chill zóny</span></button><b>TALUMI</b><span /></header>
    <section className="sudoku-intro"><div className="sudoku-title"><p className="sudoku-kicker">TALUMI • SUDOKU</p><h1>Kryštálová mriežka</h1><h2>Pokojná chvíľa s číslami</h2><p>Vyber si veľkosť mriežky a dopĺňaj čísla vlastným tempom.</p><button className="rules-link" onClick={() => setHow(true)}>Ako hrať</button></div><CrystalVisual /></section>
    <SizePicker onStart={onStart} />{how && <HowToPlay onClose={() => setHow(false)} />}
  </main>;
}
