# GradeGlow Premium / Beta-Test Setup

Dieses Projekt hat Premium bereits zentral vorbereitet über:

```txt
src/lib/gradeglowAccess.ts
src/hooks/useGradeGlowAccess.ts
firestore.rules
```

## Empfohlene Variante: entitlements/{uid}

Für manuell vergebene Premium-, Beta-, Lifetime- oder Admin-Rechte ist diese Collection am saubersten:

```txt
entitlements/{USER_UID}
```

Für 1 Jahr Beta-Test-Premium ab dem 24.06.2026 trägst du in Firebase Console ein:

| Feld | Typ | Wert |
|---|---|---|
| `plan` | string | `premium` |
| `premiumUntil` | string | `2027-06-24` |
| `premiumSource` | string | `beta_test` |
| `premiumStatus` | string | `active` |
| `note` | string | `1 Jahr Beta-Test Premium` |
| `updatedAtIso` | string | aktueller ISO-Zeitstempel, optional |

Warum diese Variante besser ist:

- User können `entitlements/{uid}` lesen, aber nicht selbst schreiben.
- Die App liest diesen Plan automatisch über `useGradeGlowAccess`.
- Du vermischst Profil-/App-Daten nicht mit Zahlungs-/Premiumrechten.

## Alternative Variante: users/{uid}

Der Code ist zusätzlich kompatibel mit Premium-Feldern direkt im User-Dokument:

```txt
users/{USER_UID}
```

Mögliche Felder:

| Feld | Typ | Wert |
|---|---|---|
| `plan` | string | `premium` |
| `isPremium` | boolean | `true` |
| `premiumStatus` | string | `active` |
| `premiumSource` | string | `beta_test` |
| `premiumExpiresAt` | timestamp | `24.06.2027` |
| `betaTester` | boolean | `true` |

Wichtig: Wenn beide existieren, gewinnt `entitlements/{uid}`.

## Was wurde eingebaut?

### 1. `src/lib/gradeglowAccess.ts`

- Erkennt weiterhin alte Entitlement-Dokumente.
- Erkennt zusätzlich `users/{uid}` Felder wie `isPremium`, `premiumStatus`, `premiumExpiresAt`.
- Lässt Premium automatisch auslaufen, wenn das Ablaufdatum überschritten ist.

### 2. `src/hooks/useGradeGlowAccess.ts`

- Hört jetzt auf beide Dokumente:
  - `entitlements/{uid}`
  - `users/{uid}`
- Berechnet daraus den aktiven Plan und die Limits.

### 3. `src/components/PremiumGate.tsx`

Für neue Premium-Features kannst du später so sperren:

```tsx
import PremiumGate from "../components/PremiumGate";

<PremiumGate plan={entitlement.plan}>
  <DeinPremiumFeature />
</PremiumGate>
```

### 4. `src/lib/premium.ts`

Hilfsfunktionen, falls du später über ein Admin-Panel oder Backend automatische Payloads erzeugen willst:

```ts
buildOneYearBetaEntitlement();
buildOneYearBetaUserFields();
```

## Firestore Rules

Die Rules erlauben:

- User lesen ihr eigenes `entitlements/{uid}` Dokument.
- User schreiben `entitlements/{uid}` nicht selbst.
- User lesen ihr eigenes `users/{uid}` Dokument.
- User dürfen geschützte Premium-Felder unter `users/{uid}` nicht selbst setzen oder verändern.

Geschützte Felder:

```txt
plan
isPremium
premiumStatus
premiumSource
premiumExpiresAt
premiumUntil
betaTester
role
```

## Nach dem Eintragen testen

1. App neu laden.
2. In GradeGlow zu Einstellungen gehen.
3. Unter `Plan & Premium` sollte stehen:

```txt
Premium aktiv bis 2027-06-24 · Beta
```

Dann sind Premium-Themes, höhere Limits und Advanced Stats aktiv.
