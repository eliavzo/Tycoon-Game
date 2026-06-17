export interface Layer {
  id: string;
  name: string;
  tag: string;
  /** scaling level — drives capacity */
  level: number;
  /** demand share factor for this layer */
  factor: number;
  /** infra burn per month per level */
  infra: number;
  /** smoothed current load 0..~1.4 */
  load: number;
}

export interface Stat {
  Build: number;
  Speed: number;
  Cost: number;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  /** preferred layer tag */
  layerTag: string;
  stats: Stat;
  trait: string;
  traitColor: string;
  note: string;
  /** burn per month, in $ */
  costPerMo: number;
  /** id of the layer they currently strengthen */
  assignedLayerId?: string;
}

export interface Feature {
  name: string;
  affects: string[];
}

export interface LogItem {
  id: number;
  text: string;
  tone: "info" | "good" | "bad";
}

export interface GameState {
  company: string;
  year: number;
  /** 1..4 */
  quarter: number;
  /** 0..2 within the quarter */
  month: number;

  cash: number;
  users: number;
  revenuePerMo: number;
  valuation: number;
  uptime: number;
  hype: number;

  layers: Layer[];
  employees: Employee[];
  candidates: Employee[];

  feature: Feature;
  alloc: { Speed: number; Polish: number; Scale: number };

  /** consumed by a Firewall hire to block the next outage */
  outageShield: number;

  log: LogItem[];
  seq: number;
  gameOver: boolean;
}
