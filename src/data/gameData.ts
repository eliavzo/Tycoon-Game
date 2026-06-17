import type { Genre, Topic, Platform } from "../core/types";

export const GENRES: Genre[] = [
  { id: "action", name: "Action", designWeight: 0.45 },
  { id: "rpg", name: "Rollenspiel", designWeight: 0.6 },
  { id: "strategy", name: "Strategie", designWeight: 0.5 },
  { id: "simulation", name: "Simulation", designWeight: 0.55 },
  { id: "adventure", name: "Adventure", designWeight: 0.7 },
  { id: "casual", name: "Casual", designWeight: 0.65 },
  { id: "racing", name: "Rennspiel", designWeight: 0.4 },
  { id: "shooter", name: "Shooter", designWeight: 0.35 },
];

export const TOPICS: Topic[] = [
  { id: "fantasy", name: "Fantasy" },
  { id: "scifi", name: "Sci-Fi" },
  { id: "military", name: "Militär" },
  { id: "sports", name: "Sport" },
  { id: "racing", name: "Rennen" },
  { id: "horror", name: "Horror" },
  { id: "city", name: "Stadt" },
  { id: "space", name: "Weltraum" },
  { id: "medieval", name: "Mittelalter" },
  { id: "crime", name: "Verbrechen" },
];

// Synergy: how well a genre fits a topic (0..1). Default 0.5 if not listed.
const SYNERGY: Record<string, Record<string, number>> = {
  action: { military: 0.9, crime: 0.85, scifi: 0.8, horror: 0.7 },
  rpg: { fantasy: 0.95, medieval: 0.9, scifi: 0.8, space: 0.75 },
  strategy: { military: 0.95, medieval: 0.85, space: 0.8, city: 0.75 },
  simulation: { city: 0.95, sports: 0.8, racing: 0.7, space: 0.7 },
  adventure: { fantasy: 0.85, horror: 0.85, crime: 0.8, space: 0.75 },
  casual: { sports: 0.8, city: 0.75, fantasy: 0.7 },
  racing: { racing: 0.95, sports: 0.85, city: 0.6 },
  shooter: { military: 0.95, scifi: 0.85, horror: 0.8, space: 0.8 },
};

export function genreTopicSynergy(genreId: string, topicId: string): number {
  return SYNERGY[genreId]?.[topicId] ?? 0.5;
}

export const PLATFORMS: Platform[] = [
  { id: "pc", name: "PC", marketShare: 1.0, releaseYear: 2000, licenseCost: 0 },
  { id: "mobile", name: "Mobile", marketShare: 1.4, releaseYear: 2008, licenseCost: 2000 },
  { id: "gamebox", name: "GameBox (Konsole)", marketShare: 1.1, releaseYear: 2002, licenseCost: 8000 },
  { id: "playstand", name: "PlayStand (Konsole)", marketShare: 1.2, releaseYear: 2006, licenseCost: 12000 },
  { id: "handheld", name: "Pocket Handheld", marketShare: 0.9, releaseYear: 2004, licenseCost: 5000 },
];

export function platformsAvailable(year: number): Platform[] {
  return PLATFORMS.filter((p) => p.releaseYear <= year);
}

export function getGenre(id: string): Genre {
  return GENRES.find((g) => g.id === id)!;
}
export function getTopic(id: string): Topic {
  return TOPICS.find((t) => t.id === id)!;
}
export function getPlatform(id: string): Platform {
  return PLATFORMS.find((p) => p.id === id)!;
}

export const SIZE_CONFIG = {
  small: { label: "Klein", weeks: 6, costPerWeek: 1.0, potential: 40000 },
  medium: { label: "Mittel", weeks: 12, costPerWeek: 1.4, potential: 120000 },
  large: { label: "Groß", weeks: 22, costPerWeek: 1.8, potential: 350000 },
} as const;
