# GradeGlow Beta/Admin Setup

## Neu in diesem Paket

- Feedback-/Bug-/Feature-Seite unter `/feedback`
- Beta-Aufklärungskarte im Dashboard und in den Einstellungen
- Datenexport, Löschanfrage, App-Daten-Löschung und Account-Löschung in den Einstellungen
- Admin-Beta-Verwaltung unter `/admin`
- Firestore Rules für Feedback, Entitlements und Admin-Rechte

## Feedback

Feedback wird in Firestore gespeichert unter:

```txt
feedback/{feedbackId}
```

Wichtige Felder:

```txt
ownerUid
ownerEmail
ownerName
type: bug | feedback | feature_request | delete_request | beta_note
status: open | reviewing | planned | done | closed
priority: low | normal | high
subject
message
page
createdAtIso
adminNote
```

## Ersten Admin anlegen

Damit du `/admin` nutzen kannst, musst du dich selbst einmalig manuell in Firebase Console als Admin freischalten:

1. Firebase Console öffnen
2. Authentication → Users
3. Deine UID kopieren
4. Firestore Database → Collection `entitlements`
5. Dokument mit deiner UID als Dokument-ID erstellen
6. Felder setzen:

| Feld | Typ | Wert |
|---|---|---|
| `plan` | string | `admin` |
| `premiumSource` | string | `founder` |
| `premiumStatus` | string | `active` |
| `premiumUntil` | string | leer lassen oder z. B. `2030-12-31` |
| `note` | string | `Founder/Admin` |
| `betaTester` | boolean | `true` |

Danach neu laden und `/admin` öffnen.

## Beta-Premium für User vergeben

In `/admin` brauchst du nur die Firebase Auth UID des Users.

Empfohlene Werte für 1 Jahr Beta-Premium:

```txt
plan: premium
premiumUntil: 2027-06-24
premiumSource: beta_test
premiumStatus: active
note: 1 Jahr Beta-Test Premium
betaTester: true
```

## Firestore Rules deployen

Nach dem Einbauen unbedingt Rules deployen:

```bash
firebase deploy --only firestore:rules
```

## Wichtig zu Datenschutz/Löschung

Die Einstellungen löschen jetzt zusätzlich:

```txt
users/{uid}/modules
users/{uid}/exams
users/{uid}/schedule
users/{uid}/friends
users/{uid}/notificationTokens
users/{uid}/notificationSettings
users/{uid}/notifications
feedback mit ownerUid == uid
studyFriendCodes mit uid == uid
publicStudyProfiles/{uid}
studyActivityEvents/{uid}
```

Entitlements werden nicht automatisch durch den User gelöscht, weil sie Premium-/Admin-Zugriffe steuern. Bei echter Produktivnutzung solltest du Entitlement-Aufbewahrung und Löschung nochmal final prüfen.

## Git Commit

```bash
git add .
git commit -m "Add beta feedback data controls and admin management"
git push origin HEAD
```
