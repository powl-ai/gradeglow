# GradeGlow Firebase Cloud Messaging Setup

Dieses Update baut echte Web-Push-Benachrichtigungen über Firebase Cloud Messaging ein.

## Was neu ist

- Dynamischer Firebase Messaging Service Worker unter `/firebase-messaging-sw.js`
- Frontend-Hook für Push-Permission und FCM Token
- Token-Speicherung unter `users/{uid}/notificationTokens/{tokenId}`
- Notification Settings unter `users/{uid}/notificationSettings/main`
- Notification Center unter `users/{uid}/notifications/{notificationId}`
- Cloud Function `sendFriendActivityPush`
- Push an Freunde, wenn `studyActivityEvents/{uid}` geändert wird
- Ruhezeiten zwischen 22:00 und 08:00 Uhr, einstellbar in der App

## Firebase Console: Web Push Key erzeugen

1. Firebase Console öffnen
2. Projekt `gradeglow` auswählen
3. Projekteinstellungen öffnen
4. Tab `Cloud Messaging`
5. Abschnitt `Web Push certificates`
6. Key Pair generieren
7. Den öffentlichen Schlüssel kopieren

Dann in `.env.local` eintragen:

```env
NEXT_PUBLIC_FIREBASE_VAPID_KEY=dein_public_web_push_key
```

Auch in Vercel unter Project Settings → Environment Variables eintragen.

## Lokal installieren

```bash
npm install
cd functions
npm install
cd ..
```

## Lokal prüfen

```bash
npm run lint
npm run typecheck
npm run build
cd functions && npm run build && cd ..
```

## Firebase deployen

Wichtig: Cloud Functions Deployment braucht in Firebase normalerweise den Blaze/pay-as-you-go Plan. Lege am besten direkt ein Budget-Limit in Google Cloud an.

```bash
firebase deploy --only firestore:rules,functions
```

Falls du nur Rules deployen willst:

```bash
firebase deploy --only firestore:rules
```

Falls du nur Functions deployen willst:

```bash
firebase deploy --only functions
```

## Firestore-Struktur

```txt
users/{uid}/notificationSettings/main
users/{uid}/notificationTokens/{tokenId}
users/{uid}/notifications/{notificationId}
studyActivityEvents/{uid}
```

## Test-Flow

1. Zwei Firebase-Accounts erstellen oder zwei Browser/Profile nutzen
2. Bei beiden Study Circle aktivieren
3. Freundecode austauschen
4. Unter Einstellungen → Benachrichtigungen Push aktivieren
5. Bei Account A eine Lernsession starten
6. Account B sollte eine Notification-Center-Nachricht erhalten und, wenn Push erlaubt ist, eine Browser-Push-Benachrichtigung

## Wichtig

Push funktioniert nur, wenn der Browser Benachrichtigungen erlaubt und die Seite über HTTPS läuft. Lokal funktioniert es auf `localhost`. Auf iPhone/iPad ist Web-Push in der Praxis am verlässlichsten, wenn GradeGlow als PWA zum Home Screen hinzugefügt wurde.
