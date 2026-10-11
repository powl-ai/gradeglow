# GradeGlow Safe Profile Load Update

Dieses Paket schützt Profil- und Study-Circle-Daten vor leeren Zwischenständen während Firebase Auth/Firestore noch lädt.

## Änderungen

- Dashboard zeigt jetzt einen echten Ladezustand, bis das Cloud-Profil geladen ist.
- `saveProfile` blockiert Speichern, solange das Profil noch nicht geladen wurde.
- Auto-Saves aus Rewards/Planner können dadurch keine leeren Default-Profile mehr über echte Profildaten schreiben.
- Study Circle wartet auf das geladene Profil, bevor öffentliche Profile veröffentlicht oder gelöscht werden.
- Study-Circle-Buttons sind deaktiviert, solange das Profil lädt.
- Vor künftigen Profil-Speicherungen wird ein lokales Profil-Backup gehalten (`gradeglow-profile-backups-v1-{uid}`).

## Wichtig

Dieses Update verhindert zukünftige Überschreibungen. Bereits überschriebenen Firestore-Daten kann die App ohne vorhandenes Backup nicht automatisch rekonstruieren.
