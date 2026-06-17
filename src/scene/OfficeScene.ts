import Phaser from "phaser";
import type { GameEngine } from "../core/engine";
import type { Employee } from "../core/types";

const TILE_W = 64;
const TILE_H = 32;
const GRID = 7; // tiles per side
const WALL_H = 46;

// warm palettes inspired by Game Dev Tycoon
const SHIRTS = [0x4f86c6, 0xe8643c, 0x46a06f, 0x9b6dd6, 0xe0a13a, 0xd64f7d, 0x37b0c4];
const SKIN = [0xf3d3b3, 0xe8b894, 0xc98e63, 0xa56a43, 0xf7dcc0];
const HAIR = [0x2c2117, 0x6b4423, 0xd9a441, 0x111111, 0x8a5a2b, 0x4a4a4a];

interface Workstation {
  c: number;
  r: number;
  deskGfx: Phaser.GameObjects.Graphics;
  charContainer?: Phaser.GameObjects.Container;
  bob?: Phaser.Tweens.Tween;
  occupied: boolean;
}

function isoX(c: number, r: number): number {
  return (c - r) * (TILE_W / 2);
}
function isoY(c: number, r: number): number {
  return (c + r) * (TILE_H / 2);
}
function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

export class OfficeScene extends Phaser.Scene {
  private engine!: GameEngine;
  private stations: Workstation[] = [];
  private decor: Phaser.GameObjects.GameObject[] = [];

  // candidate seat tiles (filled as capacity grows)
  private seatTiles = [
    { c: 2, r: 2 }, { c: 4, r: 2 }, { c: 2, r: 4 }, { c: 4, r: 4 },
    { c: 6, r: 2 }, { c: 6, r: 4 }, { c: 2, r: 6 }, { c: 4, r: 6 },
    { c: 6, r: 6 }, { c: 2, r: 0 }, { c: 4, r: 0 }, { c: 6, r: 0 },
  ];

  constructor() {
    super("office");
  }

  init(data: { engine: GameEngine }) {
    this.engine = data.engine;
  }

  create() {
    this.cameras.main.setBackgroundColor("#efe2c4");
    this.buildRoom();
    this.placeDecor();
    this.syncStations();
    this.fitCamera();

    this.engine.on((e) => {
      if (e.type === "tick") this.syncStations();
      if (e.type === "release") this.celebrate();
    });
    this.scale.on("resize", () => this.fitCamera());
  }

  // ---- camera fit ---------------------------------------------------------
  private fitCamera() {
    const cam = this.cameras.main;
    const roomW = GRID * TILE_W + 160;
    const roomH = GRID * TILE_H * 2 + WALL_H + 200;
    const zoom = Math.min(this.scale.width / roomW, this.scale.height / roomH);
    cam.setZoom(Phaser.Math.Clamp(zoom, 0.5, 2.2));
    cam.centerOn(0, isoY(GRID / 2, GRID / 2) - WALL_H * 0.4);
  }

  // ---- room (floor + walls) ----------------------------------------------
  private buildRoom() {
    const g = this.add.graphics();
    g.setDepth(-100000);

    // floor tiles
    for (let c = 0; c < GRID; c++) {
      for (let r = 0; r < GRID; r++) {
        const cx = isoX(c, r);
        const cy = isoY(c, r);
        const base = (c + r) % 2 === 0 ? 0x3fae9f : 0x39a394;
        // lounge rug zone near front-left
        const rug = c <= 1 && r >= GRID - 2;
        this.diamond(g, cx, cy, rug ? 0xe0a13a : base, 1);
        // subtle tile outline
        g.lineStyle(1, 0x2f8a7d, 0.25);
        this.diamondStroke(g, cx, cy);
      }
    }

    // back-left wall (along r = 0 edge, varying c) and back-right wall (c = 0, varying r)
    this.drawWall("right");
    this.drawWall("left");
  }

