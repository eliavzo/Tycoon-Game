import type { GameEngine, GameEvent } from "../core/engine";
import { companyValue, formatMoney, formatNumber } from "../core/state";
import { el, $ } from "./dom";
import {
  GENRES,
  TOPICS,
  SIZE_CONFIG,
  platformsAvailable,
  getGenre,
  getTopic,
  getPlatform,
} from "../data/gameData";
import {
  startProject,
  projectStartCost,
  type NewProjectSpec,
} from "../systems/development";
import type { DivisionId } from "../core/types";

const DIVISION_INFO: Record<DivisionId, { name: string; icon: string; researchId?: string }> = {
  games: { name: "Spiele", icon: "🎮" },
  smartphones: { name: "Smartphones", icon: "📱", researchId: "rnd-mobile" },
  pcs: { name: "PCs", icon: "🖥️", researchId: "rnd-pc" },
  cars: { name: "Autos", icon: "🚗", researchId: "rnd-cars" },
};

export class UIManager {
  private engine: GameEngine;

  constructor(engine: GameEngine) {
    this.engine = engine;
  }

  init() {
    this.bindSpeed();
    this.bindActions();
    this.engine.on((e) => this.onEvent(e));
    this.refreshTopbar();
    this.setActiveSpeed(0);
  }

  private onEvent(e: GameEvent) {
    if (e.type === "tick") this.refreshTopbar();
    if (e.type === "notify") this.pushTicker(e.level, e.message);
  }

  // ---- Topbar -------------------------------------------------------------
  private refreshTopbar() {
    const s = this.engine.state;
    $("#company-name").textContent = s.companyName;
    const moneyEl = $("#stat-money");
    moneyEl.textContent = moneyShort(s.money);
    moneyEl.style.color = s.money < 0 ? "var(--orange-d)" : "";
    $("#stat-fans").textContent = formatNumber(s.fans);
    $("#stat-research").textContent = formatNumber(s.research);
    $("#stat-value").textContent = moneyShort(companyValue(s));
    $("#stat-date").textContent = this.dateLabel();
    this.renderProjectCard();
    this.renderEmpRail();
  }

  private renderProjectCard() {
    const s = this.engine.state;
    const card = $("#project-card");
    const p = s.currentProject;
    if (!p) {
      card.classList.add("hidden");
      return;
    }
    const frac = Math.min(1, p.weeksDone / p.totalWeeks);
    card.classList.remove("hidden");
    card.innerHTML = "";
    card.append(
      el("div", { class: "pc-label" }, ["In Entwicklung"]),
      el("div", { class: "pc-title" }, [p.name]),
      el("div", { class: "pc-tags" }, [
        `${getGenre(p.genreId).name} · ${getTopic(p.topicId).name}`,
      ]),
      el("div", { class: "pc-progress" }, [
        el("i", { style: `width:${Math.round(frac * 100)}%` }),
      ]),
      el("div", { class: "pc-week" }, [`Woche ${p.weeksDone}/${p.totalWeeks}`]),
    );
  }

  private renderEmpRail() {
    const s = this.engine.state;
    const rail = $("#emp-rail");
    rail.innerHTML = "";
    const shown = s.employees.slice(0, 6);
    for (const e of shown) {
      const lvl = Math.max(1, Math.round((e.design + e.tech) / 2));
      const avatar = el("div", {
        class: "emp-avatar",
        style: `background:${avatarColor(e.id)}`,
        title: `${e.name} · 🎨${e.design} ⚙️${e.tech}`,
      }, [
        initials(e.name),
        el("span", { class: "lvl" }, [String(lvl)]),
      ]);
      rail.append(avatar);
    }
    if (s.employees.length > shown.length) {
      rail.append(el("div", { class: "emp-avatar", style: "background:#9b8a6a" }, [
        `+${s.employees.length - shown.length}`,
      ]));
    }
  }

  private dateLabel(): string {
    const s = this.engine.state;
    const months = ["Jan","Feb","Mär","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez"];
    const m = Math.min(11, Math.floor(s.date.week / 4.34));
    return `${months[m]} ${s.date.year}`;
  }

