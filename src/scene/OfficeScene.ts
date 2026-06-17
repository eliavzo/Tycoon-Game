import Phaser from "phaser";
import type { GameEngine } from "../core/engine";

const PALETTE = [0x6c8cff, 0xff7eb6, 0x4dd4ac, 0xffb74d, 0xba8cff, 0xff6b6b, 0x4db8ff, 0xffd54d];

interface DeskView {
  container: Phaser.GameObjects.Container;
  head: Phaser.GameObjects.Arc;
  body: Phaser.GameObjects.Graphics;
  monitor: Phaser.GameObjects.Rectangle;
  bob?: Phaser.Tweens.Tween;
  occupied: boolean;
}

export class OfficeScene extends Phaser.Scene {
  private engine!: GameEngine;
  private desks: DeskView[] = [];
  private progressBg?: Phaser.GameObjects.Graphics;
  private progressFg?: Phaser.GameObjects.Graphics;
  private progressLabel?: Phaser.GameObjects.Text;
  private titleText?: Phaser.GameObjects.Text;

  constructor() {
    super("office");
  }

  init(data: { engine: GameEngine }) {
    this.engine = data.engine;
  }

  create() {
    this.drawFloor();

    this.titleText = this.add
      .text(20, 16, "", {
        fontFamily: "Inter, system-ui, sans-serif",
        fontSize: "16px",
        color: "#cdd6ff",
      })
      .setAlpha(0.8);

    this.buildOffice();

    this.engine.on((e) => {
      if (e.type === "tick") this.sync();
      if (e.type === "release") this.celebrate();
    });

    this.scale.on("resize", () => this.relayout());
    this.sync();
  }

  private drawFloor() {
    const { width, height } = this.scale;
    const g = this.add.graphics();
    g.fillStyle(0x0e1430, 1);
    g.fillRect(0, 0, width, height);
    // grid
    g.lineStyle(1, 0x1b2550, 0.6);
    for (let x = 0; x < width; x += 48) g.lineBetween(x, 0, x, height);
    for (let y = 0; y < height; y += 48) g.lineBetween(0, y, width, y);
    g.setDepth(-10);
  }

  private buildOffice() {
    this.desks.forEach((d) => d.container.destroy());
    this.desks = [];

    const capacity = Math.max(this.engine.state.capacity, this.engine.state.employees.length);
    for (let i = 0; i < capacity; i++) {
      this.desks.push(this.makeDesk(i));
    }
    this.relayout();
  }

  private makeDesk(index: number): DeskView {
    const container = this.add.container(0, 0);

    // desk surface
    const desk = this.add.graphics();
    desk.fillStyle(0x223066, 1);
    desk.fillRoundedRect(-40, 6, 80, 36, 8);
    desk.fillStyle(0x2c3b7d, 1);
    desk.fillRoundedRect(-40, 2, 80, 10, 6);

    // monitor
    const monitor = this.add.rectangle(0, -2, 30, 20, 0x9fe3ff).setStrokeStyle(2, 0x0a1330);

    // character
    const body = this.add.graphics();
    const color = PALETTE[index % PALETTE.length];
    body.fillStyle(color, 1);
    body.fillRoundedRect(-14, -34, 28, 30, 10);
    const head = this.add.circle(0, -42, 11, 0xf2d3b3);

    container.add([desk, body, monitor, head]);
    container.setSize(90, 90);

    return { container, head, body, monitor, occupied: false };
  }

  private relayout() {
    const { width } = this.scale;
    const cols = Math.max(2, Math.min(5, Math.floor((width - 80) / 150)));
    const spacingX = Math.min(180, (width - 80) / cols);
    const spacingY = 130;
    const startX = (width - (cols - 1) * spacingX) / 2;
    const startY = 110;

    this.desks.forEach((d, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      d.container.setPosition(startX + col * spacingX, startY + row * spacingY);
    });

    // progress bar position (bottom area)
    if (this.titleText) this.titleText.setPosition(20, 16);
  }

  private sync() {
    const s = this.engine.state;
    const need = Math.max(s.capacity, s.employees.length);
    if (need !== this.desks.length) this.buildOffice();

    this.desks.forEach((d, i) => {
      const occupied = i < s.employees.length;
      d.occupied = occupied;
      d.container.setAlpha(occupied ? 1 : 0.28);
      d.head.setVisible(occupied);
      d.body.setVisible(occupied);

      const working = occupied && !!s.currentProject;
      if (working && !d.bob) {
        d.bob = this.tweens.add({
          targets: d.head,
          y: "-=4",
          duration: 320 + i * 30,
          yoyo: true,
          repeat: -1,
          ease: "Sine.inOut",
        });
        d.monitor.setFillStyle(0x7CFFB2);
      } else if (!working && d.bob) {
        d.bob.stop();
        d.bob = undefined;
        d.head.y = -42;
        d.monitor.setFillStyle(0x9fe3ff);
      }
    });

    this.drawProgress();
  }

  private drawProgress() {
    const s = this.engine.state;
    const { width, height } = this.scale;
    const bw = Math.min(520, width - 80);
    const x = (width - bw) / 2;
    const y = height - 54;

    if (!this.progressBg) {
      this.progressBg = this.add.graphics().setDepth(20);
      this.progressFg = this.add.graphics().setDepth(21);
      this.progressLabel = this.add
        .text(width / 2, y - 16, "", {
          fontFamily: "Inter, system-ui, sans-serif",
          fontSize: "14px",
          color: "#e6ecff",
        })
        .setOrigin(0.5)
        .setDepth(22);
    }

    this.progressBg!.clear();
    this.progressFg!.clear();

    if (s.currentProject) {
      const p = s.currentProject;
      const frac = Phaser.Math.Clamp(p.weeksDone / p.totalWeeks, 0, 1);
      this.progressBg!.fillStyle(0x16204a, 1).fillRoundedRect(x, y, bw, 14, 7);
      this.progressFg!.fillStyle(0x6c8cff, 1).fillRoundedRect(x, y, bw * frac, 14, 7);
      this.progressLabel!.setPosition(width / 2, y - 16).setText(
        `In Entwicklung: „${p.name}" — Woche ${p.weeksDone}/${p.totalWeeks}`,
      );
      this.progressLabel!.setVisible(true);
    } else {
      this.progressLabel!.setVisible(false);
    }

    if (this.titleText) {
      this.titleText.setText(
        `${s.companyName} · ${s.employees.length}/${s.capacity} Plätze belegt`,
      );
    }
  }

  private celebrate() {
    const { width, height } = this.scale;
    for (let i = 0; i < 40; i++) {
      const c = this.add
        .rectangle(width / 2, height / 2, 8, 8, PALETTE[i % PALETTE.length])
        .setDepth(50);
      this.tweens.add({
        targets: c,
        x: width / 2 + Phaser.Math.Between(-width / 2, width / 2),
        y: Phaser.Math.Between(20, height),
        angle: Phaser.Math.Between(0, 360),
        alpha: 0,
        duration: Phaser.Math.Between(800, 1600),
        ease: "Cubic.out",
        onComplete: () => c.destroy(),
      });
    }
  }
}
