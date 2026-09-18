import type { PyramidSize } from "./types";

export type Rect = { left: number; top: number; width: number; height: number };

export type ReactorLayout = {
  /** Reference artwork pixel size — used only to derive the container aspect-ratio. */
  aspect: number;
  /** Pyramid slot rects, one array per row from the top (apex) down to the base. */
  bands: Rect[][];
  /** 1–9 keypad digit rects, row-major (1,2,3 / 4,5,6 / 7,8,9). */
  digits: Rect[];
  clear: Rect;
  zero: Rect;
  confirm: Rect;
  /** Generous region around the energy crystal, for the charge-glow overlay. */
  crystal: Rect;
};

const size3: ReactorLayout = {
  aspect: 477 / 1024,
  bands: [
    [{ left: 41.09, top: 39.45, width: 20.13, height: 6.93 }],
    [
      { left: 29.56, top: 47.75, width: 19.71, height: 6.74 },
      { left: 53.04, top: 47.75, width: 19.71, height: 6.74 },
    ],
    [
      { left: 19.29, top: 55.76, width: 18.66, height: 6.74 },
      { left: 41.72, top: 55.76, width: 18.45, height: 6.74 },
      { left: 64.15, top: 55.76, width: 18.45, height: 6.74 },
    ],
  ],
  digits: keypadGrid(
    [26.62, 44.44, 62.26],
    [12.37, 12.58, 12.79],
    [65.82, 71.0, 76.27],
    [3.61, 3.71, 3.71]
  ),
  clear: { left: 26.62, top: 81.45, width: 12.37, height: 4.0 },
  zero: { left: 44.44, top: 81.45, width: 12.58, height: 4.0 },
  confirm: { left: 62.26, top: 81.45, width: 12.79, height: 4.0 },
  crystal: { left: 18, top: 7, width: 64, height: 22 },
};

const size4: ReactorLayout = {
  aspect: 484 / 1024,
  bands: [
    [{ left: 44.21, top: 36.82, width: 14.05, height: 3.71 }],
    [
      { left: 34.92, top: 42.38, width: 14.46, height: 5.08 },
      { left: 52.89, top: 42.38, width: 13.84, height: 5.08 },
    ],
    [
      { left: 26.45, top: 49.41, width: 14.05, height: 5.08 },
      { left: 43.8, top: 49.41, width: 14.46, height: 5.08 },
      { left: 61.78, top: 49.41, width: 13.84, height: 5.08 },
    ],
    [
      { left: 18.8, top: 56.45, width: 13.22, height: 5.08 },
      { left: 35.33, top: 56.45, width: 14.05, height: 5.08 },
      { left: 52.89, top: 56.45, width: 13.84, height: 5.08 },
      { left: 70.25, top: 56.45, width: 13.84, height: 5.08 },
    ],
  ],
  digits: keypadGrid(
    [27.69, 45.25, 63.02],
    [11.36, 11.78, 11.57],
    [66.02, 70.7, 76.17],
    [3.42, 3.13, 3.13]
  ),
  clear: { left: 27.69, top: 81.35, width: 11.36, height: 4.59 },
  zero: { left: 45.25, top: 81.35, width: 11.78, height: 4.59 },
  confirm: { left: 63.02, top: 81.35, width: 11.57, height: 4.59 },
  crystal: { left: 18, top: 5, width: 64, height: 20 },
};

function keypadGrid(colLefts: number[], colWidths: number[], rowTops: number[], rowHeights: number[]): Rect[] {
  const rects: Rect[] = [];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      rects.push({ left: colLefts[col], top: rowTops[row], width: colWidths[col], height: rowHeights[row] });
    }
  }
  return rects;
}

export const REACTOR_LAYOUTS: Record<PyramidSize, ReactorLayout> = { 3: size3, 4: size4 };

export const REACTOR_COLORS = ["modra", "fialova", "zlta"] as const;
export type ReactorColor = (typeof REACTOR_COLORS)[number];

export function randomColor(exclude?: ReactorColor): ReactorColor {
  const options = exclude ? REACTOR_COLORS.filter((c) => c !== exclude) : REACTOR_COLORS;
  return options[Math.floor(Math.random() * options.length)];
}

export function frameUrl(size: PyramidSize, color: ReactorColor): string {
  return `/talumi-reactor-frame-${size}-${color}.png`;
}
