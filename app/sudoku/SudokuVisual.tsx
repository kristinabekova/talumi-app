export function CrystalVisual({ mini = false }: { mini?: boolean }) {
  return <div className={mini ? "crystal-visual mini" : "crystal-visual"} aria-hidden="true">
    <img src="/talumi-crystal-grid-visual.png" alt="" />
  </div>;
}

const FRAME_THUMB: Record<4 | 6 | 9, string> = {
  4: "/sudoku-frame-4x4.png",
  6: "/sudoku-frame-6x6.png",
  9: "/sudoku-frame-9x9.png",
};

export function MiniGrid({ size }: { size: 4 | 6 | 9 }) {
  return <span className="mini-sudoku" aria-hidden="true">
    <img src={FRAME_THUMB[size]} alt="" draggable={false} />
  </span>;
}
