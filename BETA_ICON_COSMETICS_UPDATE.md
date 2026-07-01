# GradeGlow Beta – Icon Cosmetics Update

Dieses Paket baut auf `GradeGlow-2-beta-feedback-patch-3` auf.

## Enthalten

- Neuer Kosmetik-Typ `appIcon`
- Neue Premium/Admin-App-Icon-Looks:
  - Lavender App Icon
  - Matcha App Icon
  - Ocean App Icon
  - Mocha App Icon
  - Rose App Icon
- Neues Profilfeld `activeAppIconId`
- Migration/Fallback für alte Profile ohne `activeAppIconId`
- App-Icon-Kosmetik erscheint im Glow Shop und unter „Meine Kosmetik“ als eigener Bereich
- Ausgewähltes App-Icon färbt das In-App-Logo in Dashboard, Profil, Admin, Feedback und Diagnostics
- Preview im Glow Shop zeigt App-Icon-Look direkt an

## Hinweis zum echten PWA-Homescreen-Icon

Das echte installierte iOS/Browser-Homescreen-Icon wird von Safari/Browsern stark gecacht. Dieses Update verändert deshalb zunächst das In-App-Logo und legt die Datenstruktur für spätere PWA-Icon-Assets/Manifest-Varianten an. Für einen echten Homescreen-Icon-Wechsel wird später wahrscheinlich Neuinstallation oder ein gezielter Manifest/Icon-Asset-Schritt nötig.

## Nicht geändert

- Keine Firebase Functions
- Keine Firestore Rules
- `src/app/info/page.tsx` bleibt absichtlich aus dem ZIP ausgeschlossen, damit lokale manuelle Änderungen nicht überschrieben werden.
