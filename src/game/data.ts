import { C } from "../theme";
import type { Employee, Feature, Layer } from "./types";

export function initialLayers(): Layer[] {
  return [
    { id: "growth", name: "Growth", tag: "GTM", level: 1, factor: 0.14, infra: 1200, load: 0.2 },
    { id: "product", name: "Product", tag: "APP", level: 1, factor: 0.255, infra: 1600, load: 0.25 },
    { id: "api", name: "API Gateway", tag: "EDGE", level: 1, factor: 0.37, infra: 2200, load: 0.3 },
    { id: "services", name: "Services", tag: "CORE", level: 1, factor: 0.217, infra: 1800, load: 0.22 },
    { id: "data", name: "Data", tag: "DB", level: 1, factor: 0.196, infra: 2000, load: 0.2 },
    { id: "infra", name: "Infra", tag: "K8S", level: 1, factor: 0.12, infra: 2600, load: 0.18 },
  ];
}

const FIRST = [
  "Maya", "Devin", "Lena", "Arjun", "Sofia", "Kwame", "Nina", "Theo", "Yuki", "Omar",
  "Priya", "Jonas", "Aisha", "Marco", "Hana", "Liam", "Zoe", "Idris", "Clara", "Noah",
];
const LAST = [
  "Okonkwo", "Park", "Brandt", "Mehta", "Rossi", "Asante", "Kovač", "Lindqvist", "Tanaka",
  "Haddad", "Nair", "Weber", "Bauer", "Costa", "Sato", "Murphy", "Klein", "Diallo", "Vogel",
];

const TRAITS: { trait: string; color: string; note: string }[] = [
  { trait: "Scaler", color: C.cyan, note: "Senkt die Last der zugewiesenen Schicht deutlich." },
  { trait: "Viral", color: C.ember, note: "Beschleunigt User-Wachstum, riskiert Last-Spikes." },
  { trait: "Firewall", color: C.good, note: "Verhindert den nächsten Ausfall automatisch." },
  { trait: "Architect", color: C.cyan, note: "Erhöht die Kapazität aller Schichten leicht." },
  { trait: "Closer", color: C.ember, note: "Steigert den Umsatz pro User." },
];

const ROLES = ["Staff Engineer", "Growth Lead", "SRE", "Platform Eng", "Data Eng", "Product Eng"];

let cid = 0;

function rnd(min: number, max: number): number {
  return min + Math.random() * (max - min);
}
function pick<T>(a: readonly T[]): T {
  return a[Math.floor(Math.random() * a.length)];
}

export function makeCandidate(layerTags: string[]): Employee {
  const tr = pick(TRAITS);
  const layerTag = pick(layerTags);
  const build = Math.round(rnd(45, 96));
  const speed = Math.round(rnd(45, 96));
  const cost = Math.round(rnd(35, 70));
  const costPerMo = Math.round((7000 + (build + speed) * 70) / 100) * 100;
  return {
    id: `emp-${cid++}`,
    name: `${pick(FIRST)} ${pick(LAST)}`,
    role: pick(ROLES),
    layerTag,
    stats: { Build: build, Speed: speed, Cost: cost },
    trait: tr.trait,
    traitColor: tr.color,
    note: tr.note,
    costPerMo,
  };
}

export function makeCandidatePool(layerTags: string[], n = 3): Employee[] {
  return Array.from({ length: n }, () => makeCandidate(layerTags));
}

const FEATURES: Feature[] = [
  { name: "Realtime Collaboration", affects: ["EDGE", "APP"] },
  { name: "Mobile App v2", affects: ["APP", "GTM"] },
  { name: "Enterprise SSO", affects: ["CORE", "EDGE"] },
  { name: "Analytics Dashboard", affects: ["DB", "APP"] },
  { name: "Global CDN Rollout", affects: ["EDGE", "K8S"] },
  { name: "AI Assistant", affects: ["CORE", "DB"] },
  { name: "Public API", affects: ["EDGE", "CORE"] },
  { name: "Billing Overhaul", affects: ["CORE", "GTM"] },
];

export function nextFeature(): Feature {
  return pick(FEATURES);
}
