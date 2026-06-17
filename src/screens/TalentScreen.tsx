import { useRef, useState } from "react";
import { C, mono, sans } from "../theme";
import type { GameState, Employee } from "../game/types";
import { fmtMoney } from "../game/engine";
import { Header, Pulse } from "../components/Chrome";

export function TalentScreen({
  s, onHire, onReject,
}: {
  s: GameState;
  onHire: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const [drag, setDrag] = useState(0);
  const start = useRef<number | null>(null);

  const card: Employee | undefined = s.candidates[0];

  const decide = (dir: 1 | -1) => {
    if (!card) return;
    setDrag(dir * 460);
    const id = card.id;
    setTimeout(() => {
      if (dir === 1) onHire(id);
      else onReject(id);
      setDrag(0);
    }, 220);
  };

  const Stat = ({ k, v }: { k: string; v: number }) => (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: mono, fontSize: 10, letterSpacing: 1 }}>
        <span style={{ color: C.steel, textTransform: "uppercase" }}>{k}</span>
        <span style={{ color: C.snow }}>{v}</span>
      </div>
      <div style={{ height: 5, background: "rgba(255,255,255,.07)", borderRadius: 3, marginTop: 4 }}>
        <div style={{ width: `${v}%`, height: "100%", borderRadius: 3, background: `linear-gradient(90deg, ${C.cyan}, ${C.ember})` }} />
      </div>
    </div>
  );

  return (
    <div style={{ height: "100%", background: C.void, position: "relative" }}>
      <Header title="TALENT" sub={`Recruiting · ${s.candidates.length} Leads`} right={<Pulse value={`${s.employees.length}`} label="hired" color={C.ember} />} />

      <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 3, color: C.steel, padding: "0 26px 16px" }}>
        ← ABLEHNEN · EINSTELLEN →
      </div>

      <div style={{ position: "relative", height: 410, margin: "0 22px" }}>
        {!card && (
          <div style={{
            position: "absolute", inset: 0, display: "grid", placeItems: "center",
            border: `1.5px dashed ${C.lineBright}`, borderRadius: 24,
            fontFamily: mono, fontSize: 12, color: C.steel, textAlign: "center", padding: 30,
          }}>
            Keine Leads mehr.<br />Nächstes Quartal kommen neue Talente.
          </div>
        )}

        {s.candidates[1] && (
          <div style={{ position: "absolute", inset: "14px 14px auto", height: 372, borderRadius: 24, background: C.panel, border: `1px solid ${C.line}`, transform: "scale(.94) translateY(10px)", opacity: 0.5 }} />
        )}

        {card && (
          <div
            onPointerDown={(e) => { start.current = e.clientX; }}
            onPointerMove={(e) => { if (start.current != null) setDrag(e.clientX - start.current); }}
            onPointerUp={() => {
              if (drag > 90) decide(1);
              else if (drag < -90) decide(-1);
              else setDrag(0);
              start.current = null;
            }}
            style={{
              position: "absolute", inset: 0, height: 392, borderRadius: 24,
              background: `linear-gradient(160deg, ${C.panel2}, ${C.panel})`,
              border: `1px solid ${C.lineBright}`, boxShadow: "0 24px 60px rgba(0,0,0,.6)",
              padding: 22, transform: `translateX(${drag}px) rotate(${drag / 28}deg)`,
              transition: start.current == null ? "transform .22s ease" : "none",
              cursor: "grab", touchAction: "none", userSelect: "none",
            }}
          >
            <div style={{
              position: "absolute", inset: 0, borderRadius: 24,
              background: drag > 0 ? C.cyanDim : drag < 0 ? "rgba(255,77,94,.14)" : "transparent",
              opacity: Math.min(Math.abs(drag) / 120, 1), pointerEvents: "none",
            }} />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontFamily: sans, fontSize: 21, fontWeight: 800, color: C.snow, letterSpacing: -0.5 }}>{card.name}</div>
                <div style={{ fontFamily: mono, fontSize: 11, color: C.steel, marginTop: 3 }}>{card.role}</div>
              </div>
              <div style={{ fontFamily: mono, fontSize: 10, color: card.traitColor, border: `1px solid ${card.traitColor}`, borderRadius: 20, padding: "5px 11px", letterSpacing: 1 }}>
                {card.trait}
              </div>
            </div>

            <div style={{ marginTop: 14, fontFamily: mono, fontSize: 10, letterSpacing: 1, color: C.steel }}>ZUWEISBAR ZU</div>
            <div style={{ fontFamily: sans, fontSize: 14, fontWeight: 600, color: C.cyan, marginTop: 2 }}>{card.layerTag}</div>

            <div style={{ marginTop: 16 }}>
              {(Object.entries(card.stats) as [string, number][]).map(([k, v]) => <Stat key={k} k={k} v={v} />)}
            </div>

            <div style={{ marginTop: 16, padding: 12, background: "rgba(255,255,255,.03)", border: `1px solid ${C.line}`, borderRadius: 12, fontFamily: sans, fontSize: 12, color: C.steel, lineHeight: 1.45 }}>
              <span style={{ color: card.traitColor, fontWeight: 700 }}>{card.trait}: </span>{card.note}
            </div>

            <div style={{ position: "absolute", bottom: 20, left: 22, right: 22, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: mono, fontSize: 15, fontWeight: 700, color: C.ember }}>{fmtMoney(card.costPerMo)}/mo</span>
              <span style={{ fontFamily: mono, fontSize: 10, color: C.steel }}>Burn-Impact</span>
            </div>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 14, justifyContent: "center", marginTop: 24 }}>
        <button onClick={() => decide(-1)} disabled={!card} style={btn(C.bad, false, !card)}>✕  Ablehnen</button>
        <button onClick={() => decide(1)} disabled={!card} style={btn(C.cyan, true, !card)}>Einstellen  ✓</button>
      </div>
    </div>
  );
}

function btn(color: string, filled: boolean, disabled: boolean): React.CSSProperties {
  return {
    border: `1px solid ${color}`,
    background: filled ? color : "transparent",
    color: filled ? C.void : color,
    borderRadius: 14,
    padding: "13px 22px",
    fontFamily: sans,
    fontSize: 14,
    fontWeight: 700,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.4 : 1,
  };
}
