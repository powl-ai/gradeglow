# GradeGlow Beta – Study Circle v2

## Neu

- Freund hinzufügen ist jetzt gegenseitig: Wenn Nutzer A den Code von Nutzer B eingibt, erscheinen beide gegenseitig als Freunde.
- Neuer Clan-/Circle-Modus:
  - Circle erstellen
  - Circle-Code kopieren
  - Circle per Code beitreten
  - aktiven Circle auswählen
  - Circle verlassen
  - Mitgliederliste und gemeinsames Wochenziel
- Circle Game nutzt den aktiven Circle, falls vorhanden.
- Einzelne Freundescodes bleiben kompatibel.
- `src/app/info/page.tsx` ist wieder im Paket enthalten.

## Firestore

Dieses Update braucht neue Rules für:

- `users/{uid}/studyCircles/{circleId}`
- `studyCircles/{circleId}`
- `studyCircles/{circleId}/members/{uid}`
- `studyCircleCodes/{code}`
- gegenseitiges Schreiben in `users/{friendUid}/friends/{ownUid}`

Deploy:

```bash
firebase deploy --only firestore:rules
```

## Version

`beta-2026-07-02-study-circle-v2`
