# GradeGlow Beta – Study Circle Polish Update

Version: `beta-2026-07-02-study-circle-polish`

## Ziel

Dieser Patch poliert Study Circle v2 als nächsten Schritt nach dem Beta-Test Control Center. Der Fokus liegt auf einer klareren Circle-Verwaltung, besseren Einladungen und einem weniger technischen Standard-Layout.

## Änderungen

- Aktiver Circle zeigt jetzt eine kompaktere Verwaltungsbox.
- Circle-Code kann weiterhin direkt kopiert werden.
- Zusätzlich kann eine fertige Einladung mit Circle-Name und Circle-Code kopiert werden.
- Circle-Owner können das Wochenziel direkt im UI ändern.
- Wochenziel wird in Minuten gespeichert und auf 30 bis 6000 Minuten begrenzt.
- Mitgliederliste im aktiven Circle ergänzt.
- Mitgliederliste zeigt Owner/Member, eigene Person und Lernzeit der Woche.
- Technischer Study-Circle-Status ist jetzt einklappbar, damit das normale UI weniger nach Debug wirkt.
- App-Version aktualisiert.

## Nicht geändert

- Keine Firestore Rules geändert.
- Keine Firebase Functions deployed.
- Keine Capacitor-Abhängigkeiten ergänzt.

## Testplan

1. Study Circle öffnen.
2. Sharing aktivieren.
3. Circle erstellen.
4. Circle-Code kopieren.
5. Einladung kopieren.
6. Wochenziel als Owner ändern.
7. Mit zweitem Account Circle-Code beitreten.
8. Prüfen, ob Mitgliederliste und Leaderboard aktualisiert werden.
9. Technischen Status öffnen und wieder schließen.
