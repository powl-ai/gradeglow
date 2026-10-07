# GradeGlow – Darkmode, Logo und Navigation

Stand: 7. Oktober 2026. Vollständiger Projektstand, einschließlich des vorherigen Updates für Einstieg und Gast-Demo.

## Änderungen

- Darkmode-Hotbar mit dunklem Hintergrund, klarem Rand, lesbaren inaktiven Icons und deutlich markiertem aktivem Reiter. Der Dock im Portal trägt eigene Theme- und Akzentwerte.
- Einstellungen → Look & Feel: vier Logo-Modi Automatisch, Hell, Dunkel und Rosé. Automatisch folgt dem Design-Modus. Mit „Profil speichern“ übernehmen. Dies betrifft das Logo in der App; ein installiertes PWA-Homescreen-Icon wird dadurch nicht ausgetauscht. Premium-Icons bleiben verfügbar; die Auswahl einer dieser Varianten aktiviert das Standardlogo.
- Zehn Dashboard-Routen teilen eine dauerhaft gemountete Dashboard-Instanz. Die fünf Hotbar-Reiter behalten Authentifizierung, Daten-Hooks und Dock beim Wechsel; Browser-Zurück bleibt nutzbar. Eigenständige Seiten wie Einstellungen teilen die Authentifizierung, können das Dashboard beim Wechsel aber neu mounten.
- Gespeicherter Design-Modus wird im Dokumentkopf vor React angewendet. Dokument-Hintergrund und Farbschema folgen der App. System-Darkmode wird nicht mehr von einer späteren hellen Standardregel überschrieben.
- Service-Worker-Cache auf Version 53 erhöht.

## Übernahme

Das gesamte Projekt übernehmen, insbesondere `layout.tsx`, `GradeGlowAppHost.tsx`, `AuthGate.tsx` und Routendateien zusammen. Dashboard-Routendateien geben die Ansicht an den gemeinsamen Root-Host ab; einzelne Dateien auszulassen würde diese Ansichten beschädigen.

Eigene Umgebungsvariablen beibehalten. `npm ci`, anschließend `npm run check`. Lokaler Start: `npm run dev`. Dieses Paket wurde nicht auf der Live-Website veröffentlicht und enthält weder `node_modules` noch Build-Ausgaben.

## Verifiziert

- ESLint, TypeScript und Produktions-Build bestanden. Eine bereits vorhandene ESLint-Warnung zum Hook in `Planner.tsx` bleibt bestehen.
- Mobiles Chromium mit 393 × 852 Pixeln: Dark-/Light-Hotbar, zentrierter Dock ohne horizontalen Überlauf; dieselben Dashboard-/Dock-DOM-Knoten bei fünf Reiterwechseln und Browser-Zurück, kein erneuter Auth-Ladescreen.
- Vier Logo-Optionen, automatische Anpassung beim System-Moduswechsel, gespeicherte Rosé-Auswahl und Wiederherstellung des expliziten Darkmode nach Neuladen bei hellem System-Modus geprüft.
- Gast-Einstieg, isolierte Demo-Daten, Basic-/Pro-Umschaltung und bestehender Registrierungsablauf erneut in Komponententests geprüft.

Browserprüfung mit lokalen Demo-Daten. Firebase-Login, Cloud-Synchronisierung und iPhone-PWA einschließlich Notch wurden in diesem Durchlauf nicht auf einem realen Gerät geprüft. Der Umbau vermeidet das erneute Laden der Kernansichten, verspricht jedoch keine vollständig netzunabhängige Navigation.

## Native App

Der weitere Weg steht in `CAPACITOR_APP_STORE_READINESS.md`. Capacitor-Konfiguration ist vorhanden; ein lokal gebündelter mobiler Build und native Plattformprojekte müssen noch implementiert werden.
