# Tech Empire Tycoon

Ein Wirtschafts-Simulationsspiel im Stil von *Game Dev Tycoon*, *Smartphone/PC Tycoon 2*
und *Car Company Tycoon*. Du gründest ein kleines Spielestudio und baust es Schritt für
Schritt zu einem globalen Technologie-Imperium aus – vom ersten Indie-Hit über Smartphones
und PCs bis zum eigenen Autowerk.

Gebaut mit **TypeScript**, **Vite** und **Phaser 3** (animiertes Büro) plus moderner HTML/CSS-UI.

## Aktueller Stand (spielbarer Kern)

- 🏢 **Firma gründen** und benennen
- 🎮 **Spiele entwickeln**: Genre, Thema, Plattform und Umfang wählen – mit Synergie-System
  (manche Genre/Thema-Kombinationen funktionieren besser)
- 👥 **Personal**: Bewerber:innen einstellen, Büro erweitern; Talent (Design/Technik) und
  Energie der Mitarbeiter:innen bestimmen Geschwindigkeit und Qualität
- ⭐ **Reviews & Verkäufe**: Qualität → Wertung (1–10) → Verkaufszahlen mit abklingendem Momentum
- 🔬 **Forschung**: Engines, Online-Multiplayer, Marketing und das Freischalten neuer Sparten
- 📈 **Wirtschaft**: Gehälter, Lizenzkosten, Fans, Firmenwert
- ⏱️ **Zeitsteuerung**: Pause / Normal / Schnell / Sehr schnell
- 🏢 **Sparten**: Spiele (aktiv) plus Smartphones, PCs und Autos (per Forschung freischaltbar;
  Produktion folgt in kommenden Updates)

## Entwicklung

```bash
npm install
npm run dev      # Dev-Server (http://localhost:5173)
npm run build    # Typecheck + Production-Build nach dist/
npm run preview  # Production-Build lokal testen
```

## Architektur

```
src/
  core/        Spielzustand, Typen, Simulations-Engine, Hilfsfunktionen
  data/        Spieldaten (Genres, Themen, Plattformen, Forschung, Namen)
  systems/     Spiellogik (Entwicklung, Ökonomie)
  scene/       Phaser-Szene (animiertes Büro)
  ui/          DOM-basierte Oberfläche (Topbar, Dialoge, Benachrichtigungen)
  main.ts      Einstiegspunkt / Bootstrapping
```

## Roadmap

- Smartphone-, PC- und Auto-Produktion mit Komponenten-/Forschungsbäumen
- Konkurrenz-Firmen und Marktanteile
- Speichern/Laden, Mitarbeiter-Weiterbildung, Marketing-Kampagnen
- Detailliertere Grafik und Büro-Ausbau
