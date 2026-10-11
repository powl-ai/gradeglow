# GradeGlow – Einstieg & Probezugang (07.10.2026)

Grundlage: vollständiges GradeGlow-Paket vom 22.07.2026.

## Änderungen
- Eine Willkommensseite mit Logo, kurzem Text und drei Einstiegswegen.
- Registrierung und Login erst nach Auswahl; Zurück-Button führt zum Einstieg.
- Beta-Kommunikation, doppelte Hero-Fläche, Techniktexte und deaktivierter Apple-Button auf dem Einstieg entfernt.
- Vorhandenes Onboarding folgt nach der Anmeldung; E-Mail-Bestätigung bleibt erhalten.
- Probezugang ohne Registrierung mit fünf Beispielmodulen, zwei Prüfungen und Lerneinheiten.
- Basic/Pro-Vorschau verwendet dieselben Funktionslimits wie Free/Premium. Sie ist eine lokale Vorschau und aktiviert kein Abo.
- Demo nutzt einen separaten Benutzerbereich; Änderungen bleiben auf dem Gerät. Navigation und Neuladen erhalten die Sitzung; Beenden beendet den Probezugang.
- „Konto erstellen“ verlässt die Demo. Neue Konten starten ohne Beispieldaten und ohne Pro-Freischaltung.
- Safe-Area-Hintergrund, viewport-fit=cover und transparente iOS-Statusleiste für PWA vorbereitet.
- Beta-Panels im normalen Dashboard ausgeblendet; sie bleiben intern verfügbar.
- Service-Worker-Version erhöht, damit installierte PWAs das Update laden.

## Einspielen
Das Archiv enthält das vollständige Projekt im Ordner GradeGlow-2.
Den Inhalt dieses Ordners in das bestehende Projekt übernehmen, einschließlich der beiden neuen Dateien src/lib/guestDemo.ts und src/components/DemoAccessBar.tsx.
Bestehende Umgebungsvariablen behalten. Firebase, Abos und Deployment-Konfiguration müssen für dieses Update nicht geändert werden.
Dann wie gewohnt über das bestehende Repository deployen. Dieses Paket wurde nicht veröffentlicht.

## Prüfung
npm run check erfolgreich: Lint ohne Fehler (eine bereits vorhandene Warnung in GradeGlowPlanner.tsx), TypeScript und Produktionsbuild.
React/DOM-Integration geprüft: Willkommensseite, separate Login-/Registeransicht, Demo-Daten, Planwechsel und Limits, Sitzungswiederherstellung, Beenden, Registrierung nach Demo, getrennte Kontodaten.
Demo-Hooks bei konfigurierter Cloud geprüft: Module, Prüfungen und Profil bleiben lokal.
PWA-Metadaten im Produktions-HTML geprüft.
Ein visueller Test auf einem echten iPhone/in der installierten PWA steht noch aus; Social Login und E-Mail-Versand wurden hier nicht live getestet.
