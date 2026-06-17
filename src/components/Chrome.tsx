import type { ReactNode } from "react";
import { C, mono, sans } from "../theme";

export function Header({ title, sub, right }: { title: string; sub: string; right?: ReactNode }) {
  return (
    <div style={{ padding: "46px 22px 14px", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
      <div>
        <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: 3, color: C.steel, textTransform: "uppercase" }}>{sub}</div>
        <div style={{ fontFamily: sans, fontSize: 26, fontWeight: 800, color: C.snow, letterSpacing: -1, marginTop: 3 }}>{title}</div>
      </div>
      {right}
    </div>
  );
}

export function Pulse({ value, label, color = C.cyan }: { value: string; label: string; color?: string }) {
  return (
    <div style={{ textAlign: "right" }}>
      <div style={{ fontFamily: mono, fontSize: 20, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 2, color: C.steel, textTransform: "uppercase" }}>{label}</div>
    </div>
  );
}

const NAV: [string, string][] = [["⌷", "Stack"], ["◇", "Talent"], ["▲", "Ship"]];

export function Nav({ i, set }: { i: number; set: (n: number) => void }) {
  return (
    <div style={{
      position: "absolute", bottom: 0, left: 0, right: 0, display: "flex", justifyContent: "space-around",
      padding: "12px 0 26px", background: "rgba(7,8,12,.86)", backdropFilter: "blur(14px)",
      borderTop: `1px solid ${C.line}`, zIndex: 40,
    }}>
      {NAV.map((it, k) => (
        <div key={k} onClick={() => set(k)} style={{ textAlign: "center", cursor: "pointer", opacity: i === k ? 1 : 0.4, transition: "opacity .15s" }}>
          <div style={{ fontSize: 18, color: i === k ? C.ember : C.snow }}>{it[0]}</div>
          <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 1, color: i === k ? C.ember : C.steel, marginTop: 3 }}>{it[1]}</div>
        </div>
      ))}
    </div>
  );
}

export function ActivityLog({ items }: { items: { id: number; text: string; tone: "info" | "good" | "bad" }[] }) {
  const toneColor = { info: C.steel, good: C.good, bad: C.bad };
  return (
    <div style={{ padding: "4px 22px 0" }}>
      {items.slice(0, 4).map((it) => (
        <div key={it.id} style={{
          fontFamily: mono, fontSize: 11, color: toneColor[it.tone], lineHeight: 1.5,
          padding: "5px 0", borderTop: `1px solid ${C.line}`, animation: "fadeup .3s ease",
        }}>
          {it.text}
        </div>
      ))}
    </div>
  );
}
