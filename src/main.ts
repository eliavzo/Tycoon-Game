import Phaser from "phaser";
import { GameEngine } from "./core/engine";
import { OfficeScene } from "./scene/OfficeScene";
import { UIManager } from "./ui/ui";
import { el, $ } from "./ui/dom";
import "./style.css";

function showStartScreen() {
  const overlay = el("div", { class: "start-overlay" }, [
    el("div", { class: "start-card" }, [
      el("div", { class: "start-logo" }, ["▲"]),
      el("h1", {}, ["Tech Empire Tycoon"]),
      el("p", { class: "muted" }, [
        "Gründe ein kleines Spielestudio und baue es zum globalen Technologie-Imperium aus — vom ersten Indie-Hit über Smartphones und PCs bis zum eigenen Autowerk.",
      ]),
      (() => {
        const input = el("input", {
          class: "field", id: "company-input", type: "text",
          placeholder: "Name deiner Firma", value: "Pixel Forge",
          maxlength: 24,
        });
        input.addEventListener("keydown", (e) => {
          if ((e as KeyboardEvent).key === "Enter") startGame();
        });
        return input;
      })(),
      el("button", { class: "btn primary big", onClick: () => startGame() }, [
        "Firma gründen",
      ]),
      el("p", { class: "muted small" }, [
        "Tipp: Stelle Personal ein, achte auf die Genre/Thema-Kombination und reinvestiere in Forschung.",
      ]),
    ]),
  ]);
  document.body.append(overlay);
}

function startGame() {
  const input = document.querySelector<HTMLInputElement>("#company-input");
  const name = (input?.value.trim() || "Pixel Forge").slice(0, 24);
  document.querySelector(".start-overlay")?.remove();

  const engine = new GameEngine(name);

  // Phaser
  const container = $("#phaser-container");
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: container,
    backgroundColor: "#0e1430",
    scale: {
      mode: Phaser.Scale.RESIZE,
      width: container.clientWidth,
      height: container.clientHeight,
    },
    scene: [OfficeScene],
  });
  game.scene.start("office", { engine });

  // UI
  const ui = new UIManager(engine);
  ui.init();

  engine.start();
  engine.notify("info", `Willkommen bei ${name}! Entwickle dein erstes Spiel.`);
}

showStartScreen();
