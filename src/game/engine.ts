import type { Employee, GameState, Layer } from "./types";
import { initialLayers, makeCandidatePool, nextFeature } from "./data";

const CAP_PER_LEVEL = 50000;
const STAFF_CAP = 500;

export function createInitialState(company: string): GameState {
  const layers = initialLayers();
  return {
    company,
    year: 1,
    quarter: 1,
    month: 0,
    cash: 250000,
    users: 12000,
    revenuePerMo: 0,
    valuation: 0,
    uptime: 99.4,
    hype: 20,
    layers,
    employees: [],
    candidates: makeCandidatePool(layers.map((l) => l.tag)),
    feature: nextFeature(),
    alloc: { Speed: 55, Polish: 70, Scale: 45 },
    outageShield: 0,
    log: [{ id: 0, text: `${company} gegründet. Bring den Stack zum Laufen.`, tone: "info" }],
    seq: 1,
    gameOver: false,
  };
}

// ---- derived helpers ------------------------------------------------------
function architectCount(s: GameState): number {
  return s.employees.filter((e) => e.trait === "Architect").length;
}
function closerCount(s: GameState): number {
  return s.employees.filter((e) => e.trait === "Closer").length;
}

export function capacityOf(layer: Layer, s: GameState): number {
  const arch = 1 + 0.08 * architectCount(s);
  let cap = layer.level * CAP_PER_LEVEL * arch;
  for (const e of s.employees) {
    if (e.assignedLayerId !== layer.id) continue;
    const mult = e.trait === "Scaler" ? 1.8 : 1;
    cap += e.stats.Build * STAFF_CAP * mult;
  }
  return cap;
}

export function loadTargetOf(layer: Layer, s: GameState): number {
  const cap = capacityOf(layer, s);
  return clamp((s.users * layer.factor) / cap, 0, 1.45);
}

export function arpu(s: GameState): number {
  return 0.55 + 0.18 * closerCount(s);
}

export function monthlyBurn(s: GameState): number {
  const salaries = s.employees.reduce((a, e) => a + e.costPerMo, 0);
  const infra = s.layers.reduce((a, l) => a + l.level * l.infra, 0);
  return salaries + infra;
}

export function valuationOf(s: GameState): number {
  return Math.max(0, s.users * 180 + s.revenuePerMo * 36 + s.cash * 0.4);
}

export function scaleCost(layer: Layer): number {
  return layer.level * 14000 + 9000;
}

// ---- mutations (return new state) ----------------------------------------
function clone(s: GameState): GameState {
  return structuredClone(s);
}

function pushLog(s: GameState, text: string, tone: "info" | "good" | "bad") {
  s.log.unshift({ id: s.seq++, text, tone });
  if (s.log.length > 7) s.log.pop();
}

export function tick(prev: GameState): GameState {
  if (prev.gameOver) return prev;
  const s = clone(prev);

  // advance loads toward target
  for (const l of s.layers) {
    const target = loadTargetOf(l, s);
    l.load = l.load + (target - l.load) * 0.6;
  }

  // recover uptime, then outages
  s.uptime = s.uptime + (100 - s.uptime) * 0.3;
  for (const l of s.layers) {
    if (l.load > 0.9) {
      const chance = (l.load - 0.9) * 0.9;
      if (Math.random() < chance) {
        if (s.outageShield > 0) {
          s.outageShield -= 1;
          pushLog(s, `🛡 Firewall blockte einen Ausfall in „${l.name}".`, "good");
        } else {
          const drop = rnd(2.5, 6.5);
          const lost = Math.round(s.users * rnd(0.03, 0.08));
          s.uptime -= drop;
          s.users = Math.max(0, s.users - lost);
          pushLog(s, `⚠ Ausfall in „${l.name}" — ${fmtNum(lost)} User verloren.`, "bad");
        }
      }
    }
  }
  s.uptime = clamp(s.uptime, 80, 100);

  // user growth
  const growth = s.layers.find((l) => l.id === "growth")!;
  const demandGrowth = 0.075 * growth.level * (1 + s.hype / 150);
  const overload = s.layers.reduce((a, l) => a + Math.max(0, l.load - 0.85), 0);
  const churn = overload * 0.06;
  const delta = s.users * demandGrowth * (s.uptime / 100) - s.users * churn + 150;
  s.users = Math.max(0, Math.round(s.users + delta));

  // hype decays
  s.hype = Math.max(0, s.hype * 0.9);

  // finances
  s.revenuePerMo = s.users * arpu(s);
  const burn = monthlyBurn(s);
  s.cash = Math.round(s.cash + s.revenuePerMo - burn);
  s.valuation = valuationOf(s);

  if (s.cash < 0) {
    s.gameOver = true;
    pushLog(s, "💀 Runway aufgebraucht. Game Over.", "bad");
    return s;
  }

  // time
  s.month += 1;
  if (s.month > 2) {
    s.month = 0;
    s.quarter += 1;
    if (s.quarter > 4) {
      s.quarter = 1;
      s.year += 1;
    }
    // fresh talent each quarter
    s.candidates = makeCandidatePool(s.layers.map((l) => l.tag));
    pushLog(s, `📅 Q${s.quarter} · Jahr ${s.year} — neue Talente verfügbar.`, "info");
  }

  return s;
}

