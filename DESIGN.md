# GradeGlow Design

Gilt für die neue App unter `/neu` (`src/neu/`). Jede sichtbare Änderung, egal ob von einem Menschen,
Claude oder ChatGPT, hält sich daran. Was hier nicht steht, wird nicht erfunden, sondern hier ergänzt.

## Die Idee

**Auf jedem Screen leuchtet genau eine Sache: das, was du als Nächstes tun sollst.**

Alles andere ist ruhig: Tinte auf kühlem Hellgrau, weiße Flächen mit leichter Tiefe. Auf Heute ist es der nächste Lernblock,
bei Klausuren die gewählte Klausur, im Fokus der Start-Button. Wenn zwei Dinge leuchten, leuchtet keins.

Ruhig heißt nicht leer und nicht riesig: normale Größen (Titel 22 px, keine Plakat-Überschriften), Hellgrau
statt Reinweiß (kein Creme, das ist ein typischer KI-Look), Tiefe durch Schatten, und Farbe dort, wo sie Information trägt (Akzent, Klausurfarben, Sternbild).

## Tokens

Alle Werte sind Variablen auf `.gn` in `src/neu/neu.css`. Komponenten nutzen nur Variablen.

| Rolle | Variable | Hell | Dunkel | Wofür |
| --- | --- | --- | --- | --- |
| Grund | `--ground` | `#eceef1` | `#0e0f12` | Seitenhintergrund |
| Fläche | `--card` | `#ffffff` | `#1a1b20` | Karten, Listen, Tab-Leiste |
| Tonstufe | `--soft` | `#e6e8ec` | `#25262c` | Felder, Zweitbuttons, leere Tage |
| Tinte | `--ink` | `#16161a` | `#f2f2f4` | Aller Lauftext, aktiver Tab |
| Leise | `--muted` | `#6a6a72` | `#a2a2ab` | Nur Nebeninfos (Datum, Fach, Dauer) |
| Akzent | `--accent` | Nutzerwahl, Standard Aubergine `#3f1d62` | gleich | Die eine leuchtende Sache |
| Hero-Button | `--hero-btn` | Standard Flieder `#cdbcff` (Text `#2a123f`), sonst Weiß | gleich | Button auf der Akzentfläche, Hauptbutton im Dunkelmodus |
| Tiefe | `--lift` | weicher Schatten | Schatten + Lichtkante | Unter Karten, Listen, Icon-Buttons |
| Auf Akzent | `--on-accent` | `#fff` | `#fff` | Text auf der Akzentfläche |
| Nacht | `--night` | `#15142a` | `#15142a` | Sternbild-Himmel (in beiden Modi Nacht) |
| Warnung | `--warn` | `#c2410c` | `#fb923c` | Verpasst, hinterher |
| Jetzt | `--now` | `#e5484d` | `#e5484d` | Heutiger Tag im Kalender, Jetzt-Linie |

- Der Akzent ist frei wählbar. Nie eine feste Akzentfarbe schreiben, immer `var(--accent)`.
- Kein Tailwind-Lila (`#6d3af0`, `#7c3aed`): genau das liest sich als KI-Website. Lila ja, aber Aubergine
  mit Flieder (`ACCENTS`/`HERO_BUTTON` in `src/neu/model.ts`).
- Klausurfarben (`examColor`) sind Information, kein Schmuck: als 8-px-Punkt oder Kalenderfläche.

## Schrift

- Eine Familie: Figtree (`--gn-font`). Gewichte 500 (Text), 600 (Listeneinträge, Nebeninfos), 700 (Titel).
  Kein 800.
- Größen: Seitentitel 22, Abschnitt 17, Kartentitel 20 (nur auf der Akzentfläche), Text 15, Klein 13.
- Zahlen, die sich vergleichen (Uhrzeit, Countdown, Minuten), mit `tabular-nums`.
- Überschriften höchstens zwei Zeilen auf 390 px.

## Abstand und Form

- Seitenrand 16 px. Zwischen Abschnitten sichtbar mehr Luft als darin.
- Radius: Flächen 20 px, Buttons und Chips voll rund. Nichts dazwischen.
- Tippflächen mindestens 44 px (Chips 40 px in Listenzeilen mit 60 px Höhe).

## Verboten

| Nicht | Stattdessen |
| --- | --- |
| Bunte Verläufe, Verläufe als Hintergrund | Flache Farbe. Erlaubt: leichte Tonverschiebung *einer* Farbe auf der Akzentfläche |
| Eigene Schatten pro Komponente, Blur, Glas | `--lift` für Flächen, farbiger Schein nur unter der Akzentfläche |
| Deko-Kreise, Muster, Maskottchen, Emoji | Nichts, oder echte Inhalte |
| Gesperrte Großbuchstaben-Labels | Normaler Satz in 13 px |
| Rahmen um Karten, Haarlinien als Trenner | Abstand. Ausnahme: Kalender-Stundenraster |
| Karten in Karten | Eine Fläche |
| Floskeln („Das zählt.", „Weiter so!") | Die echte Info: Zahl, Datum, nächster Schritt |
| Zweite Akzentfläche oder Akzent-Links neben der Akzentfläche | Tinte oder `--muted` |
| Schwebende Pillen-Tab-Leiste | Angedockte Leiste auf `--card`, aktiver Tab in Tinte |

## Bausteine

- **Akzentfläche (`.gn-hero`):** `--accent` mit leichter Tonverschiebung und farbigem Schein darunter,
  darin Meta-Zeile (13 px, 80 %), Titel, Fortschritt, ein Button in `--hero-btn`. Pro Screen höchstens eine.
- **Hauptaktion (`.gn-go`):** voll rund, 48 px, `--accent` (dunkel: `--hero-btn`). Verb zuerst.
- **Zweitaktion:** `.gn-go.quiet` oder `.gn-chip` auf `--soft`.
- **Liste (`.gn-agenda`, `.gn-list`):** Titel in Tinte, darunter eine Zeile in `--muted`, kein Trenner.
- **Fortschritt (`.gn-bar`):** 6 px, Track `--soft`.
- **Sternbild:** der einzige „besondere" Look, weil es Inhalt ist: Nacht-Fläche, leuchtende Sterne.
  Keine Nebel-Verläufe, kein Schatten darum.
- **Leerer Zustand:** ein Satz, was fehlt, ein Button, der es behebt.

## Bewegung

Nur Rückmeldung: Druckzustand `scale(.98)`, das Umdrehen der Sternbild-Karte, funkelnde Sterne.
Unter `prefers-reduced-motion` alles aus.

## Stand

- [x] Tokens: Hellgrau-Grund, `--lift`-Tiefe, Aubergine/Flieder als Standard (alle Screens)
- [x] Heute: Datum als Titel, Wochenleiste ohne Karte, weitere Blöcke als Agenda
- [x] Tab-Leiste angedockt
- [ ] Kalender: Badges (`.gn-badge`) noch durch Punkte ersetzen
- [ ] Klausuren: Status-Punkt auf der Akzentfläche hat feste Farben
- [ ] Altes App-Design (`globals.css`) bleibt bis zur Umschaltung wie es ist
