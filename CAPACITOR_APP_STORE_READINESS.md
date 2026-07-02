# GradeGlow Capacitor / App-Store-Readiness Vorbereitung

Dieses Dokument ist nur Vorbereitung. Es fügt keine Capacitor-Abhängigkeiten hinzu und verändert den Build nicht.

## Ziel

GradeGlow bleibt zuerst eine Vercel-PWA. Für App-Store-Tests kann später Capacitor als Wrapper ergänzt werden, wenn Web-App, Login, Datenschutz, Icons und Offline-Fallback stabil sind.

## Vor dem Capacitor-Start prüfen

- Produktionsdomain final festlegen, z. B. `gradeglow.app`.
- Firebase Authorized Domains um die finale Domain ergänzen.
- Google OAuth Redirects nach finaler Domain prüfen.
- Firebase Auth-Mail-Branding in Authentication/Templates prüfen.
- Impressum und Datenschutz final rechtlich prüfen.
- PWA-Icons in allen Größen finalisieren.
- Datenexport, Datenlöschung und Löschanfrage einmal mit Testaccount prüfen.
- iPhone/iPad PWA testen: Login, Navigation, Kalender, Study Circle, Profil, Feedback.

## Späterer technischer Einstieg

Erst wenn die Web-App stabil ist:

```bash
npm install @capacitor/core @capacitor/cli
npx cap init GradeGlow app.gradeglow.mobile --web-dir=.next
npm install @capacitor/ios @capacitor/android
npx cap add ios
npx cap add android
```

Wichtig: Next.js-Apps müssen für Capacitor je nach Strategie anders gebaut werden. Für einen echten Store-Build muss entschieden werden, ob GradeGlow als statischer Export, hosted WebView oder hybrid gebaut wird. Deshalb aktuell nur vorbereiten, noch nicht ausrollen.

## Nicht vergessen

- Firebase Functions bleiben auf Spark/free nicht deploybar.
- App Store / Play Store brauchen eigene Datenschutzangaben und Screenshots.
- Push Notifications benötigen auf iOS zusätzliche Zertifikate/Keys und sollten erst nach stabiler Web-Push-Beta integriert werden.
