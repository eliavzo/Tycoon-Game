import type { GameProject, GameState, ProjectSize, ReleasedProduct } from "../core/types";
import { nextId } from "../core/state";
import { getGenre, getPlatform, genreTopicSynergy, SIZE_CONFIG } from "../data/gameData";
import { clamp, rand } from "../core/rng";

export interface NewProjectSpec {
  name: string;
  genreId: string;
  topicId: string;
  platformId: string;
  size: ProjectSize;
}

/** Weekly point output of the whole team. */
export function teamOutput(state: GameState): { design: number; tech: number } {
  let design = 0;
  let tech = 0;
  for (const e of state.employees) {
    design += e.design * e.energy;
    tech += e.tech * e.energy;
  }
  return { design, tech };
}

export function startProject(state: GameState, spec: NewProjectSpec): GameProject {
  const cfg = SIZE_CONFIG[spec.size];
  const project: GameProject = {
    id: nextId(state, "proj"),
    name: spec.name,
    genreId: spec.genreId,
    topicId: spec.topicId,
    platformId: spec.platformId,
    size: spec.size,
    totalWeeks: cfg.weeks,
    weeksDone: 0,
    designPoints: 0,
    techPoints: 0,
  };
  state.currentProject = project;
  return project;
}

function researchBonus(state: GameState): number {
  let bonus = 0;
  const has = (id: string) => state.research_topics.find((r) => r.id === id)?.researched;
  if (has("engine2d")) bonus += 4;
  if (has("engine3d")) bonus += 9;
  if (has("online")) bonus += 4;
  return bonus;
}

/** Advance the active project by one week. Returns a finished product if done. */
export function advanceProject(state: GameState): ReleasedProduct | null {
  const p = state.currentProject;
  if (!p) return null;

  const out = teamOutput(state);
  p.designPoints += out.design;
  p.techPoints += out.tech;
  p.weeksDone += 1;

  if (p.weeksDone < p.totalWeeks) return null;

  return finishProject(state, p);
}

function finishProject(state: GameState, p: GameProject): ReleasedProduct {
  const genre = getGenre(p.genreId);
  const platform = getPlatform(p.platformId);
  const cfg = SIZE_CONFIG[p.size];

  const total = p.designPoints + p.techPoints || 1;
  const actualRatio = p.designPoints / total;
  const w = genre.designWeight;
  const balance = 1 - Math.abs(w - actualRatio); // 0..1
  const balanceAdj = 0.7 + 0.3 * balance;

  const synergy = genreTopicSynergy(p.genreId, p.topicId);
  const synergyAdj = 0.6 + 0.4 * synergy;

  const sizeBenchmark = { small: 12, medium: 16, large: 20 }[p.size];
  const avgWeekly = total / p.totalWeeks;

  let quality =
    (avgWeekly / sizeBenchmark) * 55 * balanceAdj * synergyAdj +
    researchBonus(state) +
    rand(-7, 7);
  quality = clamp(quality, 1, 100);

  let reviewScore = Math.round(quality / 10 + rand(-0.6, 0.6));
  reviewScore = clamp(reviewScore, 1, 10);

  // sales model
  const priceBySize = { small: 18, medium: 30, large: 45 }[p.size];
  const basePotential = cfg.potential * platform.marketShare;
  const qualityFactor = Math.pow(quality / 100, 1.5);
  const has = (id: string) => state.research_topics.find((r) => r.id === id)?.researched;
  const marketingFactor = has("marketing") ? 1.35 : 1;
  const onlineFactor = has("online") ? 1.15 : 1;
  const fanFactor = 1 + state.fans / 2500;
  const initialMomentum =
    basePotential * qualityFactor * fanFactor * marketingFactor * onlineFactor * 0.12;

  const product: ReleasedProduct = {
    id: nextId(state, "prod"),
    name: p.name,
    division: "games",
    genreId: p.genreId,
    topicId: p.topicId,
    platformId: p.platformId,
    quality: Math.round(quality),
    reviewScore,
    releaseDate: { ...state.date },
    unitsSold: 0,
    momentum: initialMomentum,
    revenue: 0,
    price: priceBySize,
    active: true,
  };

  state.products.push(product);
  state.currentProject = null;

  // research reward & release fan bump
  state.research += Math.round(5 + p.totalWeeks * 0.8);
  state.fans += Math.round(reviewScore * reviewScore * 3 * (basePotential / 100000));

  return product;
}

/** Up-front cost to kick off a project (licenses etc.). */
export function projectStartCost(spec: NewProjectSpec): number {
  return getPlatform(spec.platformId).licenseCost;
}
