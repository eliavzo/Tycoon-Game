import type { GameState } from "./types";
import { createInitialState } from "./state";
import { advanceProject } from "../systems/development";
import { processSales, weeklySalaries, weeklyResearch } from "../systems/economy";
import { makeCandidatePool } from "../data/names";

export type GameEvent =
  | { type: "tick"; state: GameState }
  | { type: "notify"; level: "info" | "good" | "bad"; message: string }
  | { type: "release"; productId: string };

type Listener = (e: GameEvent) => void;

const WEEK_MS_BASE = 1400; // ms per week at speed 1

export class GameEngine {
  state: GameState;
  private listeners: Listener[] = [];
  private acc = 0;
  private lastTs = 0;
  private raf = 0;
  private weeksSinceCandidates = 0;

  constructor(companyName: string) {
    this.state = createInitialState(companyName);
  }

  on(fn: Listener): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  emit(e: GameEvent) {
    for (const l of this.listeners) l(e);
  }

  notify(level: "info" | "good" | "bad", message: string) {
    this.emit({ type: "notify", level, message });
  }

  setSpeed(speed: 0 | 1 | 2 | 3) {
    this.state.speed = speed;
  }

  start() {
    this.lastTs = performance.now();
    const loop = (ts: number) => {
      const dt = ts - this.lastTs;
      this.lastTs = ts;
      if (this.state.speed > 0) {
        this.acc += dt * this.state.speed;
        const step = WEEK_MS_BASE;
        while (this.acc >= step) {
          this.acc -= step;
          this.tick();
        }
      } else {
        this.acc = 0;
      }
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    cancelAnimationFrame(this.raf);
  }

  /** Advance the simulation one week. */
  tick() {
    const s = this.state;

    // time
    s.date.week += 1;
    if (s.date.week >= 52) {
      s.date.week = 0;
      s.date.year += 1;
    }

    // finances
    s.money -= weeklySalaries(s);
    s.money += processSales(s);
    s.research += weeklyResearch(s);

    // energy: working drains a little, recovers when idle
    const working = !!s.currentProject;
    for (const e of s.employees) {
      if (e.id === "emp-founder") continue;
      e.energy = working
        ? Math.max(0.7, e.energy - 0.02)
        : Math.min(1, e.energy + 0.05);
    }

    // project progress
    if (s.currentProject) {
      const finished = advanceProject(s);
      if (finished) {
        this.notify(
          finished.reviewScore >= 8 ? "good" : finished.reviewScore <= 4 ? "bad" : "info",
          `„${finished.name}" veröffentlicht! Wertung ${finished.reviewScore}/10 (Qualität ${finished.quality}).`,
        );
        this.emit({ type: "release", productId: finished.id });
      }
    }

    // refresh hiring pool periodically
    this.weeksSinceCandidates += 1;
    if (this.weeksSinceCandidates >= 8) {
      this.weeksSinceCandidates = 0;
      s.candidates = makeCandidatePool(s.date.year);
    }

    // low-cash warning
    if (s.money < 0 && s.money + weeklySalaries(s) >= 0) {
      this.notify("bad", "Achtung: Dein Kontostand ist negativ!");
    }

    this.emit({ type: "tick", state: s });
  }
}