  private bindSpeed() {
    document.querySelectorAll<HTMLButtonElement>(".speed-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const speed = Number(btn.dataset.speed) as 0 | 1 | 2 | 3;
        this.engine.setSpeed(speed);
        this.setActiveSpeed(speed);
      });
    });
  }

  private setActiveSpeed(speed: number) {
    document.querySelectorAll<HTMLButtonElement>(".speed-btn").forEach((b) => {
      b.classList.toggle("active", Number(b.dataset.speed) === speed);
    });
  }

  // ---- Ticker -------------------------------------------------------------
  private pushTicker(level: "info" | "good" | "bad", message: string) {
    const ticker = $("#ticker");
    const item = el("div", { class: `ticker-item ${level}` }, [message]);
    ticker.prepend(item);
    while (ticker.children.length > 5) ticker.lastElementChild?.remove();
    setTimeout(() => {
      item.classList.add("fade");
      setTimeout(() => item.remove(), 600);
    }, 6000);
  }

  // ---- Action bar ---------------------------------------------------------
  private bindActions() {
    document.querySelectorAll<HTMLButtonElement>(".action-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        switch (btn.dataset.action) {
          case "new-game": this.openNewGame(); break;
          case "staff": this.openStaff(); break;
          case "research": this.openResearch(); break;
          case "products": this.openProducts(); break;
          case "divisions": this.openDivisions(); break;
        }
      });
    });
  }

  // ---- Modal plumbing -----------------------------------------------------
  private openModal(title: string, body: HTMLElement, footer?: HTMLElement) {
    const root = $("#modal-root");
    root.innerHTML = "";
    const card = el("div", { class: "modal-card" }, [
      el("div", { class: "modal-head" }, [
        el("h2", {}, [title]),
        el("button", { class: "modal-close", onClick: () => this.closeModal() }, ["✕"]),
      ]),
      el("div", { class: "modal-body" }, [body]),
    ]);
    if (footer) card.append(footer);
    root.append(el("div", { class: "modal-backdrop", onClick: () => this.closeModal() }));
    root.append(card);
    root.classList.remove("hidden");
  }

  private closeModal() {
    const root = $("#modal-root");
    root.classList.add("hidden");
    root.innerHTML = "";
  }

  // ---- New Game panel -----------------------------------------------------
  private openNewGame() {
    const s = this.engine.state;
    if (s.currentProject) {
      this.openModal(
        "Entwicklung läuft",
        el("p", { class: "muted" }, [
          `„${s.currentProject.name}" wird gerade entwickelt. Warte, bis es fertig ist.`,
        ]),
      );
      return;
    }

    const platforms = platformsAvailable(s.date.year);
    const nameInput = el("input", {
      class: "field", type: "text", placeholder: "Titel deines Spiels", value: randomTitle(),
    }) as HTMLInputElement;

    const genreSel = selectFrom(GENRES.map((g) => [g.id, g.name]));
    const topicSel = selectFrom(TOPICS.map((t) => [t.id, t.name]));
    const platSel = selectFrom(platforms.map((p) => [p.id, `${p.name} (Lizenz ${formatMoney(p.licenseCost)})`]));

    let size: "small" | "medium" | "large" = "small";
    const sizeButtons = (["small", "medium", "large"] as const).map((sz) =>
      el("button", {
        class: "chip" + (sz === size ? " active" : ""),
        onClick: (ev: Event) => {
          size = sz;
          (ev.currentTarget as HTMLElement).parentElement
            ?.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
          (ev.currentTarget as HTMLElement).classList.add("active");
          updateInfo();
        },
      }, [`${SIZE_CONFIG[sz].label} · ${SIZE_CONFIG[sz].weeks} Wo.`]),
    );

    const info = el("p", { class: "info-line" });
    const updateInfo = () => {
      const cost = projectStartCost({
        name: "", genreId: genreSel.value, topicId: topicSel.value,
        platformId: platSel.value, size,
      });
      info.textContent = `Lizenzkosten: ${formatMoney(cost)} · geschätzte Dauer: ${SIZE_CONFIG[size].weeks} Wochen`;
    };
    [genreSel, topicSel, platSel].forEach((sel) => sel.addEventListener("change", updateInfo));
    updateInfo();

    const body = el("div", {}, [
      labeled("Titel", nameInput),
      labeled("Genre", genreSel),
      labeled("Thema", topicSel),
      labeled("Plattform", platSel),
      labeled("Umfang", el("div", { class: "chip-row" }, sizeButtons)),
      info,
    ]);

    const confirm = el("button", { class: "btn primary" }, ["Entwicklung starten"]);
    confirm.addEventListener("click", () => {
      const spec: NewProjectSpec = {
        name: nameInput.value.trim() || "Unbenannt",
        genreId: genreSel.value,
        topicId: topicSel.value,
        platformId: platSel.value,
        size,
      };
      const cost = projectStartCost(spec);
      if (s.money < cost) {
        this.pushTicker("bad", "Nicht genug Geld für die Plattform-Lizenz!");
        return;
      }
      s.money -= cost;
      startProject(s, spec);
      this.engine.setSpeed(1);
      this.setActiveSpeed(1);
      this.refreshTopbar();
      this.closeModal();
      this.pushTicker("info", `Entwicklung von „${spec.name}" gestartet.`);
    });

    this.openModal("Neues Spiel entwickeln", body, el("div", { class: "modal-foot" }, [confirm]));
  }

  // ---- Staff panel --------------------------------------------------------
  private openStaff() {
    const s = this.engine.state;

    const team = el("div", { class: "list" },
      s.employees.map((e) =>
        el("div", { class: "row" }, [
          el("div", { class: "row-main" }, [
            el("strong", {}, [e.name]),
            el("span", { class: "muted" }, [` · ${e.role}`]),
          ]),
          el("div", { class: "row-stats" }, [
            badge("🎨", e.design), badge("⚙️", e.tech),
            badge("⚡", Math.round(e.energy * 100) + "%"),
            el("span", { class: "salary" }, [`${formatMoney(e.salary)}/Wo.`]),
          ]),
        ]),
      ),
    );

    const canHire = s.employees.length < s.capacity;
    const candidates = el("div", { class: "list" },
      s.candidates.map((c) =>
        el("div", { class: "row" }, [
          el("div", { class: "row-main" }, [
            el("strong", {}, [c.name]),
            el("span", { class: "muted" }, [` · ${c.role}`]),
          ]),
          el("div", { class: "row-stats" }, [
            badge("🎨", c.design), badge("⚙️", c.tech),
            el("span", { class: "salary" }, [`${formatMoney(c.salary)}/Wo.`]),
            el("button", {
              class: "btn small" + (canHire ? "" : " disabled"),
              onClick: () => this.hire(c.id),
            }, [canHire ? "Einstellen" : "Voll"]),
          ]),
        ]),
      ),
    );

    const expandCost = s.capacity * 4000;
    const expand = el("button", { class: "btn" }, [
      `Büro erweitern (+2 Plätze) — ${formatMoney(expandCost)}`,
    ]);
    expand.addEventListener("click", () => {
      if (s.money < expandCost) { this.pushTicker("bad", "Nicht genug Geld."); return; }
      s.money -= expandCost;
      s.capacity += 2;
      this.refreshTopbar();
      this.openStaff();
    });

    const body = el("div", {}, [
      el("h3", {}, [`Team (${s.employees.length}/${s.capacity})`]),
      team,
      expand,
      el("h3", {}, ["Bewerber:innen"]),
      candidates,
    ]);
    this.openModal("Personal", body);
  }

  private hire(id: string) {
    const s = this.engine.state;
    if (s.employees.length >= s.capacity) {
      this.pushTicker("bad", "Kein freier Arbeitsplatz. Erweitere das Büro.");
      return;
    }
    const idx = s.candidates.findIndex((c) => c.id === id);
    if (idx < 0) return;
    const [emp] = s.candidates.splice(idx, 1);
    emp.seat = s.employees.length;
    s.employees.push(emp);
    this.pushTicker("good", `${emp.name} eingestellt!`);
    this.refreshTopbar();
    this.openStaff();
  }

  // ---- Research panel -----------------------------------------------------
  private openResearch() {
    const s = this.engine.state;
    const list = el("div", { class: "list" },
      s.research_topics.map((r) => {
        const reqMet = r.requires.every((req) =>
          s.research_topics.find((x) => x.id === req)?.researched);
        const affordable = s.research >= r.cost;
        const canDo = !r.researched && reqMet && affordable;
        const btn = el("button", {
          class: "btn small" + (canDo ? "" : " disabled"),
          onClick: () => canDo && this.doResearch(r.id),
        }, [r.researched ? "✓ Erforscht" : !reqMet ? "Gesperrt" : `${r.cost} 🔬`]);
        return el("div", { class: "row" }, [
          el("div", { class: "row-main" }, [
            el("strong", {}, [r.name]),
            el("div", { class: "muted small" }, [r.description]),
          ]),
          el("div", { class: "row-stats" }, [btn]),
        ]);
      }),
    );
    this.openModal(`Forschung (${formatNumber(s.research)} 🔬 verfügbar)`, list);
  }

  private doResearch(id: string) {
    const s = this.engine.state;
    const r = s.research_topics.find((x) => x.id === id);
    if (!r || r.researched || s.research < r.cost) return;
    s.research -= r.cost;
    r.researched = true;
    this.pushTicker("good", `Forschung abgeschlossen: ${r.name}`);
    if (r.unlocksDivision && !s.unlockedDivisions.includes(r.unlocksDivision)) {
      s.unlockedDivisions.push(r.unlocksDivision);
      this.pushTicker("good", `Neue Sparte freigeschaltet: ${DIVISION_INFO[r.unlocksDivision].name}!`);
    }
    this.refreshTopbar();
    this.openResearch();
  }

  // ---- Products panel -----------------------------------------------------
  private openProducts() {
    const s = this.engine.state;
    if (s.products.length === 0) {
      this.openModal("Produkte", el("p", { class: "muted" }, ["Noch keine Produkte veröffentlicht."]));
      return;
    }
    const list = el("div", { class: "list" },
      [...s.products].reverse().map((p) =>
        el("div", { class: "row" }, [
          el("div", { class: "row-main" }, [
            el("strong", {}, [p.name]),
            el("div", { class: "muted small" }, [
              `${getGenre(p.genreId!).name} · ${getTopic(p.topicId!).name} · ${getPlatform(p.platformId!).name}`,
            ]),
          ]),
          el("div", { class: "row-stats" }, [
            scorePill(p.reviewScore),
            badge("⭐", p.quality),
            el("span", { class: "muted small" }, [`${formatNumber(p.unitsSold)} verk.`]),
            el("span", { class: "salary" }, [formatMoney(p.revenue)]),
          ]),
        ]),
      ),
    );
    this.openModal("Produkte", list);
  }

  // ---- Divisions panel ----------------------------------------------------
  private openDivisions() {
    const s = this.engine.state;
    const list = el("div", { class: "list" },
      (Object.keys(DIVISION_INFO) as DivisionId[]).map((id) => {
        const info = DIVISION_INFO[id];
        const unlocked = s.unlockedDivisions.includes(id);
        return el("div", { class: "row division" + (unlocked ? "" : " locked") }, [
          el("div", { class: "row-main" }, [
            el("strong", {}, [`${info.icon} ${info.name}`]),
            el("div", { class: "muted small" }, [
              id === "games"
                ? "Deine Kernsparte — entwickle Spiele."
                : unlocked
                  ? "Freigeschaltet — Produktion folgt in einem späteren Update."
                  : `Gesperrt — erforsche „${this.researchName(info.researchId!)}".`,
            ]),
          ]),
          el("div", { class: "row-stats" }, [unlocked ? "✅" : "🔒"]),
        ]);
      }),
    );
    this.openModal("Sparten", list);
  }

  private researchName(id: string): string {
    return this.engine.state.research_topics.find((r) => r.id === id)?.name ?? id;
  }
}