  private diamond(g: Phaser.GameObjects.Graphics, cx: number, cy: number, color: number, alpha: number) {
    g.fillStyle(color, alpha);
    g.beginPath();
    g.moveTo(cx, cy - TILE_H / 2);
    g.lineTo(cx + TILE_W / 2, cy);
    g.lineTo(cx, cy + TILE_H / 2);
    g.lineTo(cx - TILE_W / 2, cy);
    g.closePath();
    g.fillPath();
  }
  private diamondStroke(g: Phaser.GameObjects.Graphics, cx: number, cy: number) {
    g.beginPath();
    g.moveTo(cx, cy - TILE_H / 2);
    g.lineTo(cx + TILE_W / 2, cy);
    g.lineTo(cx, cy + TILE_H / 2);
    g.lineTo(cx - TILE_W / 2, cy);
    g.closePath();
    g.strokePath();
  }

  private drawWall(side: "left" | "right") {
    const g = this.add.graphics();
    g.setDepth(-90000);
    const wallFace = side === "left" ? 0xe9dcc0 : 0xddcfae;
    const wallTop = 0xf3e9d2;

    for (let i = 0; i < GRID; i++) {
      const c = side === "left" ? 0 : i;
      const r = side === "left" ? i : 0;
      const cx = isoX(c, r);
      const cy = isoY(c, r);
      // back edge of this tile
      const ex = side === "left" ? cx - TILE_W / 2 : cx + TILE_W / 2;
      const ey = cy;
      const bx = cx;
      const by = cy - TILE_H / 2;

      g.fillStyle(wallFace, 1);
      g.beginPath();
      g.moveTo(bx, by);
      g.lineTo(ex, ey);
      g.lineTo(ex, ey - WALL_H);
      g.lineTo(bx, by - WALL_H);
      g.closePath();
      g.fillPath();

      // top trim
      g.fillStyle(wallTop, 1);
      g.fillRect(Math.min(bx, ex), Math.min(by, ey) - WALL_H - 3, Math.abs(ex - bx) || 2, 4);
    }

    // a window + poster on back walls for life
    if (side === "right") {
      const cx = isoX(2, 0), cy = isoY(2, 0);
      this.add.rectangle(cx + 6, cy - WALL_H + 2, 26, 22, 0x9fd8ef)
        .setDepth(-89000).setStrokeStyle(3, 0xf3e9d2).setAlpha(0.95)
        .setAngle(0);
    } else {
      const cx = isoX(0, 2), cy = isoY(0, 2);
      this.add.rectangle(cx - 6, cy - WALL_H + 4, 22, 26, 0xe8643c)
        .setDepth(-89000).setStrokeStyle(3, 0xf3e9d2).setAlpha(0.9);
    }
  }

  // ---- isometric box helper ----------------------------------------------
  private isoBox(
    g: Phaser.GameObjects.Graphics,
    cx: number, cy: number, s: number, h: number,
    top: number, left: number, right: number,
  ) {
    const hw = (TILE_W / 2) * s;
    const hh = (TILE_H / 2) * s;
    // top
    g.fillStyle(top, 1);
    g.beginPath();
    g.moveTo(cx, cy - h - hh);
    g.lineTo(cx + hw, cy - h);
    g.lineTo(cx, cy - h + hh);
    g.lineTo(cx - hw, cy - h);
    g.closePath();
    g.fillPath();
    // left
    g.fillStyle(left, 1);
    g.beginPath();
    g.moveTo(cx - hw, cy - h);
    g.lineTo(cx, cy - h + hh);
    g.lineTo(cx, cy + hh);
    g.lineTo(cx - hw, cy);
    g.closePath();
    g.fillPath();
    // right
    g.fillStyle(right, 1);
    g.beginPath();
    g.moveTo(cx + hw, cy - h);
    g.lineTo(cx, cy - h + hh);
    g.lineTo(cx, cy + hh);
    g.lineTo(cx + hw, cy);
    g.closePath();
    g.fillPath();
  }

  // ---- decorations --------------------------------------------------------
  private placeDecor() {
    this.decor.forEach((d) => d.destroy());
    this.decor = [];

    // plants in corners
    this.plant(6, 6);
    this.plant(0, 0);
    this.plant(6, 0.2);
    this.plant(0.2, 6);

    // bookshelves on back walls
    this.bookshelf(3, 0);
    this.bookshelf(5, 0);
    this.bookshelf(0, 3);

    // lounge: sofa + table on the rug
    this.sofa(0.6, 5.6);
    this.lowTable(1.1, 6.1);

    // water cooler
    this.cooler(6, 3);
  }

