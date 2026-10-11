# Update Notes: Beta Feedback, Data Controls & Admin

## Added

- `/feedback` route with authenticated beta feedback form
- `/admin` route for admin-only beta user management
- reusable `BetaNoticeCard`
- Firestore `feedback` collection helpers
- Admin entitlement helpers
- data export and deletion request in settings
- stronger delete flow for schedule, friends, feedback, study circle data and notification data
- Admin access gated through `entitlements/{uid}.plan = admin`

## Verification

- `npm run typecheck` passed
- `npm run lint` passed
- `cd functions && npm run build` passed
- `npm run build` could not complete in this sandbox because Next tried to download Linux SWC and npm registry access is blocked here. This is the same sandbox limitation as before, not a TypeScript or ESLint failure.
