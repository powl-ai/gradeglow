# GradeGlow Auth Setup

## Google Login auf Vercel prüfen

Google Cloud Console → Projekt `GradeGlow` → Google Auth Platform → Clients → Web-Client öffnen.

Authorized JavaScript origins:

```text
https://gradeglow-beryl.vercel.app
```

Authorized redirect URIs:

```text
https://gradeglow-beryl.vercel.app/__/auth/handler
https://gradeglow.firebaseapp.com/__/auth/handler
```

Firebase Console → Authentication → Settings → Authorized domains:

```text
gradeglow-beryl.vercel.app
```

In Vercel muss stehen:

```text
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=gradeglow-beryl.vercel.app
```

Wenn du diese Variable änderst, danach in Vercel redeployen.

## GitHub Login aktivieren

1. GitHub → Developer settings → OAuth Apps → New OAuth App.
2. Homepage URL: `https://gradeglow-beryl.vercel.app`.
3. Authorization callback URL aus Firebase übernehmen.
4. Client ID und Client Secret in Firebase Authentication → Sign-in method → GitHub eintragen.
5. GitHub Provider in Firebase aktivieren.

## Apple Login aktivieren

Apple Login ist etwas aufwendiger und braucht normalerweise einen Apple Developer Account.

1. Firebase Authentication → Sign-in method → Apple aktivieren.
2. Apple Developer Portal → Identifier/Service ID für Web Login anlegen.
3. Redirect/Return URL aus Firebase übernehmen.
4. Team ID, Key ID, Service ID und Private Key in Firebase eintragen.
5. Danach erneut auf Vercel testen, besonders auf iPhone/Safari.

## Warum der Rewrite wichtig ist

`next.config.ts` leitet `/__/auth/:path*` an Firebase weiter. Zusammen mit
`NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=gradeglow-beryl.vercel.app` kann Firebase Auth den Redirect-Flow über deine Vercel-Domain abwickeln.

## Warum der Service Worker wichtig ist

`public/sw.js` darf `/__/auth/` nicht cachen oder abfangen. Sonst können Google/Apple/GitHub Redirects in der PWA oder auf Mobile hängen bleiben.
