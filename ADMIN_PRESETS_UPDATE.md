# Admin Presets Update

Dieses Update verbessert die Beta-/Admin-Verwaltung:

- Quick-Presets für `1 Jahr Beta Premium`, `Lifetime Freundesbonus`, `Admin / Founder` und `Free / Entfernen`.
- Bei `premium` wird das Ablaufdatum automatisch auf ein Jahr ab heute gesetzt.
- Bei `lifetime`, `admin` und `free` wird `premiumUntil` automatisch leer gespeichert.
- Das Datumsfeld wird für nicht ablaufende Pläne deaktiviert.
- Die Cloud-Functions-`tsconfig.json` enthält jetzt `rootDir: "src"`, damit der Functions-Build nicht mehr wegen TS5011 abbricht.

Deploy:

```bash
npm install
cd functions
npm install
npm run build
cd ..
firebase deploy --only firestore:rules,functions
git add .
git commit -m "Add admin entitlement presets"
git push origin HEAD
```
