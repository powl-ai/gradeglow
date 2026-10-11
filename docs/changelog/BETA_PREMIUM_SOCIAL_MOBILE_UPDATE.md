# GradeGlow Beta Update – Premium Boundaries, Beta Badges, Circle Profile & Mobile Polish

Version: `beta-2026-07-02-premium-social-mobile`

## Enthalten

- Neue Seite `/premium` als Paywall-Vorbereitung ohne echte Zahlungen.
- Zentrale Feature-Gate-Logik in `src/lib/featureGates.ts`.
- Free/Beta/Plus/Admin-Grenzen dokumentiert und in der App sichtbar gemacht.
- Public Study Profiles veröffentlichen jetzt `badgeIds` mit `beta-2026`.
- Study Circle Mitglieder und Freunde zeigen Beta-Badges.
- Circle-Mitglieder sind anklickbar und öffnen ein öffentliches Profilmodal.
- Im Profilmodal kann man sichtbare Circle-Mitglieder als Freund hinzufügen oder bestehende Freunde entfernen.
- Admin Feedback Control Center hat Schnellfilter für aktive, erledigte und archivierte Meldungen.
- Erledigte Feedbacks sind weiter über Statusfilter einsehbar und änderbar.
- Mobile/PWA CSS-Pass für kleinere Schrift, kompaktere Felder, bessere Safe-Area und Quick-Rail-Dichte.
- Service Worker Cache auf `gradeglow-v26`, `/premium` in App-Shell.
- Launch-Checkliste ergänzt um Premium-Seite und Firebase-Auth-Mail-Hinweis mit Owner-/Console-Rechte-Hinweis.

## Nicht enthalten

- Keine echte Zahlung.
- Keine Stripe-/RevenueCat-/StoreKit-Integration.
- Keine Firebase Functions.
- Keine Firestore Rules geändert.

## Testfokus

1. `/premium` öffnen und Free/Beta/Plus-Grenzen prüfen.
2. Study Circle öffnen, Mitglied anklicken, Profilmodal prüfen.
3. Circle-Mitglied, das noch kein Freund ist, über Profilmodal hinzufügen.
4. Freundesprofile auf Beta-Badge prüfen.
5. `/admin` öffnen, Feedback auf erledigt setzen und über Erledigt/Alle Status wiederfinden.
6. iPhone/PWA: Insights, Prüfungen/Lernplan, Study Circle und Launch Center auf Schrift-/Feldgröße prüfen.
7. Service Worker Update nach Deploy: PWA einmal neu laden, falls Update-Hinweis erscheint.

## Firebase Auth-Mail `project-...-Team`

Wenn Firebase die Änderung blockiert, liegt es sehr wahrscheinlich nicht am GradeGlow-Code. Prüfe in Firebase Console:

- Projektrollen: Du brauchst Owner oder ausreichende IAM-Rechte.
- Authentication → Templates / Branding / Public-facing project name.
- Google Cloud Console → OAuth Consent Screen / App name.
- Falls ein fremdes/älteres Firebase-Projekt genutzt wird: Projektbesitz oder Support prüfen.

