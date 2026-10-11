# GradeGlow Beta UI + Theme Readiness Update

## Enthaltene Änderungen

- Premium-Seitenthemes erweitert:
  - Rose Bloom
  - Study Sunrise
  - Lavender Haze
  - Matcha Focus
  - Ocean Mist
  - Mocha Latte
- Seitenthemes und Akzentfarben sind jetzt kombinierbar.
  - Das Theme steuert große Flächen, Karten, Hintergründe und Orbs.
  - Die Akzentfarbe steuert Buttons, aktive States, Diagrammfüllungen und Progressbars.
- Theme-Variablen greifen jetzt auch auf separaten Beta-Seiten:
  - `/admin`
  - `/feedback`
  - `/diagnostics`
- Kontrast- und Button-State-Politur:
  - bessere Focus-States
  - klarere disabled-Zustände
  - konsistentere helle Karten in Premium-Themes
  - primäre Buttons und Diagramme laufen über zentrale CSS-Variablen
- UI-Audit erweitert:
  - erkennt klickbare Elemente ohne Label
  - erkennt Links ohne href
  - erkennt Buttons ohne type
  - erkennt pointer-events:none bei scheinbar aktiven Elementen
  - erkennt sehr kleine Tap-Targets
  - erkennt role=button ohne tabindex

## Nicht geändert

- Keine Firebase Functions deployed oder verpflichtend gemacht.
- Keine Dependency-Upgrades / kein `npm audit fix --force`.
- Firestore Rules wurden nicht angepasst, weil diese UI-/Theme-Änderungen keine neuen Collections oder Writes brauchen.

## Tests im Paket

- `npm run lint` erfolgreich
- `npm run typecheck` erfolgreich
- `npm run build` konnte in dieser Linux-Sandbox nicht vollständig ausgeführt werden, weil im hochgeladenen Paket nur das macOS SWC-Paket `@next/swc-darwin-arm64` enthalten war und Next für Linux `@next/swc-linux-x64-gnu` nachladen wollte. Lokal/Vercel sollte der Build mit normalem `npm install` bzw. Vercel-Install laufen.
