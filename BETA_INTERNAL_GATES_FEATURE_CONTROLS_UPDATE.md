# GradeGlow Internal Gates + Feature Controls Update

Version: `beta-2026-07-04-internal-gates-feature-controls`

## Ziel

Dieses Paket korrigiert zwei Punkte aus dem Feedback:

1. Normale Nutzer dürfen nicht auf Monetarisierung und Launch Center zugreifen.
2. Wer im Onboarding „Minimal starten“ wählt, muss später leicht wieder weitere Bereiche aktivieren können.

## Änderungen

- Neue interne Schutz-Komponente `InternalToolGate`.
- `/monetization` ist jetzt admin-only.
- `/launch` ist jetzt admin-only.
- Normale Nutzer, Free-, Plus- und Beta-Accounts bekommen statt interner Inhalte eine klare Kein-Zugriff-Seite.
- Launch- und Monetization-Links wurden aus öffentlichen Plus-/Legal-/Checkout-Flows entfernt.
- Dashboard-Navigation zeigt Launch und Monetarisierung nur noch für Admins.
- Feature-Gates wurden angepasst: Launch Center und Monetarisierung sind nicht mehr Beta/Admin, sondern nur Admin.
- Profilseite bekommt unter `#features` eine klarere Feature-Verwaltung:
  - Empfohlen
  - Alles aktivieren
  - Minimal
  - einzelne Bereiche ein-/ausschalten
- Dashboard zeigt auf der Startseite einen Hinweis, wenn optionale Bereiche ausgeblendet sind.
- Mobile/Profile-Links führen direkter zu `Profil → Sichtbare Bereiche`.
- Service Worker Cache-Version auf `gradeglow-v39` erhöht.
- `/launch` und `/monetization` werden nicht mehr im öffentlichen App-Shell-Cache vorgeladen.

## Wichtig

- Firestore Rules wurden nicht geändert.
- Firebase Functions wurden nicht angefasst.
- Es wurden keine echten Payments und keine echten Ads aktiviert.
- Laptop-PWA/volle Website-Navigation wurde bewusst nicht verändert.

## Tests

```bash
npm run lint
npm run typecheck
npm run build
```

Hinweis: In der Sandbox kompiliert `next build` erfolgreich, läuft danach aber in der Next-TypeScript-Phase länger als das Tool-Zeitfenster. `npm run lint` und `npm run typecheck` laufen erfolgreich.
