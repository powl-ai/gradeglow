# GradeGlow Beta Feedback Patch 1

Fokus dieses Pakets: erstes echtes Tester-Feedback aus der Mini-Beta glätten, ohne neue riskante Datenmodelle oder Firebase Functions einzuführen.

## Enthalten

- Mobile Landing/Auth neu priorisiert: Login/Registrierung steht auf Mobile zuerst, Beta-Kurzstart ist direkt sichtbar.
- Die Landing-Featurekachel sagt nicht mehr prominent nur „PWA installierbar“, damit Tester nicht denken, sie müssten zuerst installieren.
- Floating Beta Actions sind jetzt eingeklappt und nerven nicht dauerhaft unten rechts.
- Feedback-Seite: „Feedback geben“ springt auf der Feedback-Seite direkt zum Formular.
- Eigene Feedbackmeldungen laden indexfrei über `ownerUid` und werden im Client sortiert. Dadurch braucht die Nutzeransicht keinen Firestore Composite Index mehr.
- Feedbackliste zeigt eine verständliche Fehlermeldung statt still „Noch keine Meldungen“ zu behaupten.
- Quick-Rail/Side-Scroll wurde enger begrenzt, damit sie weniger über den mobilen Viewport hinausragt.
- Darkmode-Kontraste für Study Circle/Friends, Privacy-Toggles und Leaderboard verbessert.
- App-Version: `beta-2026-06-30-feedback-1`.

## Nicht enthalten

- Dynamische echte PWA-App-Icons pro Nutzer. Das ist möglich als In-App-Cosmetic/Preview; das tatsächlich installierte Homescreen-Icon wird aber vom Browser/Manifest gecacht und braucht meist Neuinstallation bzw. statische Manifest-Assets. Das sollte als separater Premium-Cosmetics-Schritt geplant werden.
- Firebase Functions Deploy. Spark/free bleibt kompatibel.
- Firestore Rules Änderungen. Nicht nötig.

## Testfokus

1. Mobile Startseite öffnen: Login/Registrierung und Beta-Einleitung müssen sofort verständlich sein.
2. Feedback absenden und danach als normaler Nutzer unter „Deine letzten Meldungen“ sehen.
3. Admin Feedback Inbox prüfen.
4. Friends/Study Circle im dunklen violetten Theme prüfen.
5. Quick-Rail auf Mobile horizontal scrollen und Seite wechseln.
