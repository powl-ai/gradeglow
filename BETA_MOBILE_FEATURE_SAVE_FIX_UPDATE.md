# GradeGlow Beta Mobile Feature Save Fix

## Fokus

Dieses Patch-Paket behebt das Problem, dass in der mobilen PWA nach der Auswahl von „Minimal“ optionale Bereiche wie Study Circle, Insights oder Stundenplan nicht zuverlässig wieder im mobilen Menü auftauchten.

## Änderungen

- Sichtbare Bereiche im Profil werden jetzt direkt gespeichert, sobald Nutzer einen Bereich aktivieren/deaktivieren oder ein Preset wählen.
- Die Feature-Auswahl behandelt eine leere Liste jetzt korrekt als echten Minimal-Modus und setzt sie nicht mehr automatisch auf alle Features zurück.
- Das mobile Menü enthält jetzt immer einen direkten Einstieg zu `Profil → Sichtbare Bereiche`.
- Im mobilen Menü wird angezeigt, wie viele optionale Bereiche aktiv sind.
- Feature-Preset-Texte wurden angepasst: Nutzer müssen nach Änderungen in diesem Block nicht zusätzlich den großen Profil-Speichern-Button suchen.
- App-Version erhöht auf `beta-2026-07-04-mobile-feature-save-fix`.
- Service Worker Cache erhöht auf `gradeglow-v41`.

## Nicht geändert

- Keine Firestore Rules geändert.
- Keine Firebase Functions deployed oder vorbereitet.
- Keine echten Payments/Ads aktiviert.
- Laptop-PWA wurde bewusst nicht weiter auf App-Modus umgebaut.

## Tests

```bash
npm run lint
npm run typecheck
```

Beide Tests laufen erfolgreich.

`NEXT_TELEMETRY_DISABLED=1 CI=1 npm run build` kompiliert erfolgreich, läuft in der Sandbox aber erneut in der Next-TypeScript-Phase länger als das Tool-Zeitfenster.
