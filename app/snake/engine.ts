import { GRID_SIZE } from "./math.ts";
import type { Cell } from "./math.ts";

export type Direction = "up" | "down" | "left" | "right";

export const VECTORS: Record<Direction, Cell> = {
  up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 },
};

const OPPOSITE: Record<Direction, Direction> = { up: "down", down: "up", left: "right", right: "left" };

export function canTurn(current: Direction, next: Direction) {
  return OPPOSITE[current] !== next;
}

export function nextHead(head: Cell, direction: Direction, wraps: boolean) {
  const vector = VECTORS[direction];
  const raw = { x: head.x + vector.x, y: head.y + vector.y };
  const outside = raw.x < 0 || raw.y < 0 || raw.x >= GRID_SIZE || raw.y >= GRID_SIZE;
  if (!outside) return { cell: raw, hitWall: false };
  if (!wraps) return { cell: raw, hitWall: true };
  return { cell: { x: (raw.x + GRID_SIZE) % GRID_SIZE, y: (raw.y + GRID_SIZE) % GRID_SIZE }, hitWall: false };
}

export function hitsBody(head: Cell, body: Cell[]) {
  return body.some((cell) => cell.x === head.x && cell.y === head.y);
}
