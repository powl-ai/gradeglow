# GradeGlow Update vom 24.06.2026

Integriert:

- Prüfungskalender mit Ansichtsfilter: Alles, Nur Prüfungen, Nur Lernplan.
- Neuer Bereich `/schedule` für einen eigenen Uni-Stundenplan.
- Stundenplan-Sync über `users/{uid}/schedule/{scheduleId}` plus lokales Backup.
- Fokus-Timer mit frei einstellbarer Dauer und Presets: 25, 30, 45, 60, 90, 120 Minuten.
- In-App-Popup oben, wenn Freunde eine Lernsession starten oder abschließen.
- Toggle in Study Circle: „Popups aktivieren“.
- Firestore Rules um `users/{uid}/schedule/{scheduleId}` erweitert.

Geprüft:

```bash
npm run typecheck
npm run lint
npm run build
```

Alle Checks laufen durch.
