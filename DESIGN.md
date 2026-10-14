# GradeGlow Design

Dieses Dokument legt fest, wie GradeGlow aussieht. Jede Änderung an der Oberfläche, egal ob von
einem Menschen, Claude oder ChatGPT, hält sich daran. Wenn etwas hier nicht steht, wird es nicht
erfunden, sondern hier ergänzt.

## Die Idee

**Auf jedem Screen leuchtet genau eine Sache: das, was du als Nächstes tun sollst.**

Der Name ist das Konzept. Alles ist ruhig, in Tinte auf hellem Grund. Nur der nächste Lernblock,
der Start-Button oder der heutige Tag bekommt die Akzentfarbe. Wenn zwei Dinge gleichzeitig
leuchten, leuchtet keins.

Die erste Frage beim Öffnen ist immer „Was mache ich heute?". Die Antwort steht ganz oben, groß.
Motivationssprüche, Maskottchen und Deko-Karten stehen ihr nicht im Weg.

## Tokens

Alle Werte liegen als CSS-Variablen in `src/app/gg-design.css`. Komponenten benutzen nur Variablen,
nie feste Farbwerte.

### Farbe

| Rolle | Variable | Hell | Dunkel | Wofür |
| --- | --- | --- | --- | --- |
| Grund | `--gg-document-bg` | `#f4f4f1` | `#0e0e12` | Seitenhintergrund |
| Fläche | `--gg-surface` | `#ffffff` | `#18181d` | Karten, Listen |
| Fläche 2 | `--gg-surface-soft` | `#ebebe7` | `#222228` | Tonstufe: Tracks, leere Tage, gedrückte Zustände |
| Tinte | `--gg-app-text` | `#17161c` | `#f3f2f5` | Aller Lauftext |
| Leise | `--gg-muted` | `#66656d` | `#a3a1ab` | Nur Nebeninfos (Datum, Fach, Einheit) |
| Akzent | `--gg-accent-600` | Nutzerwahl, Standard `#6d28d9` | `--gg-accent-500` | Die eine leuchtende Sache |
| Auf Akzent | `--gg-on-primary` | `#ffffff` | `#ffffff` | Text auf Akzentflächen |
| Warnung | `--gg-warn` | `#b45309` | `#f59e0b` | Verpasste Blöcke, „hinterher" |

Regeln:
- Ein Grund, eine Tinte, ein Akzent. Der Akzent erscheint pro Screen auf höchstens einer großen
  Fläche (meist der Haupt-Button) und als kleiner Marker für „heute".
- Lauftext immer in voller Tinte. Grau ist nur für Nebeninfos.
- Flächen trennen sich durch Tonstufen (Grund → Fläche → Fläche 2), nicht durch Linien oder Schatten.
- Die Akzentfarbe ist frei wählbar (Einstellungen). Darum nie `violet-…` oder `#8b5cf6` direkt
  schreiben, immer `var(--gg-accent-600)`.
- Premium-Themes dürfen Grund und Flächen tönen, aber die Rollen bleiben gleich.

### Schrift

- **Eine Familie: Manrope** (über `next/font`, Variable `--gg-font`). Kein Inter mehr.
- Zahlen, die sich vergleichen (Countdown, Minuten, ECTS), mit `font-variant-numeric: tabular-nums`.
- Drei Größen machen die Arbeit:

| Stufe | Größe | Gewicht | Zeilenhöhe | Laufweite | Wofür |
| --- | --- | --- | --- | --- | --- |
| Groß | `clamp(2rem, 9vw, 2.75rem)` | 750 | 1.05 | -0.035em | Der eine Satz oder die eine Zahl pro Screen |
| Titel | `1.0625rem` | 700 | 1.3 | -0.01em | Abschnittsüberschriften, Listeneinträge |
| Text | `0.9375rem` | 500 | 1.45 | 0 | Alles andere |
| Klein | `0.8125rem` | 500 | 1.4 | 0 | Nur Nebeninfos in `--gg-muted` |

