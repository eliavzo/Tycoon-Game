# STACK — Tech Tycoon

Ein Tech-Startup-Tycoon, bei dem deine Firma **der Software-Stack ist**. Skaliere die
Schichten deines Stacks, bevor sie unter der Last zusammenbrechen, rekrutiere Talente per
Swipe-Karten und shippe Features, die User bringen — ohne deine Runway zu verbrennen.

Keynote-dunkles Design mit einem Ember-Orange-Akzent und Coolant-Cyan-Status, Monospace-Typo.
Gebaut mit **React**, **TypeScript** und **Vite**.

## Drei Screens

- **⌷ Stack** — der lebende Schichtturm (Growth, Product, API Gateway, Services, Data, Infra).
  Jede Schicht zeigt ihre Live-Last; überlastete Schichten glühen rot und riskieren Ausfälle.
  Per „SCALE ↑" erhöhst du die Kapazität.
- **◇ Talent** — Recruiting als Swipe-Karten: nach links ablehnen, nach rechts einstellen.
  Jede Person hat Stats (Build/Speed/Cost) und ein Trait (Scaler, Viral, Firewall, Architect, Closer).
- **▲ Ship** — Release-Konsole: verteile Ressourcen auf Speed / Polish / Scale, sieh Ausfall-Risiko
  und Hype, dann „DEPLOY TO PRODUCTION".

## Mechaniken

- **Last & Kapazität:** User-Wachstum erhöht die Last jeder Schicht; Skalieren und zugewiesene
  Mitarbeiter:innen erhöhen die Kapazität.
- **Ausfälle:** überlastete Schichten können abstürzen → Uptime und User sinken (ein *Firewall*-Hire
  blockt den nächsten Ausfall).
- **Finanzen:** Umsatz pro User vs. Burn (Gehälter + Infra). Geht die Runway auf 0 → Game Over.
- **Zeit:** läuft in Monaten/Quartalen/Jahren; jedes Quartal kommen neue Talente.

## Entwicklung

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # Typecheck + Production-Build nach dist/
```

## Architektur

```
src/
  theme.ts           Design-Tokens (Farben, Fonts)
  game/              Spiellogik: types, data, engine (Simulation)
  components/        Wiederverwendbare UI (Header, Pulse, Nav, Log)
  screens/           Stack / Talent / Ship
  App.tsx            Shell, Spielzustand, Tick-Loop, Start- & Game-Over-Screen
  main.tsx           Einstiegspunkt
```

Live (GitHub Pages): https://eliavzo.github.io/Tycoon-Game/
