# GradeGlow Capacitor / Native App Prep

Patch: `beta-2026-07-02-capacitor-prep`

## Ziel

Dieser Patch bereitet GradeGlow für eine spätere iOS-/Android-App vor, ohne die aktuelle Web-App oder PWA zu gefährden.

Wichtig:

- Vercel bleibt das normale Deployment.
- PWA bleibt produktiv.
- Firebase Functions werden nicht deployed.
- Keine Blaze-Pflicht.
- Keine nativen Plattformordner (`ios/`, `android/`) wurden erzeugt.
- Keine echten Zahlungen, keine Ads, keine In-App-Purchases.
- Keine neuen npm-Abhängigkeiten wurden installiert.

## Neue Dateien

- `capacitor.config.ts`
- `src/lib/nativeAppReadiness.ts`
- `src/components/NativeAppReadinessPage.tsx`
- `src/app/native/page.tsx`

## Native App Readiness Seite

Neue Route:

```txt
/native
```

Die Seite enthält:

- Native Readiness Score
- App-ID: `app.gradeglow.mobile`
- App-Name: `GradeGlow`
- WebDir: `out`
- lokale Native-Checkliste pro Account
- kopierbarer Native App Readiness Report
- klare Trennung zwischen PWA-first und späterem Store-Build

## Capacitor Config

`capacitor.config.ts` ist bewusst ohne Type-Import aus `@capacitor/cli` geschrieben, damit `npm run typecheck` nicht fehlschlägt, solange Capacitor noch nicht installiert ist.

Die Config ist vorbereitet für:

- App-ID
- App-Name
- späteres `out`-Verzeichnis
- iOS/Android Safe-Area-/Statusbar-/Keyboard-Defaults
- optionalen gehosteten Preview-Build über `CAPACITOR_SERVER_URL`

## Spätere Befehle

Erst ausführen, wenn du wirklich mit Xcode/Android Studio weiterarbeitest:

```bash
npm install @capacitor/core @capacitor/cli
npm install -D @capacitor/assets
npm install @capacitor/ios @capacitor/android
npx cap add ios
npx cap add android
npm run build
npx cap sync
```

## Wichtige technische Entscheidung

GradeGlow ist aktuell eine Next.js/Vercel-App. Für Capacitor gibt es später zwei Wege:

### Weg A: Hosted Native Preview

Die native App lädt deine Vercel-App über `CAPACITOR_SERVER_URL`.

Vorteil:

- Schnell testbar.
- Kein sofortiger Next static export nötig.

Nachteil:

- Für Store-Review muss genau geprüft werden, ob es nicht nur wie ein dünner WebView-Wrapper wirkt.
- Offline-Fähigkeit hängt stärker vom Web/PWA-Cache ab.

### Weg B: Static Export

GradeGlow wird so angepasst, dass `next build` ein statisches `out/` erzeugt.

Vorteil:

- Sauberer für native Verpackung.
- App enthält mehr lokal gebündelte Oberfläche.

Nachteil:

- Next.js-Funktionen, die Serververhalten brauchen, müssen geprüft werden.
- Firebase Auth Redirects, PWA Routes und dynamische Pages müssen einzeln getestet werden.

## Was vor TestFlight geprüft werden muss

1. iOS PWA bleibt stabil.
2. Mobile Shell hat keine Header-/Statusbar-Overlaps.
3. Bottom-Hotbar verdeckt keine Inhalte.
4. `/timer` ist wirklich eigene Fokus-Seite.
5. Google Login funktioniert im Capacitor WebView.
6. Passwort-Reset und Account-Löschung funktionieren in native WebView.
7. Push-Strategie ist entschieden.
8. Plus/IAP-Strategie ist entschieden.
9. Datenschutz/Impressum/Support final geprüft.
10. App-Icons und Splashscreen sind sauber generiert.

## Monetarisierung Hinweis

Für digitale Plus-Funktionen in einer iOS-App müssen später Apples In-App-Purchase-Regeln geprüft werden. Deshalb sind echte Zahlungen in diesem Patch bewusst nicht aktiv.

Ads bleiben nur als optionale spätere Sponsor Card sinnvoll. Keine Ads im Timer oder Fokusmodus.
