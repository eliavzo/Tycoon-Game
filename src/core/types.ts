// Shared type definitions for Tech Empire Tycoon

export type DivisionId = "games" | "smartphones" | "pcs" | "cars";

export interface GameDate {
  year: number;
  /** 0-based week within the year (0..51) */
  week: number;
}

export interface Genre {
  id: string;
  name: string;
  /** weighting of design vs tech focus, 0..1 (1 = pure design) */
  designWeight: number;
}

export interface Topic {
  id: string;
  name: string;
}

export interface Platform {
  id: string;
  name: string;
  /** market reach multiplier */
  marketShare: number;
  /** year the platform becomes available */
  releaseYear: number;
  /** development license/dev-kit cost */
  licenseCost: number;
}

export type ProjectSize = "small" | "medium" | "large";

export interface Employee {
  id: string;
  name: string;
  role: string;
  /** 1..10 design talent */
  design: number;
  /** 1..10 tech talent */
  tech: number;
  /** weekly salary in € */
  salary: number;
  /** 0..1 current energy; low energy reduces output */
  energy: number;
  /** cosmetic seat index in the office */
  seat: number;
}

export interface GameProject {
  id: string;
  name: string;
  genreId: string;
  topicId: string;
  platformId: string;
  size: ProjectSize;
  /** total weeks needed */
  totalWeeks: number;
  /** weeks elapsed */
  weeksDone: number;
  /** accumulated design points */
  designPoints: number;
  /** accumulated tech points */
  techPoints: number;
}

export interface ReleasedProduct {
  id: string;
  name: string;
  division: DivisionId;
  genreId?: string;
  topicId?: string;
  platformId?: string;
  /** 0..100 quality */
  quality: number;
  /** 1..10 review score */
  reviewScore: number;
  releaseDate: GameDate;
  /** total units sold so far */
  unitsSold: number;
  /** remaining sales momentum (units/week potential) */
  momentum: number;
  /** revenue earned so far */
  revenue: number;
  /** price per unit */
  price: number;
  active: boolean;
}

export interface ResearchTopic {
  id: string;
  name: string;
  description: string;
  cost: number;
  /** ids of other research required first */
  requires: string[];
  /** division this unlocks or improves, if any */
  unlocksDivision?: DivisionId;
  researched: boolean;
}

export interface GameState {
  companyName: string;
  date: GameDate;
  money: number;
  fans: number;
  research: number;
  speed: 0 | 1 | 2 | 3;

  employees: Employee[];
  /** available desks / office capacity */
  capacity: number;

  currentProject: GameProject | null;
  products: ReleasedProduct[];
  research_topics: ResearchTopic[];

  unlockedDivisions: DivisionId[];

  /** candidate pool for hiring, refreshed periodically */
  candidates: Employee[];

  /** running id counter */
  seq: number;
}
