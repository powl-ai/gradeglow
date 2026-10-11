# GradeGlow Beta Feedback Patch 4.1

Fix für die falsch platzierte Wochen-Auswahl:

- Die Auswahl `Mo–Fr / Mo–Sa / Mo–So` wurde aus dem Prüfungskalender/Lernplan entfernt.
- Die Auswahl sitzt jetzt im Stundenplan-Bereich als `Uni-Woche`.
- Der Stundenplan zeigt je nach Auswahl 5, 6 oder 7 Spalten.
- Das Terminformular bietet nur die gewählten Stundenplan-Tage an.
- Der Lernplan bleibt davon unabhängig und nutzt intern weiterhin seine eigene Lernverteilung.
- `src/app/info/page.tsx` ist weiterhin nicht im Paket enthalten.
