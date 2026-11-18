# GradeGlow Design

Gilt für die neue App unter `/neu` (`src/neu/`). Jede sichtbare Änderung, egal ob von einem Menschen,
Claude oder ChatGPT, hält sich daran. Was hier nicht steht, wird nicht erfunden, sondern hier ergänzt.

## Die Idee

**Auf jedem Screen leuchtet genau eine Sache: das, was du als Nächstes tun sollst.**

Alles andere ist ruhig: Tinte auf warmem Grund, weiße Flächen. Auf Heute ist es der nächste Lernblock,
bei Klausuren die gewählte Klausur, im Fokus der Start-Button. Wenn zwei Dinge leuchten, leuchtet keins.

Ruhig heißt nicht leer und nicht riesig: normale Größen (Titel 22 px, keine Plakat-Überschriften), ein
warmer Grund statt Reinweiß, und Farbe dort, wo sie Information trägt (Akzent, Klausurfarben, Sternbild).

## Tokens

Alle Werte sind Variablen auf `.gn` in `src/neu/neu.css`. Komponenten nutzen nur Variablen.

| Rolle | Variable | Hell | Dunkel | Wofür |
| --- | --- | --- | --- | --- |
| Grund | `--ground` | `#f5f4f0` | `#111114` | Seitenhintergrund |
| Fläche | `--card` | `#ffffff` | `#1b1b20` | Karten, Listen, Tab-Leiste |
| Tonstufe | `--soft` | `#efeeea` | `#26262c` | Felder, Zweitbuttons, leere Tage |
| Tinte | `--ink` | `#16161a` | `#f2f2f4` | Aller Lauftext, aktiver Tab |
| Leise | `--muted` | `#6a6a72` | `#a2a2ab` | Nur Nebeninfos (Datum, Fach, Dauer) |
| Akzent | `--accent` | Nutzerwahl | Nutzerwahl | Die eine leuchtende Sache |
| Auf Akzent | `--on-accent` | `#fff` | `#fff` | Text auf der Akzentfläche |
| Nacht | `--night` | `#15142a` | `#15142a` | Sternbild-Himmel (in beiden Modi Nacht) |
| Warnung | `--warn` | `#c2410c` | `#fb923c` | Verpasst, hinterher |
| Jetzt | `--now` | `#e5484d` | `#e5484d` | Heutiger Tag im Kalender, Jetzt-Linie |

- Der Akzent ist frei wählbar. Nie eine feste Akzentfarbe schreiben, immer `var(--accent)`.
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
| Verläufe, auch auf Buttons und Hintergrund | Flache Farbe |
| Schatten, Glow, Blur, Glas | Tonstufe (Grund → Fläche → `--soft`) |
| Deko-Kreise, Muster, Maskottchen, Emoji | Nichts, oder echte Inhalte |
| Gesperrte Großbuchstaben-Labels | Normaler Satz in 13 px |
| Rahmen um Karten, Haarlinien als Trenner | Abstand. Ausnahme: Kalender-Stundenraster |
| Karten in Karten | Eine Fläche |
| Floskeln („Das zählt.", „Weiter so!") | Die echte Info: Zahl, Datum, nächster Schritt |
| Zweite Akzentfläche oder Akzent-Links neben der Akzentfläche | Tinte oder `--muted` |
| Schwebende Pillen-Tab-Leiste | Angedockte Leiste auf `--card`, aktiver Tab in Tinte |

## Bausteine

- **Akzentfläche (`.gn-hero`):** flach `--accent`, darin Meta-Zeile (13 px, 80 %), Titel, Fortschritt,
  ein weißer Button. Pro Screen höchstens eine.
- **Hauptaktion (`.gn-go`):** voll rund, 48 px, flach `--accent`. Verb zuerst.
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

- [x] Tokens flach, ohne Verlauf/Schatten (alle Screens)
- [x] Heute: Datum als Titel, Wochenleiste ohne Karte, weitere Blöcke als Agenda
- [x] Tab-Leiste angedockt
- [ ] Kalender: Badges (`.gn-badge`) noch durch Punkte ersetzen
- [ ] Klausuren: Status-Punkt auf der Akzentfläche hat feste Farben
- [ ] Altes App-Design (`globals.css`) bleibt bis zur Umschaltung wie es ist
