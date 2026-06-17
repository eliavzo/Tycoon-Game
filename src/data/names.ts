import { pick, randInt, rand, clamp } from "../core/rng";
import type { Employee } from "../core/types";

const FIRST = [
  "Alex", "Mara", "Jonas", "Lena", "Tim", "Sara", "Noah", "Mia", "Finn", "Lea",
  "Paul", "Nina", "Luca", "Emma", "Ben", "Hanna", "Tom", "Lara", "Max", "Ida",
  "Erik", "Sophie", "Jan", "Clara", "Leon", "Marie", "Felix", "Anna", "David", "Ella",
];

const LAST = [
  "Schmidt", "Müller", "Weber", "Wagner", "Becker", "Hoffmann", "Koch", "Bauer",
  "Richter", "Klein", "Wolf", "Neumann", "Schwarz", "Zimmermann", "Braun", "Krüger",
  "Hofmann", "Lange", "Werner", "Krause", "Lehmann", "Schmitt", "Maier", "Köhler",
];

const ROLES = ["Entwickler:in", "Designer:in", "Programmierer:in", "Artist", "Producer"];

let idCounter = 0;

export function makeCandidate(level: number): Employee {
  // level 0 = junior, higher = more talented & more expensive
  const base = 1 + level;
  const design = clamp(randInt(base, base + 4), 1, 10);
  const tech = clamp(randInt(base, base + 4), 1, 10);
  const talent = design + tech;
  const salary = Math.round((300 + talent * 90 + rand(-50, 50)) / 10) * 10;
  return {
    id: `emp-${idCounter++}`,
    name: `${pick(FIRST)} ${pick(LAST)}`,
    role: pick(ROLES),
    design,
    tech,
    salary,
    energy: 1,
    seat: -1,
  };
}

export function makeCandidatePool(year: number): Employee[] {
  // talent pool grows slowly over the years
  const maxLevel = clamp(Math.floor((year - 2004) / 3), 0, 4);
  const out: Employee[] = [];
  const n = randInt(3, 5);
  for (let i = 0; i < n; i++) {
    out.push(makeCandidate(randInt(0, maxLevel + 1)));
  }
  return out;
}
