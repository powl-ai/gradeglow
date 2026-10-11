# GradeGlow: nächster Schritt zur iOS-/Android-App

Stand: 7. Oktober 2026. Dieses Paket verbessert die bestehende Web-App/PWA. Es enthält noch keinen nativen Store-Build.

## Vorhandener Stand

`capacitor.config.ts` existiert mit `appId: app.gradeglow.mobile` und `webDir: out`. Capacitor-Abhängigkeiten und native Plattformprojekte fehlen. Der aktuelle Next-Build läuft mit einem Server und erzeugt keinen verwendbaren `out`-Export. `.next` ist kein geeigneter Web-Asset-Ordner für Capacitor.

Die Hauptansichten bleiben jetzt beim Reiterwechsel gemountet. Authentifizierung und Dashboard-Daten werden dabei nicht erneut initialisiert. Die gespeicherte Theme-Wahl wird vor React angewendet. Diese Verbesserungen sind auch für eine spätere App relevant.

## Empfohlener Weg und konkrete Änderungen

Capacitor kann die bestehende React-Oberfläche in einer iOS-/Android-App wiederverwenden. Die Ansichten bleiben Web-Technik; native Funktionen werden über Plugins ergänzt. Für vollständig native UI-Komponenten wäre ein größerer Umbau, etwa mit React Native oder SwiftUI, nötig.

Die Oberfläche sollte lokal mitgeliefert werden. Die vorhandene `CAPACITOR_SERVER_URL`-Option würde die gehostete Website laden und deren Netzwerkabhängigkeit beibehalten; sie ist deshalb nicht das Ziel für diesen Release.

1. Einen eigenen mobilen Frontend-Build einrichten: Next mit `output: export` kompatibel machen oder die Client-Komponenten in einen separaten SPA-Build übernehmen. Den regulären Web-Build erhalten.
2. Serverabhängige Stellen im mobilen Build ersetzen: Firebase-Auth-Rewrite, dynamische Icon-Routen und Checkout-Routen mit serverseitigen `searchParams`. Die Firebase-Web-Push-Route für den mobilen Build durch native Push-Integration ersetzen; statische Icons mitliefern. Mobile Authentifizierung und Zahlungsrückkehr über passende Login-/Deep-Link-Flows verbinden. Dienste bleiben bei Firebase bzw. dem Backend.
3. Einen Asset-Ordner mit `index.html` erzeugen und sicherstellen, dass Hauptansichten lokal erreichbar sind. Offline-Start, Netzwerkfehler und Datenabgleich gezielt testen; die aktuelle PWA-Optimierung garantiert noch keine Offline-Navigation.
4. Capacitor und die iOS-/Android-Plattformen installieren, vorhandene Konfiguration gegen die gewählte Version prüfen. Erst mit funktionierendem mobilem Web-Bundle `cap add` und `cap sync` ausführen.
5. Splashscreen, Statusleiste und Tastatur an das gespeicherte Theme anpassen; die vorhandene Vorbereitung enthält feste helle Farben. Safe Areas, native Push-Benachrichtigungen und Deep Links auf Geräten testen.
6. iOS in Xcode und Android in Android Studio bauen, signieren und testen. Danach TestFlight bzw. den Play-Testkanal vorbereiten.

Das ist ein eigener Implementierungsschritt. Die Konfigurationsdatei allein macht aus dem Projekt noch keine installierbare native App.

## Primärquellen

- https://capacitorjs.com/docs/getting-started
- https://nextjs.org/docs/app/guides/static-exports
- https://capacitorjs.com/docs