- Überschriften höchstens zwei Zeilen auf 360 px Breite. Sonst Wörter streichen.
- Alles linksbündig. Zentriert nur leere Zustände.

### Abstand und Form

- Raster in 4-px-Schritten. Seitenrand `16px`, Abstand zwischen Abschnitten `28px`, innerhalb
  eines Abschnitts höchstens `16px`. Zwischen Abschnitten immer sichtbar mehr Luft als darin.
- Radius: Flächen `20px`, Buttons und Chips voll rund (`999px`). Nichts dazwischen erfinden.
- Mindest-Tippfläche `44px`.

### Bewegung

- Nur Rückmeldung: Druckzustand (`scale(.98)`, 120 ms) und Farbwechsel. Kein Scroll-Hijacking,
  keine Einflug-Animationen, kein GSAP, kein Lenis.
- Alles unter `prefers-reduced-motion: reduce` ohne Bewegung.

## Verboten

| Nicht | Stattdessen |
| --- | --- |
| Verläufe (Hintergrund, Buttons, Text) | Flache Farbe |
| Schatten auf ruhenden Flächen, Glow-Effekte | Tonstufe |
| Glas, `backdrop-filter`, Blur-Panels | Deckende Fläche |
| Kleine gesperrte Großbuchstaben-Labels („DEIN KLEINER GLOW-MOMENT") | Normaler Satz in Titel- oder Kleingröße |
| Haarlinien als Trenner, 1-px-Rahmen um Karten | Abstand oder Tonstufe. Ausnahme: Formularfelder |
| Karten in Karten | Eine Fläche, darin Text |
| Maskottchen, Emojis, Deko-Formen | Nichts, oder echte Inhalte |
| Floskeln („Das zählt.", „Dein Glow.", „Jeder Anfang zählt") | Die echte Info: Zahl, Datum, nächster Schritt |
| Mehr als eine Akzentfläche pro Screen | Eine. Der Rest in Tinte |
| Feste Farben im Komponenten-Code | Tokens |

## Bausteine

- **Hauptaktion:** voll runder Button, Akzentfläche, `48px` hoch, Text in `--gg-on-primary`,
  Verb zuerst („Eigenwerte starten").
- **Zweitaktion:** Text in Tinte auf `--gg-surface-soft`, gleiche Form.
- **Liste:** Einträge mit `12px` Abstand untereinander, Titel in Tinte, darunter eine Zeile in
  `--gg-muted`. Kein Trenner.
- **Fortschritt:** `6px`-Balken, Track `--gg-surface-soft`, Füllung Tinte (nicht Akzent: der
  Akzent gehört der Hauptaktion). Zahlen daneben in Tabellenziffern.
- **Leerer Zustand:** ein Satz, was fehlt, und ein Link, der es behebt.

## Mobile-App-Shell

- Header und Tab-Leiste sind deckende Flächen ohne Blur.
- Die Shell-Höhe kommt aus `--gg-app-height` (gemessen in `GradeGlowAppHost`), nie aus `vh`/`lvh`.
- Der Blur unter der iOS-Statusleiste ist ein WebKit-Bug (bugs.webkit.org/show_bug.cgi?id=301994),
  nicht per CSS zu lösen. Nicht dagegen anbauen.

## Migrationsstand

`globals.css` ist über viele Patches gewachsen und voller `!important`. Neue Styles kommen nur noch
nach `src/app/gg-design.css`. Screens werden einzeln umgezogen; ein umgezogener Screen benutzt nur
noch Klassen mit Präfix `gg-ds-`.

- [x] Startseite (`StudyHomeFeed`)
- [ ] Kalender
- [ ] Fokus-Timer
- [ ] Profil
- [ ] Einstellungen, Menü
- [ ] Login-/Einstiegsseite (hat noch einen Verlauf)
