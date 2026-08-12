export function CrystalVisual({ mini = false }: { mini?: boolean }) {
  return <div className={mini ? "crystal-visual mini" : "crystal-visual"} aria-hidden="true">
    <img src="/talumi-crystal-grid-visual.png" alt="" />
  </div>;
}

export function MiniGrid({ size }: { size: 4 | 6 | 9 }) {
  return <span className="mini-sudoku" style={{ gridTemplateColumns: `repeat(${size},1fr)` }} aria-hidden="true">
    {Array.from({ length: size * size }, (_, i) => <i key={i} />)}
  </span>;
}