// ---- small render helpers -------------------------------------------------
function labeled(label: string, control: HTMLElement): HTMLElement {
  return el("label", { class: "field-group" }, [
    el("span", { class: "field-label" }, [label]),
    control,
  ]);
}

function selectFrom(options: [string, string][]): HTMLSelectElement {
  return el("select", { class: "field" },
    options.map(([v, t]) => el("option", { value: v }, [t]))) as HTMLSelectElement;
}

function badge(icon: string, value: number | string): HTMLElement {
  return el("span", { class: "badge" }, [`${icon} ${value}`]);
}

function scorePill(score: number): HTMLElement {
  const cls = score >= 8 ? "good" : score >= 5 ? "ok" : "bad";
  return el("span", { class: `score-pill ${cls}` }, [`${score}/10`]);
}

function randomTitle(): string {
  const a = ["Epic", "Mega", "Super", "Galaxy", "Shadow", "Neon", "Turbo", "Crystal", "Cyber", "Dragon"];
  const b = ["Quest", "Wars", "Legends", "Rush", "Empire", "Saga", "Arena", "World", "Tycoon", "Force"];
  return `${a[Math.floor(Math.random() * a.length)]} ${b[Math.floor(Math.random() * b.length)]}`;
}

const AVATAR_COLORS = [
  "#4f86c6", "#e8643c", "#46a06f", "#9b6dd6", "#e0a13a", "#d64f7d", "#37b0c4",
];
function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}
function avatarColor(id: string): string {
  return AVATAR_COLORS[hashId(id) % AVATAR_COLORS.length];
}
function initials(name: string): string {
  const parts = name.replace(/[()]/g, "").trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function moneyShort(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + " Mrd";
  if (abs >= 1_000_000) return (n / 1_000_000).toFixed(2) + " Mio";
  if (abs >= 10_000) return Math.round(n / 1000) + "K";
  return Math.round(n).toLocaleString("de-DE");
}
