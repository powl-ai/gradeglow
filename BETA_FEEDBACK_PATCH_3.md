# GradeGlow Beta Feedback Patch 3

## Fokus
- Glow Shop übersichtlicher machen
- Gekaufte/Premium-freie Kosmetik aus dem Shop in einen eigenen Reiter verschieben
- Stundenplan-Karten ruhiger machen
- Kalenderfarben deutlicher unterscheiden

## Änderungen
- Glow Shop hat jetzt zwei Reiter:
  - `Shop`: nur noch nicht freigeschaltete Items
  - `Meine Kosmetik`: alle gekauften bzw. für Premium/Admin verfügbaren Items
- `Meine Kosmetik` ist nach Wirkung gruppiert:
  - Themes
  - Akzente
  - Profilumrandung
  - Profilbanner
- Premium/Admin sieht aktuelle Shop-Looks als freigeschaltet unter `Meine Kosmetik`; der Shop wirkt dadurch nicht mehr künstlich voll.
- Stundenplan-Termine zeigen nicht mehr dauerhaft Bearbeiten/Ausblenden/Löschen.
- Klick auf einen Termin öffnet direkt die Bearbeitung.
- Das Drei-Punkte-Menü am Termin zeigt nur bei Bedarf Ausblenden/Löschen.
- Stundenplan-Farben wurden stärker differenziert:
  - Violett bleibt violett
  - Rosa wurde zu Pink/Fuchsia
  - Rose wurde zu Koralle/Rot
- App-Version: `beta-2026-06-30-feedback-3`

## Nicht geändert
- Firestore Rules wurden nicht geändert.
- Functions wurden nicht deploymentpflichtig gemacht.
- Payment/Stripe/Blaze wurden nicht aktiviert.
