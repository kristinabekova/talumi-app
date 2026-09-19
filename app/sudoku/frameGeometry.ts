import type { CSSProperties } from "react";
import type { SudokuSize } from "./types";

// Measured directly from the supplied frame PNGs (pixel positions of the
// cream cells vs. the decorative border/gaps), so the live grid lines up
// with the artwork exactly. Values are in source-image pixels.
type Axis = { margin1: number; margin2: number; cell: number; smallGap: number; bigGap: number; blockDim: number };
type FrameGeometry = { image: string; imgW: number; imgH: number; col: Axis; row: Axis };

export const FRAME_GEOMETRY: Record<SudokuSize, FrameGeometry> = {
  4: {
    image: "/sudoku-frame-4x4.png",
    imgW: 707,
    imgH: 724,
    col: { margin1: 128, margin2: 106, cell: 105.3, smallGap: 12, bigGap: 28, blockDim: 2 },
    row: { margin1: 117, margin2: 141, cell: 102, smallGap: 15, bigGap: 28, blockDim: 2 },
  },
  6: {
    image: "/sudoku-frame-6x6.png",
    imgW: 721,
    imgH: 724,
    col: { margin1: 111, margin2: 110, cell: 72.3, smallGap: 10.5, bigGap: 24, blockDim: 3 },
    row: { margin1: 108, margin2: 115, cell: 69.8, smallGap: 11.7, bigGap: 23.5, blockDim: 2 },
  },
  9: {
    image: "/sudoku-frame-9x9.png",
    imgW: 717,
    imgH: 724,
    col: { margin1: 105, margin2: 103, cell: 46.4, smallGap: 8.8, bigGap: 19, blockDim: 3 },
    row: { margin1: 104, margin2: 115, cell: 45.6, smallGap: 9.5, bigGap: 19, blockDim: 3 },
  },
};

function template(size: number, axis: Axis) {
  const parts: string[] = [];
  for (let i = 0; i < size; i++) {
    parts.push(`${axis.cell}fr`);
    if (i < size - 1) parts.push(`${(i + 1) % axis.blockDim === 0 ? axis.bigGap : axis.smallGap}fr`);
  }
  return parts.join(" ");
}

// Digit height as a share of the cell, so numbers scale with the artwork instead of the viewport.
const DIGIT_TO_CELL: Record<SudokuSize, number> = { 4: 0.5, 6: 0.62, 9: 0.9 };

// The artwork is the outer box; the cells live in an inner box inset by percentages of the
// outer box itself, so the overlay stays glued to the art at any rendered size.
export function frameStyle(size: SudokuSize): CSSProperties {
  const geo = FRAME_GEOMETRY[size];
  const digitCqw = (Math.min(geo.col.cell, geo.row.cell) / geo.imgW) * 100 * DIGIT_TO_CELL[size];
  return {
    ["--digit" as string]: `${digitCqw.toFixed(2)}cqw`,
    position: "relative",
    backgroundImage: `url(${geo.image})`,
    backgroundSize: "100% 100%",
    aspectRatio: `${geo.imgW} / ${geo.imgH}`,
  };
}

export function cellsStyle(size: SudokuSize): CSSProperties {
  const geo = FRAME_GEOMETRY[size];
  return {
    position: "absolute",
    display: "grid",
    top: `${(geo.row.margin1 / geo.imgH) * 100}%`,
    bottom: `${(geo.row.margin2 / geo.imgH) * 100}%`,
    left: `${(geo.col.margin1 / geo.imgW) * 100}%`,
    right: `${(geo.col.margin2 / geo.imgW) * 100}%`,
    gridTemplateColumns: template(size, geo.col),
    gridTemplateRows: template(size, geo.row),
  };
}

export function cellPlacement(row: number, col: number): CSSProperties {
  return { gridRow: 2 * row + 1, gridColumn: 2 * col + 1 };
}