  private addDecorGfx(cy: number): Phaser.GameObjects.Graphics {
    const g = this.add.graphics();
    g.setDepth(cy);
    this.decor.push(g);
    return g;
  }

  private plant(c: number, r: number) {
    const cx = isoX(c, r), cy = isoY(c, r);
    const g = this.addDecorGfx(cy);
    this.isoBox(g, cx, cy, 0.32, 10, 0xb5743a, 0x8c5326, 0x70411d); // pot
    g.fillStyle(0x2f8f4e, 1);
    g.fillCircle(cx, cy - 20, 11);
    g.fillStyle(0x3aa860, 1);
    g.fillCircle(cx - 6, cy - 15, 8);
    g.fillCircle(cx + 6, cy - 16, 8);
    g.fillStyle(0x46c373, 1);
    g.fillCircle(cx, cy - 28, 8);
  }

  private bookshelf(c: number, r: number) {
    const cx = isoX(c, r), cy = isoY(c, r);
    const g = this.addDecorGfx(cy);
    this.isoBox(g, cx, cy, 0.7, 34, 0x9c6b3f, 0x7c4f2a, 0x5f3b1e);
    // book rows on the top-left face
    const colors = [0xe8643c, 0x4f86c6, 0x46a06f, 0xe0a13a];
    for (let i = 0; i < 3; i++) {
      g.fillStyle(colors[i % colors.length], 1);
      g.fillRect(cx - 14, cy - 30 + i * 9, 12, 4);
    }
  }

  private sofa(c: number, r: number) {
    const cx = isoX(c, r), cy = isoY(c, r);
    const g = this.addDecorGfx(cy);
    this.isoBox(g, cx, cy, 0.85, 10, 0x4f6f8c, 0x3f5a73, 0x32485d);
    this.isoBox(g, cx, cy - 6, 0.85, 14, 0x5b7d9c, 0x3f5a73, 0x32485d);
  }

  private lowTable(c: number, r: number) {
    const cx = isoX(c, r), cy = isoY(c, r);
    const g = this.addDecorGfx(cy);
    this.isoBox(g, cx, cy, 0.45, 7, 0xcaa06a, 0xa37f4f, 0x836339);
  }

  private cooler(c: number, r: number) {
    const cx = isoX(c, r), cy = isoY(c, r);
    const g = this.addDecorGfx(cy);
    this.isoBox(g, cx, cy, 0.34, 22, 0xeaf3f7, 0xcddde6, 0xb4c8d3);
    g.fillStyle(0x6fc6e8, 1);
    g.fillCircle(cx, cy - 18, 5);
  }

  // ---- desks + employees --------------------------------------------------
  private syncStations() {
    const s = this.engine.state;
    const need = Math.max(s.capacity, s.employees.length);

    if (this.stations.length !== need) {
      this.stations.forEach((st) => {
        st.deskGfx.destroy();
        st.charContainer?.destroy();
        st.bob?.stop();
      });
      this.stations = [];
      for (let i = 0; i < need; i++) {
        const tile = this.seatTiles[i % this.seatTiles.length];
        const extra = Math.floor(i / this.seatTiles.length);
        const c = tile.c, r = tile.r + extra * 0.0;
        this.stations.push(this.makeStation(c + (extra ? 0.5 : 0), r));
      }
    }

    const working = !!s.currentProject;
    this.stations.forEach((st, i) => {
      const emp = s.employees[i];
      this.setStationEmployee(st, emp, working);
    });
  }

  private makeStation(c: number, r: number): Workstation {
    const cx = isoX(c, r), cy = isoY(c, r);
    const g = this.add.graphics();
    g.setDepth(cy + 2); // desk in front of seated person
    // desk body
    this.isoBox(g, cx, cy, 0.78, 12, 0xc88f57, 0xa06f3e, 0x7d5429);
    // monitor base + screen
    this.isoBox(g, cx, cy - 12, 0.22, 9, 0x2a2f3a, 0x20242d, 0x161a21);
    return { c, r, deskGfx: g, occupied: false };
  }

