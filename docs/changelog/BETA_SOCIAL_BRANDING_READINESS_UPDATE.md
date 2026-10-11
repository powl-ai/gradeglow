# GradeGlow Beta Update: Social Polish + Branding Readiness

Version: `beta-2026-07-02-social-branding-readiness`

## Enthalten

- Study Circle v2 UI weiter poliert:
  - Freundescode, Circle erstellen und Circle-Code beitreten liegen jetzt zusammen im Bereich „Codes & Einladungen“.
  - Enter/Return in den Code-Feldern löst die passende Aktion aus und löst kein falsches Setup-/Seitenverhalten aus.
  - Aktiver Circle zeigt jetzt Owner/Member-Badge und den Circle-Code in einer klareren Kopierbox.
  - Linke Study-Circle-Karte ist weniger überladen und zeigt stattdessen einen Schnellcheck für Beta-Tests.
- Firebase Auth-Mail-Branding dokumentiert:
  - `/info` enthält jetzt eine konkrete Checkliste, warum `project-...-Team` nicht aus dem Code kommt.
  - Schritte für Public-facing name, Auth Templates, Sender name, Reply-to und Testmail sind dokumentiert.
- App-Version aktualisiert.

## Nicht geändert

- `firestore.rules` wurden nicht verändert.
- Firebase Functions wurden nicht deployed und nicht aktiviert.
- Keine Blaze-Abhängigkeit hinzugefügt.

## Testfokus

1. Study Circle öffnen und Sharing aktivieren.
2. Eigenen Freundescode kopieren.
3. Bei einem zweiten Account Freundescode einfügen und Enter drücken.
4. Prüfen: Beide Accounts sind danach gegenseitig befreundet.
5. Circle erstellen, Circle-Code kopieren, zweitem Account beitreten lassen.
6. Prüfen: Aktiver Circle zeigt Name, Owner/Member, Code, Mitglieder und Wochenmissionen.
7. `/info` öffnen und Firebase Auth-Mail-Branding-Checkliste prüfen.

## Commands

```bash
npm run lint
npm run typecheck
npm run build
```

Oder alles zusammen:

```bash
npm run check
```

## Deploy-Hinweis

Für diesen Patch reicht der normale Vercel-Code-Deploy über Git.

```bash
git status
git add .
git commit -m "polish study circle and document auth branding"
git push origin HEAD
```

Firebase Deploy ist nur nötig, wenn Firestore Rules geändert wurden. In diesem Patch also nicht nötig.

Firebase Functions weiterhin nicht deployen, solange das Firebase-Projekt auf Spark/free läuft.
