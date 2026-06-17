import { C, mono, sans } from "../theme";
import type { GameState, Layer } from "../game/types";
import { capacityOf, fmtMoney, fmtNum, scaleCost } from "../game/engine";
import { Header, Pulse, ActivityLog } from "../components/Chrome";

export function StackScreen({
  s, onScale,
}: {
  s: GameState;
  onScale: (id: string) => void;
}) {
  const layerColor = (l: Layer) => {
    if (l.load > 0.8) return C.bad;
    if (l.id === "growth" || l.id === "product" || l.id === "api") return C.ember;
    return C.cyan;
  };

  const LayerRow = ({ l, i }: { l: Layer; i: number }) => {
    const hot = l.load > 0.8;
    const col = layerColor(l);
    const cap = capacityOf(l, s);
    const staff = s.employees.filter((e) => e.assignedLayerId === l.id).length;
    const cost = scaleCost(l);
    const affordable = s.cash >= cost;
    return (
      <div
        style={{
          margin: "0 22px 12px",
          borderRadius: 16,
          padding: "13px 15px",
          background: `linear-gradient(135deg, ${C.panel2}, ${C.panel})`,
          border: `1px solid ${hot ? C.bad : C.line}`,
          boxShadow: hot ? undefined : "0 8px 22px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.04)",
          position: "relative",
          overflow: "hidden",
          animation: `breathe ${5 + (i % 3)}s ease-in-out ${i * 0.3}s infinite${hot ? ", hotglow 1.4s ease-in-out infinite" : ""}`,
        }}
      >
        <div style={{
          position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: col,
          boxShadow: `0 0 8px ${col}`, animation: "pulseline 2.4s ease-in-out infinite",
        }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: sans, fontSize: 16, fontWeight: 700, color: C.snow }}>{l.name}</div>
            <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 2, color: C.steel, marginTop: 2 }}>
              {l.tag} · L{l.level}{staff > 0 ? ` · ${staff}👤` : ""}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: mono, fontSize: 14, fontWeight: 700, color: hot ? C.bad : col }}>
              {Math.round(l.load * 100)}%
            </div>
            <div style={{ fontFamily: mono, fontSize: 8, letterSpacing: 1, color: C.steel }}>
              CAP {fmtNum(cap)}
            </div>
          </div>
        </div>

        <div style={{ height: 4, borderRadius: 3, background: "rgba(255,255,255,.07)", marginTop: 10, overflow: "hidden" }}>
          <div style={{
            width: `${Math.min(100, l.load * 100)}%`, height: "100%", borderRadius: 3,
            background: hot ? C.bad : col, boxShadow: `0 0 6px ${hot ? C.bad : col}`,
            transition: "width .8s ease",
          }} />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 11 }}>
          <div style={{ fontFamily: mono, fontSize: 9, color: hot ? C.bad : C.steel, letterSpacing: 0.5 }}>
            {hot ? "⚠ ÜBERLASTET · skalieren" : "stabil"}
          </div>
          <button
            onClick={() => onScale(l.id)}
            disabled={!affordable}
            style={{
              fontFamily: mono, fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
              color: affordable ? C.void : C.steel,
              background: affordable ? col : "rgba(255,255,255,.06)",
              border: "none", borderRadius: 9, padding: "6px 12px",
              cursor: affordable ? "pointer" : "not-allowed", opacity: affordable ? 1 : 0.6,
            }}
          >
            SCALE ↑ {fmtMoney(cost)}
          </button>
        </div>
      </div>
    );
  };

  const metrics = [
    { v: fmtMoney(s.valuation), l: "valuation", c: C.snow },
    { v: fmtNum(s.users), l: "users", c: C.cyan },
    { v: fmtMoney(s.cash), l: "cash", c: s.cash < 40000 ? C.bad : C.ember },
  ];

  return (
    <div style={{ height: "100%", background: C.void, position: "relative", overflowY: "auto" }}>
      <div style={{
        position: "absolute", top: "30%", left: "50%", transform: "translateX(-50%)",
        width: 280, height: 280, background: `radial-gradient(circle, ${C.emberDim}, transparent 70%)`, pointerEvents: "none",
      }} />

      <Header
        title={s.company}
        sub={`Jahr ${s.year} · Q${s.quarter} · Monat ${s.month + 1}`}
        right={<Pulse value={`${s.uptime.toFixed(2)}%`} label="uptime" color={s.uptime < 95 ? C.bad : C.cyan} />}
      />

      <div style={{ margin: "0 22px 16px", display: "flex", gap: 9 }}>
        {metrics.map((m) => (
          <div key={m.l} style={{ flex: 1, background: C.panel, border: `1px solid ${C.line}`, borderRadius: 14, padding: "10px 11px" }}>
            <div style={{ fontFamily: mono, fontSize: 15, fontWeight: 700, color: m.c }}>{m.v}</div>
            <div style={{ fontFamily: mono, fontSize: 8, letterSpacing: 1.5, color: C.steel, textTransform: "uppercase" }}>{m.l}</div>
          </div>
        ))}
      </div>

      <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 3, color: C.steel, padding: "0 26px 10px" }}>
        DEIN STACK ↓ Last in Echtzeit
      </div>

      {s.layers.map((l, i) => <LayerRow key={l.id} l={l} i={i} />)}

      <div style={{ height: 14 }} />
      <ActivityLog items={s.log} />
      <div style={{ height: 110 }} />
    </div>
  );
}
