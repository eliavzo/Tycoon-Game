import { useCallback, useEffect, useRef, useState } from "react";
import { C, mono, sans } from "./theme";
import type { GameState } from "./game/types";
import {
  createInitialState, tick, scaleLayer, hireCandidate, rejectCandidate,
  setAlloc, shipFeature, fmtMoney,
} from "./game/engine";
import { Nav } from "./components/Chrome";
import { StackScreen } from "./screens/StackScreen";
import { TalentScreen } from "./screens/TalentScreen";
import { ShipScreen } from "./screens/ShipScreen";

const TICK_MS = 2200;

export default function App() {
  const [gs, setGs] = useState<GameState | null>(null);
  const [screen, setScreen] = useState(0);
  const gsRef = useRef<GameState | null>(null);
  gsRef.current = gs;

  // monthly simulation tick
  useEffect(() => {
    if (!gs || gs.gameOver) return;
    const id = setInterval(() => {
      const cur = gsRef.current;
      if (cur && !cur.gameOver) setGs(tick(cur));
    }, TICK_MS);
    return () => clearInterval(id);
  }, [gs?.gameOver, gs !== null]);

  const onScale = useCallback((id: string) => setGs((s) => (s ? scaleLayer(s, id) : s)), []);
  const onHire = useCallback((id: string) => setGs((s) => (s ? hireCandidate(s, id) : s)), []);
  const onReject = useCallback((id: string) => setGs((s) => (s ? rejectCandidate(s, id) : s)), []);
  const onAlloc = useCallback(
    (k: "Speed" | "Polish" | "Scale", v: number) => setGs((s) => (s ? setAlloc(s, k, v) : s)),
    [],
  );
  const onShipDone = useCallback(() => setGs((s) => (s ? shipFeature(s) : s)), []);

  if (!gs) return <Stage><StartScreen onStart={(name) => setGs(createInitialState(name))} /></Stage>;

  return (
    <Stage>
      {screen === 0 && <StackScreen s={gs} onScale={onScale} />}
      {screen === 1 && <TalentScreen s={gs} onHire={onHire} onReject={onReject} />}
      {screen === 2 && <ShipScreen s={gs} onAlloc={onAlloc} onShipDone={onShipDone} />}
      <Nav i={screen} set={setScreen} />
      {gs.gameOver && <GameOver s={gs} onRestart={() => { setGs(null); setScreen(0); }} />}
    </Stage>
  );
}

function Stage({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ height: "100dvh", width: "100vw", display: "flex", justifyContent: "center", background: "#000" }}>
      <div style={{
        width: "100%", maxWidth: 480, height: "100%", position: "relative", overflow: "hidden",
        background: C.void, boxShadow: "0 0 60px rgba(0,0,0,.6)",
      }}>
        {children}
      </div>
    </div>
  );
}

function StartScreen({ onStart }: { onStart: (name: string) => void }) {
  const [name, setName] = useState("NIMBUS");
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 30px", position: "relative" }}>
      <div style={{
        position: "absolute", top: "18%", left: "50%", transform: "translateX(-50%)",
        width: 300, height: 300, background: `radial-gradient(circle, ${C.emberDim}, transparent 70%)`, pointerEvents: "none",
      }} />
      <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: 4, color: C.ember, textTransform: "uppercase" }}>Tech Tycoon</div>
      <div style={{ fontFamily: sans, fontSize: 52, fontWeight: 800, color: C.snow, letterSpacing: -2, lineHeight: 1, marginTop: 6 }}>STACK</div>
      <div style={{ fontFamily: sans, fontSize: 14, color: C.steel, marginTop: 16, lineHeight: 1.5 }}>
        Deine Firma <span style={{ color: C.snow }}>ist</span> der Stack. Skaliere Schichten, bevor sie
        unter der Last zusammenbrechen, rekrutiere Talente und shippe Features, die User bringen — ohne die Runway zu verbrennen.
      </div>

      <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: 2, color: C.steel, marginTop: 34, marginBottom: 8 }}>FIRMENNAME</div>
      <input
        value={name}
        maxLength={16}
        onChange={(e) => setName(e.target.value.toUpperCase())}
        onKeyDown={(e) => { if (e.key === "Enter") onStart(name.trim() || "NIMBUS"); }}
        style={{
          width: "100%", background: C.panel, border: `1px solid ${C.lineBright}`, borderRadius: 14,
          padding: "14px 16px", color: C.snow, fontFamily: sans, fontSize: 18, fontWeight: 700, letterSpacing: 1, outline: "none",
        }}
      />

      <button onClick={() => onStart(name.trim() || "NIMBUS")} style={{
        width: "100%", marginTop: 16, border: "none", borderRadius: 16, padding: "17px 0",
        fontFamily: sans, fontSize: 16, fontWeight: 800, color: C.void,
        background: `linear-gradient(135deg, ${C.ember}, #FF9259)`,
        boxShadow: `0 10px 30px ${C.emberDim}`, cursor: "pointer", letterSpacing: 0.5,
      }}>
        FIRMA STARTEN  →
      </button>
    </div>
  );
}

function GameOver({ s, onRestart }: { s: GameState; onRestart: () => void }) {
  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 60, background: "rgba(7,8,12,.92)", backdropFilter: "blur(6px)",
      display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: 30, textAlign: "center",
    }}>
      <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: 4, color: C.bad, textTransform: "uppercase" }}>Shutdown</div>
      <div style={{ fontFamily: sans, fontSize: 38, fontWeight: 800, color: C.snow, marginTop: 8 }}>Runway leer</div>
      <div style={{ fontFamily: sans, fontSize: 14, color: C.steel, marginTop: 14, lineHeight: 1.5 }}>
        {s.company} überlebte bis <span style={{ color: C.snow }}>Jahr {s.year} · Q{s.quarter}</span>.<br />
        Letzte Bewertung: <span style={{ color: C.ember }}>{fmtMoney(s.valuation)}</span>
      </div>
      <button onClick={onRestart} style={{
        marginTop: 26, border: `1px solid ${C.cyan}`, background: C.cyan, color: C.void,
        borderRadius: 14, padding: "13px 26px", fontFamily: sans, fontSize: 14, fontWeight: 700, cursor: "pointer",
      }}>
        Neu starten
      </button>
    </div>
  );
}
