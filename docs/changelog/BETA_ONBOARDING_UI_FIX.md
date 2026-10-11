# Beta Onboarding UI Fix

- Onboarding-Step 1 kann per Enter nicht mehr versehentlich das komplette Setup abschließen.
- Feature-Auswahl startet im Onboarding nicht mehr automatisch mit allen optionalen Bereichen aktiv, sondern mit einer empfohlenen Auswahl.
- Neue Schnelloptionen: Empfohlen, Alles aktivieren, Minimal starten.
- Feature-Karten und Notification-Karten bleiben im Standard-/System-Darkmode lesbar.
- App-Version: beta-2026-07-02-onboarding-ui-fix.

## Firebase E-Mail-Absender/Teamname
Der Text `project-...-Team` in Firebase-Verifizierungs-E-Mails kommt nicht aus dem Next.js-Code, sondern aus den Firebase-Authentication-E-Mail-Templates bzw. dem Public-facing project name. Das muss in der Firebase Console auf `GradeGlow` angepasst werden.
