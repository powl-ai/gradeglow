# Lumi und Homescreen-Icon – 8. Oktober 2026

Gezielte Ergänzung zum mobilen UI-Update vom 7. Oktober. Kalender, Feed-Daten, Konten und gespeicherte Noten bleiben unverändert.

- Lumi erhält einen schattierten Sternkörper, goldene Kopfhörer, Hoodie, Sneaker, einen kleinen Glow-Stern und eine Peace-Geste. Er zwinkert bei erledigten Lernblöcken. Die dezente Bewegung respektiert reduzierte Animationen.
- Einstellungen unterscheiden klar zwischen dem Logo innerhalb der App und dem tatsächlichen Homescreen-Icon.
- Drei Homescreen-Bilder: Hell, Dunkel und Rosé, jeweils als echte PNGs für Apple-Touch-Icon und Web-App-Manifest. Die Auswahl führt auf eine eigene Installationsseite mit bereits serverseitig passender Icon-Metadaten-Konfiguration.
- Alle Varianten behalten dieselbe Manifest-ID, denselben Scope und dieselbe Start-URL. Die Auswahl ist keine Änderung des Lernprofils und ersetzt kein bereits installiertes Icon per JavaScript.

## Dark/Light automatisch

Ein automatischer Wechsel eines bereits installierten PWA-Icons ist hier nicht zuverlässig zugesichert. Die standardisierten Manifest-Icon-Felder enthalten keine Dark-/Light-Zuordnung; SVG-Unterstützung allein ist kein Nachweis, dass iOS gespeicherte Home-Bildschirm-Bilder bei jedem Moduswechsel neu rendert. Deshalb gibt es eine ausdrücklich manuelle Installationsauswahl.

Native iOS-Apps können eigene dunkle/getönte Icon-Varianten im Xcode-Asset-Katalog bzw. Icon Composer hinterlegen. Dieses Quellprojekt enthält weiterhin keinen fertigen nativen iOS-Build.

Quellen:
- https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/icons
- https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html
- https://webkit.org/blog/16993/news-from-wwdc25-web-technology-coming-this-fall-in-safari-26-beta/
- https://developer.apple.com/documentation/xcode/configuring-your-app-icon

## Übernehmen

Das aktualisierte Projekt enthält weiterhin den vorherigen UI-Stand. Für diese Ergänzung sind nur Lumi, die zusätzlichen Homescreen-Komponenten/Styles/Installationsseiten, die Icon-Assets, Einstellungen, Layout-Import sowie App-/Cache-Version geändert.

Nach dem Deployment: Einstellungen → „Icon auf deinem Homescreen“ → Stil wählen → Installationsseite in Safari öffnen → Teilen → Zum Home-Bildschirm. Vorhandenes Icon erst entfernen, wenn Konto und Daten über die neue Verknüpfung geprüft sind; keine Website-Daten löschen. Android kann bei bereits vorhandener Installation das bisherige Icon beibehalten.

Build und Browser-Prüfung kontrollieren die Metadaten, Assets, Auswahl und Darstellung. Der tatsächliche iOS-Homescreen-Installationsdialog und ein Wechsel des Systems wurden nicht auf einem echten iPhone getestet.
