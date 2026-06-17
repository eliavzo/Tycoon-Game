import { useEffect, useState } from "react";
import { C, mono, sans } from "../theme";
import type { GameState } from "../game/types";
import { Header, Pulse } from "../components/Chrome";

export function ShipScreen({
  s, onAlloc, onShipDone,
}: {
  s: GameState;
  onAlloc: (k: "Speed" | "Polish" | "Scale", v: number) => void;
  onShipDone: () => void;
}) {
  const [launching, setLaunching] = useState(false);
  const [t, setT] = useState(0);

  useEffect(() => {
    if (!launching) return;
    setT(0);
    const id = setInterval(() => {
      setT((v) => {
        if (v >= 100) {
          clearInterval(id);
          return 100;
        }
        return v + 4;
      });
    }, 40);
    return () => clearInterval(id);
  }, [launching]);

  useEffect(() => {
    if (launching && t >= 100) {
      const done = setTimeout(() => {
        onShipDone();
        setLaunching(false);
        setT(0);
      }, 900);
      return () => clearTimeout(done);
    }
  }, [t, launching, onShipDone]);

  const { Speed, Polish, Scale } = s.alloc;
  const score = Math.round((Speed + Polish + Scale) / 3);
  const risk = Scale < 45 ? "HOCH" : Scale < 70 ? "MITTEL" : "GERING";
  const riskColor = Scale < 45 ? C.bad : Scale < 70 ? C.ember : C.good;

  const Dial = ({ k, v }: { k: "Speed" | "Polish" | "Scale"; v: number }) => (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontFamily: sans, fontSize: 14, fontWeight: 600, color: C.snow }}>{k}</span>
        <span style={{ fontFamily: mono, fontSize: 14, fontWeight: 700, color: C.cyan }}>{v}</span>
      </div>
      <input type="range" min={0} max={100} value={v} disabled={launching}
        onChange={(e) => onAlloc(k, +e.target.value)} style={{ width: "100%" }} />
    </div>
  );

  return (
    <div style={{ height: "100%", background: C.void, position: "relative", overflowY: "auto" }}>
      <Header title="SHIP" sub={`Release · ${s.company}`} right={<Pulse value={`${score}`} label="proj. score" color={score > 70 ? C.good : C.ember} />} />

      <div style={{ margin: "0 22px 20px", padding: 18, borderRadius: 18, background: `linear-gradient(160deg, ${C.panel2}, ${C.panel})`, border: `1px solid ${C.line}` }}>
        <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 2, color: C.steel }}>NÄCHSTER LAUNCH</div>
        <div style={{ fontFamily: sans, fontSize: 20, fontWeight: 800, color: C.snow, marginTop: 4 }}>{s.feature.name}</div>
        <div style={{ fontFamily: mono, fontSize: 11, color: C.ember, marginTop: 4 }}>betrifft: {s.feature.affects.join(" · ")}</div>
      </div>

      <div style={{ padding: "0 22px" }}>
        <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 3, color: C.steel, marginBottom: 16 }}>RESSOURCEN VERTEILEN</div>
        <Dial k="Speed" v={Speed} />
        <Dial k="Polish" v={Polish} />
        <Dial k="Scale" v={Scale} />

        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          <div style={{ flex: 1, padding: "12px 14px", borderRadius: 12, background: C.panel, border: `1px solid ${C.line}` }}>
            <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 1, color: C.steel }}>AUSFALL-RISIKO</div>
            <div style={{ fontFamily: mono, fontSize: 16, fontWeight: 700, color: riskColor, marginTop: 3 }}>{risk}</div>
          </div>
          <div style={{ flex: 1, padding: "12px 14px", borderRadius: 12, background: C.panel, border: `1px solid ${C.line}` }}>
            <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 1, color: C.steel }}>HYPE</div>
            <div style={{ fontFamily: mono, fontSize: 16, fontWeight: 700, color: C.cyan, marginTop: 3 }}>{Math.round(Polish * 0.9)}</div>
          </div>
        </div>
      </div>

      <div style={{ padding: "0 22px 120px" }}>
        {!launching ? (
          <button onClick={() => setLaunching(true)} style={{
            width: "100%", border: "none", borderRadius: 16, padding: "18px 0",
            fontFamily: sans, fontSize: 16, fontWeight: 800, color: C.void,
            background: `linear-gradient(135deg, ${C.ember}, #FF9259)`,
            boxShadow: `0 10px 30px ${C.emberDim}`, cursor: "pointer", letterSpacing: 0.5,
          }}>
            🚀  DEPLOY TO PRODUCTION
          </button>
        ) : (
          <div style={{ padding: "16px 0" }}>
            <div style={{ fontFamily: mono, fontSize: 11, color: t >= 100 ? C.good : C.cyan, letterSpacing: 1, marginBottom: 8 }}>
              {t >= 100 ? "✓ LIVE · users incoming" : `deploying… ${t}%`}
            </div>
            <div style={{ height: 8, borderRadius: 5, background: "rgba(255,255,255,.07)", overflow: "hidden" }}>
              <div style={{ width: `${t}%`, height: "100%", background: `linear-gradient(90deg, ${C.ember}, ${C.cyan})`, boxShadow: `0 0 12px ${C.ember}`, transition: "width .12s linear" }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
