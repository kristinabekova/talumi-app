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
    imgW: 708,
    imgH: 724,
    col: { margin1: 114, margin2: 104, cell: 98.5, smallGap: 26, bigGap: 44, blockDim: 2 },
    row: { margin1: 99, margin2: 131, cell: 114, smallGap: 6.5, bigGap: 23, blockDim: 2 },
  },
  6: {
    image: "/sudoku-frame-6x6.png",
    imgW: 724,
    imgH: 724,
    col: { margin1: 90, margin2: 96, cell: 84.2, smallGap: 6, bigGap: 9, blockDim: 3 },
    row: { margin1: 84, margin2: 103, cell: 85.2, smallGap: 3.3, bigGap: 8, blockDim: 2 },
  },
  9: {
    image: "/sudoku-frame-9x9.png",
    imgW: 722,
    imgH: 724,
    col: { margin1: 79, margin2: 86, cell: 57.8, smallGap: 3.2, bigGap: 9, blockDim: 3 },
    row: { margin1: 71, margin2: 97, cell: 57.9, smallGap: 3, bigGap: 8.5, blockDim: 3 },
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

export function frameStyle(size: SudokuSize): CSSProperties {
  const geo = FRAME_GEOMETRY[size];
  return {
    backgroundImage: `url(${geo.image})`,
    backgroundSize: "100% 100%",
    aspectRatio: `${geo.imgW} / ${geo.imgH}`,
    paddingTop: `${(geo.row.margin1 / geo.imgH) * 100}%`,
    paddingBottom: `${(geo.row.margin2 / geo.imgH) * 100}%`,
    paddingLeft: `${(geo.col.margin1 / geo.imgW) * 100}%`,
    paddingRight: `${(geo.col.margin2 / geo.imgW) * 100}%`,
    gridTemplateColumns: template(size, geo.col),
    gridTemplateRows: template(size, geo.row),
  };
}

export function cellPlacement(row: number, col: number): CSSProperties {
  return { gridRow: 2 * row + 1, gridColumn: 2 * col + 1 };
}
