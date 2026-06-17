import type { ResearchTopic } from "../core/types";

export function createResearchTopics(): ResearchTopic[] {
  return [
    {
      id: "engine2d",
      name: "2D-Engine",
      description: "Verbessert die technische Qualität deiner Spiele.",
      cost: 30,
      requires: [],
      researched: false,
    },
    {
      id: "engine3d",
      name: "3D-Engine",
      description: "Ermöglicht aufwändigere Spiele und höhere Qualität.",
      cost: 80,
      requires: ["engine2d"],
      researched: false,
    },
    {
      id: "online",
      name: "Online-Multiplayer",
      description: "Online-Features steigern Verkäufe und Fans.",
      cost: 120,
      requires: ["engine3d"],
      researched: false,
    },
    {
      id: "marketing",
      name: "Marketing-Abteilung",
      description: "Mehr Hype zum Release: höhere Anfangsverkäufe.",
      cost: 60,
      requires: [],
      researched: false,
    },
    {
      id: "rnd-mobile",
      name: "Mobile-Forschung",
      description: "Schaltet die Smartphone-Sparte frei.",
      cost: 200,
      requires: ["engine3d"],
      unlocksDivision: "smartphones",
      researched: false,
    },
    {
      id: "rnd-pc",
      name: "Hardware-Labor",
      description: "Schaltet die PC-Sparte frei.",
      cost: 300,
      requires: ["rnd-mobile"],
      unlocksDivision: "pcs",
      researched: false,
    },
    {
      id: "rnd-cars",
      name: "Automobil-Werk",
      description: "Schaltet die Auto-Sparte frei.",
      cost: 600,
      requires: ["rnd-pc"],
      unlocksDivision: "cars",
      researched: false,
    },
  ];
}