  private setStationEmployee(st: Workstation, emp: Employee | undefined, working: boolean) {
    const cx = isoX(st.c, st.r), cy = isoY(st.c, st.r);

    if (!emp) {
      st.occupied = false;
      st.deskGfx.setAlpha(0.4);
      st.charContainer?.destroy();
      st.charContainer = undefined;
      st.bob?.stop();
      st.bob = undefined;
      return;
    }

    st.deskGfx.setAlpha(1);
    if (!st.charContainer) {
      st.charContainer = this.makeCharacter(emp);
      st.charContainer.setPosition(cx, cy - 4);
      st.charContainer.setDepth(cy + 1);
    }
    st.occupied = true;

    // typing bob while a project is active
    if (working && !st.bob && st.charContainer) {
      const head = st.charContainer.getByName("head") as Phaser.GameObjects.Arc;
      st.bob = this.tweens.add({
        targets: head,
        y: head.y - 2,
        duration: 260 + (hashId(emp.id) % 120),
        yoyo: true,
        repeat: -1,
        ease: "Sine.inOut",
      });
      const bubble = st.charContainer.getByName("bubble") as Phaser.GameObjects.Container;
      bubble?.setVisible(true);
    } else if (!working && st.bob) {
      st.bob.stop();
      st.bob = undefined;
      const bubble = st.charContainer?.getByName("bubble") as Phaser.GameObjects.Container;
      bubble?.setVisible(false);
    }
  }

  private makeCharacter(emp: Employee): Phaser.GameObjects.Container {
    const h = hashId(emp.id);
    const shirt = SHIRTS[h % SHIRTS.length];
    const skin = SKIN[(h >> 3) % SKIN.length];
    const hair = HAIR[(h >> 6) % HAIR.length];

    const container = this.add.container(0, 0);

    // shadow
    const shadow = this.add.ellipse(0, 6, 26, 12, 0x000000, 0.18);

    // chair back
    const chair = this.add.graphics();
    chair.fillStyle(0x333a45, 1);
    chair.fillRoundedRect(-9, -34, 18, 22, 5);

    // body
    const body = this.add.graphics();
    body.fillStyle(shirt, 1);
    body.fillRoundedRect(-11, -30, 22, 24, 8);
    body.fillStyle(Phaser.Display.Color.IntegerToColor(shirt).darken(12).color, 1);
    body.fillRoundedRect(-11, -14, 22, 8, 4);

    // head
    const head = this.add.circle(0, -40, 8, skin);
    head.setName("head");
    const hairG = this.add.graphics();
    hairG.fillStyle(hair, 1);
    hairG.slice(0, -42, 9, Phaser.Math.DegToRad(180), Phaser.Math.DegToRad(360), true);
    hairG.fillPath();

    // work bubble (hidden by default)
    const bubble = this.add.container(0, -58);
    const bb = this.add.graphics();
    bb.fillStyle(0xffffff, 0.95);
    bb.fillRoundedRect(-13, -12, 26, 22, 7);
    bb.fillTriangle(-4, 9, 4, 9, 0, 15);
    const icon = this.add.text(0, -1, "💡", { fontSize: "14px" }).setOrigin(0.5);
    bubble.add([bb, icon]);
    bubble.setName("bubble");
    bubble.setVisible(false);

    container.add([shadow, chair, body, head, hairG, bubble]);
    return container;
  }

  // ---- celebration on release --------------------------------------------
  private celebrate() {
    const cx = 0;
    const cy = isoY(GRID / 2, GRID / 2) - 60;
    for (let i = 0; i < 36; i++) {
      const col = SHIRTS[i % SHIRTS.length];
      const conf = this.add.rectangle(cx, cy, 7, 7, col).setDepth(100000);
      this.tweens.add({
        targets: conf,
        x: cx + Phaser.Math.Between(-180, 180),
        y: cy + Phaser.Math.Between(-40, 220),
        angle: Phaser.Math.Between(0, 360),
        alpha: 0,
        duration: Phaser.Math.Between(900, 1700),
        ease: "Cubic.out",
        onComplete: () => conf.destroy(),
      });
    }
  }
}
