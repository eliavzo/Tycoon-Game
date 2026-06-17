import type { Employee, GameState } from "./types";
import { createResearchTopics } from "../data/research";
import { makeCandidatePool } from "../data/names";

export function createInitialState(companyName: string): GameState {
  const founder: Employee = {
    id: "emp-founder",
    name: "Du (Gründer:in)",
    role: "CEO",
    design: 4,
    tech: 4,
    salary: 0,
    energy: 1,
    seat: 0,
  };

  return {
    companyName,
    date: { year: 2004, week: 0 },
    money: 50000,
    fans: 0,
    research: 0,
    speed: 0,

    employees: [founder],
    capacity: 4,

    currentProject: null,
    products: [],
    research_topics: createResearchTopics(),

    unlockedDivisions: ["games"],

    candidates: makeCandidatePool(2004),

    seq: 1,
  };
}

export function nextId(state: GameState, prefix: string): string {
  return `${prefix}-${state.seq++}`;
}

const MONTHS = [
  "Jan", "Feb", "Mär", "Apr", "Mai", "Jun",
  "Jul", "Aug", "Sep", "Okt", "Nov", "Dez",
];

export function formatDate(state: GameState): string {
  const monthIndex = Math.min(11, Math.floor(state.date.week / 4.34));
  return `${MONTHS[monthIndex]} ${state.date.year}`;
}

export function formatMoney(n: number): string {
  const abs = Math.abs(n);
  let s: string;
  if (abs >= 1_000_000_000) s = (n / 1_000_000_000).toFixed(2) + " Mrd";
  else if (abs >= 1_000_000) s = (n / 1_000_000).toFixed(2) + " Mio";
  else if (abs >= 10_000) s = Math.round(n / 1000) + "K";
  else s = Math.round(n).toLocaleString("de-DE");
  return s + " €";
}

export function formatNumber(n: number): string {
  return Math.round(n).toLocaleString("de-DE");
}

/** Estimated company valuation. */
export function companyValue(state: GameState): number {
  const cash = state.money;
  const fanValue = state.fans * 5;
  const catalogValue = state.products.reduce((s, p) => s + p.revenue * 0.3, 0);
  return Math.max(0, cash + fanValue + catalogValue);
}