export function scaleLayer(prev: GameState, id: string): GameState {
  const s = clone(prev);
  const l = s.layers.find((x) => x.id === id);
  if (!l) return prev;
  const cost = scaleCost(l);
  if (s.cash < cost) {
    pushLog(s, `Nicht genug Cash, um „${l.name}" zu skalieren ($${fmtNum(cost)}).`, "bad");
    return s;
  }
  s.cash -= cost;
  l.level += 1;
  l.load = loadTargetOf(l, s);
  pushLog(s, `↑ „${l.name}" auf Level ${l.level} skaliert.`, "good");
  return s;
}

export function hireCandidate(prev: GameState, id: string): GameState {
  const s = clone(prev);
  const idx = s.candidates.findIndex((c) => c.id === id);
  if (idx < 0) return prev;
  const emp: Employee = s.candidates.splice(idx, 1)[0];
  const layer = s.layers.find((l) => l.tag === emp.layerTag) ?? s.layers[0];
  emp.assignedLayerId = layer.id;
  s.employees.push(emp);
  if (emp.trait === "Firewall") s.outageShield += 1;
  if (emp.trait === "Viral") s.hype += 25;
  pushLog(s, `✓ ${emp.name} (${emp.trait}) → ${layer.name}.`, "good");
  return s;
}

export function rejectCandidate(prev: GameState, id: string): GameState {
  const s = clone(prev);
  s.candidates = s.candidates.filter((c) => c.id !== id);
  return s;
}

export function setAlloc(prev: GameState, key: "Speed" | "Polish" | "Scale", v: number): GameState {
  const s = clone(prev);
  s.alloc[key] = v;
  return s;
}

/** Apply the result of a finished deploy. */
export function shipFeature(prev: GameState): GameState {
  const s = clone(prev);
  const { Speed, Polish, Scale } = s.alloc;
  const score = (Speed + Polish + Scale) / 3;

  const usersGain = Math.round(s.users * (score / 100) * 0.45 + score * 320);
  s.users += usersGain;
  s.hype += Math.round(Polish * 0.6);

  // under-provisioned scale can trigger an outage on an affected layer
  const affected = s.layers.filter((l) => s.feature.affects.includes(l.tag));
  let crashed = false;
  if (Scale < 45) {
    for (const l of affected) {
      if (Math.random() < (45 - Scale) / 80) {
        const lost = Math.round(s.users * rnd(0.04, 0.1));
        s.users = Math.max(0, s.users - lost);
        s.uptime = clamp(s.uptime - rnd(3, 8), 80, 100);
        crashed = true;
        pushLog(s, `⚠ „${s.feature.name}" überlastete „${l.name}" — ${fmtNum(lost)} User weg.`, "bad");
      }
    }
  }

  if (!crashed) {
    pushLog(s, `🚀 „${s.feature.name}" live — +${fmtNum(usersGain)} User.`, "good");
  }

  s.feature = nextFeature();
  s.valuation = valuationOf(s);
  return s;
}

// ---- utils ----------------------------------------------------------------
export function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}
function rnd(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function fmtNum(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + "B";
  if (abs >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (abs >= 1_000) return (n / 1_000).toFixed(abs >= 10_000 ? 0 : 1) + "K";
  return Math.round(n).toString();
}

export function fmtMoney(n: number): string {
  const sign = n < 0 ? "-" : "";
  return sign + "$" + fmtNum(Math.abs(n));
}
