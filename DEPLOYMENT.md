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

## 8. Wichtiger Hinweis

Die Firebase Web Config darf mit `NEXT_PUBLIC_` im Browser landen. Sie ersetzt aber keine Firestore Security Rules. Die Rules sind der eigentliche Schutz für private Nutzerdaten.
