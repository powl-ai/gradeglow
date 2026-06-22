# GradeGlow Deployment auf Vercel

## 1. Projekt vorbereiten

Lokal prüfen:

```bash
npm install
npm run check
```

Falls `npm run build` lokal funktioniert, ist die App bereit für Vercel.

## 2. Firebase Web-App Werte kopieren

In Firebase:

1. Project Settings öffnen
2. Web-App auswählen
3. Firebase Config kopieren
4. Werte in Vercel als Environment Variables eintragen

Benötigt werden:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

## 3. Vercel Projekt anlegen

1. Projekt aus GitHub importieren
2. Framework Preset: Next.js
3. Build Command: `npm run build`
4. Install Command: `npm install`
5. Environment Variables eintragen
6. Deploy klicken

## 4. Firebase Authorized Domains

Nach dem Vercel Deployment musst du die Vercel Domain in Firebase Authentication erlauben.

Beispiele:

```txt
gradeglow.vercel.app
www.deine-domain.de
```

Firebase Console → Authentication → Settings → Authorized domains.

## 5. OAuth Provider aktivieren

### Google

Firebase Console → Authentication → Sign-in method → Google aktivieren.

### GitHub

1. GitHub OAuth App erstellen
2. Callback URL aus Firebase eintragen
3. Client ID und Client Secret in Firebase hinterlegen
4. GitHub Provider aktivieren

### Apple

Apple Login braucht zusätzliche Apple Developer Daten:

- Service ID
- Team ID
- Key ID
- Private Key
- OAuth Redirect URL aus Firebase

Danach Apple Provider in Firebase aktivieren.

## 6. Firestore Rules veröffentlichen

In Firebase Console → Firestore Database → Rules den Inhalt aus `firestore.rules` einfügen und veröffentlichen.

## 7. PWA testen

Nach dem Deployment:

1. Vercel URL in Chrome öffnen
2. Dashboard öffnen
3. Install-Button testen
4. DevTools → Application → Manifest prüfen
5. DevTools → Application → Service Workers prüfen
6. Kurz offline gehen und prüfen, ob `offline.html` erscheint

## 8. Vercel Analytics & Speed Insights

Vercel Analytics ist eingebaut über:

```tsx
import { Analytics } from "@vercel/analytics/next";
```

Speed Insights ist zusätzlich eingebaut über:

```tsx
import { SpeedInsights } from "@vercel/speed-insights/next";
```

Beide Komponenten liegen im Root Layout (`src/app/layout.tsx`). Auf Vercel musst du im Projekt zusätzlich Analytics und Speed Insights aktivieren:

1. Vercel Projekt öffnen
2. Tab **Analytics** öffnen und Analytics aktivieren
3. Tab **Speed Insights** öffnen und Speed Insights aktivieren
4. Danach neues Production Deployment auslösen

## 9. Eigene Domain als Zusatz-Domain

Empfehlung für GradeGlow:

```txt
gradeglow.app
```

Die bestehende Vercel Domain bleibt weiterhin erreichbar. Die eigene Domain ist nur ein zusätzlicher Einstiegspunkt.

Vercel Setup:

1. Vercel Projekt öffnen
2. Settings → Domains
3. `gradeglow.app` hinzufügen
4. Falls du auch `www.gradeglow.app` willst, ebenfalls hinzufügen
5. DNS-Einträge beim Domain-Anbieter exakt so setzen, wie Vercel sie anzeigt
6. Warten, bis Vercel die Domain als validiert anzeigt

Danach auch Firebase aktualisieren:

- Firebase Console → Authentication → Settings → Authorized domains
- `gradeglow.app` hinzufügen
- optional zusätzlich `www.gradeglow.app` hinzufügen

Falls Google/GitHub Login über die neue Domain genutzt werden soll, müssen die OAuth Redirects ebenfalls ergänzt werden:

```txt
https://gradeglow.app/__/auth/handler
https://www.gradeglow.app/__/auth/handler
```

Die bestehende Firebase Handler-URL bleibt zusätzlich drin:

```txt
https://gradeglow.firebaseapp.com/__/auth/handler
```

## 10. Wichtiger Hinweis

Die Firebase Web Config darf mit `NEXT_PUBLIC_` im Browser landen. Sie ersetzt aber keine Firestore Security Rules. Die Rules sind der eigentliche Schutz für private Nutzerdaten.


## Neue App-Routes prüfen

Nach dem Deployment sollten diese URLs erreichbar sein:

- `/`
- `/modules`
- `/planning`
- `/exams`
- `/insights`
- `/backup`
- `/settings`
- `/info`

Wenn am Handy noch die alte Ein-Seiten-Ansicht erscheint, Safari/Browser-Cache hart neu laden oder die PWA einmal schließen und erneut öffnen. Der Service Worker nutzt jetzt `gradeglow-v10`.
