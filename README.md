# GradeGlow

Mobile-first PWA für Studienfortschritt, Noten, ECTS, Prüfungsplanung und Fokus-Sessions.

## Tech-Stack

Next.js, React, TypeScript, Tailwind CSS, Firebase Authentication/Firestore und Firebase Cloud Functions. Deployment auf Vercel; Capacitor ist nur vorbereitet.

## Lokal starten

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Die Firebase-Web-App-Konfiguration in `.env.local` eintragen. Die Datei bleibt lokal und wird nicht eingecheckt. Die App öffnet unter `http://localhost:3000`.

### Env-Variablen

Firebase-Web-App:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

Optional: `NEXT_PUBLIC_FIREBASE_VAPID_KEY` für Web Push; `CAPACITOR_SERVER_URL` nur für die native Vorbereitung. Keine Server-Secrets mit `NEXT_PUBLIC_` veröffentlichen.

## Prüfen und deployen

```sh
npm run check
```

Vercel mit dem GitHub-Repo verbinden, die Env-Variablen in Vercel setzen und `npm run build` als Build-Befehl verwenden. Deployments erfolgen über den konfigurierten Git-Branch. Firebase Authorized Domains und OAuth-Weiterleitungen für die Deployment-Domain konfigurieren.

Für Firebase-Regeln und Cloud Functions gelten die separaten [Deployment-](docs/setup/DEPLOYMENT.md) und [FCM-Anleitungen](docs/setup/FCM_SETUP.md).

## Dokumentation

[Dokumentationsübersicht](docs/README.md) · [Setup-Anleitungen](docs/setup/) · [Änderungsnotizen](docs/changelog/)
