import test from "node:test";
import assert from "node:assert/strict";
import { canTurn, hitsBody, nextHead } from "../app/snake/engine.ts";
import { createChallenge, createOrbs, GRID_SIZE, isPrime, matchesChallenge, replaceOrbInSet, validateOrbSet } from "../app/snake/math.ts";

test("párne, nepárne, násobky a deliteľnosť sú vyhodnotené správne", () => {
  assert.equal(matchesChallenge(12, { id: "e", kind: "even", label: "" }), true);
  assert.equal(matchesChallenge(13, { id: "o", kind: "odd", label: "" }), true);
  assert.equal(matchesChallenge(12, { id: "m", kind: "multiple", label: "", a: 3 }), true);
  assert.equal(matchesChallenge(14, { id: "d", kind: "divisible", label: "", a: 3 }), false);
  assert.equal(matchesChallenge(18, { id: "b", kind: "divisibleBoth", label: "", a: 2, b: 3 }), true);
});

test("1 nie je prvočíslo a prvočísla sú určené správne", () => {
  assert.equal(isPrime(1), false); assert.equal(isPrime(2), true); assert.equal(isPrime(29), true); assert.equal(isPrime(49), false);
});

test("hranice intervalu sa započítavajú", () => {
  const range = { id: "r", kind: "range" as const, label: "", a: 10, b: 20 };
  assert.equal(matchesChallenge(10, range), true); assert.equal(matchesChallenge(20, range), true); assert.equal(matchesChallenge(21, range), false);
});

test("generátor vytvára unikátne guličky mimo hada a s oboma typmi odpovedí", () => {
  const snake = [{ x: 8, y: 9 }, { x: 7, y: 9 }, { x: 6, y: 9 }];
  for (const difficulty of ["easy", "medium", "hard"] as const) {
    for (let attempt = 0; attempt < 30; attempt += 1) {
      const challenge = createChallenge(difficulty);
      assert.equal(validateOrbSet(createOrbs(challenge, difficulty, snake), challenge, snake), true);
    }
  }
});

test("had sa nemôže okamžite otočiť do opačného smeru", () => {
  assert.equal(canTurn("right", "left"), false); assert.equal(canTurn("right", "up"), true); assert.equal(canTurn("up", "down"), false);
});

test("ľahká hra prechádza cez okraj, ostatné narazia do steny", () => {
  assert.deepEqual(nextHead({ x: GRID_SIZE - 1, y: 3 }, "right", true), { cell: { x: 0, y: 3 }, hitWall: false });
  assert.equal(nextHead({ x: GRID_SIZE - 1, y: 3 }, "right", false).hitWall, true);
});

test("kolízia s vlastným telom je rozpoznaná", () => {
  assert.equal(hitsBody({ x: 4, y: 4 }, [{ x: 4, y: 4 }, { x: 3, y: 4 }]), true);
  assert.equal(hitsBody({ x: 5, y: 4 }, [{ x: 4, y: 4 }, { x: 3, y: 4 }]), false);
});

test("po zjedení sa zmení iba jedna gulička", () => {
  const original = [
    { id: "a", x: 1, y: 1, value: 2, color: "#0000FF", textColor: "#FFFFFF" },
    { id: "b", x: 5, y: 5, value: 7, color: "#FF0000", textColor: "#FFFFFF" },
  ];
  const replacement = { id: "c", x: 8, y: 8, value: 10, color: "#00A800", textColor: "#FFFFFF" };
  const next = replaceOrbInSet(original, "a", replacement);
  assert.equal(next[0], replacement);
  assert.equal(next[1], original[1]);
  assert.deepEqual(next[1], original[1]);
});
