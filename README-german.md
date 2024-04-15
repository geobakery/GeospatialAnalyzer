
[![en](https://img.shields.io/badge/lang-en-red.svg)](./README.md)
[![deu](https://img.shields.io/badge/lang-deu-green.svg)](./README-german.md)

- [] Logo

## GeospatialAnalyzer

Das ist ein Open-Source-Projekt des Landesamt für Geobasisinformation Sachsen (GeoSN) mit freundlicher Unterstützung in der Entwicklung von con terra GmbH. 

GeospatialAnalyzer ist ein auf Node.js basierendes Web-Interface und benutzt unter anderem NestJS, TypeORM, fastify und Swagger. 

Dieser Webservice kann in bestimmte elektronische Prozesse eingebunden werden, wie zum Beispiel externe Anwendungen und spezialisierte Prozeduren.

Es ermöglicht die Übergabe von Geoobjekten in Form von Koordinaten, um sie gegen verschiedene räumliche Zuordnungen zu prüfen. Zurückgegeben werden die gefundenen, dem Objekt zugeordneten, Attribute und optional ihre Geometrie.

Auf diese Weise kann z.B. automatisiert ermittelt werden, in welchem Landkreis ein übergebenes Objekt liegt.

Für mehr Informationen lesen sie bitte in der ausführlichen Dokumentation nach.

### Wichtige Funktionalitäten
- Allgemeine Interoperabilität und Schnittstellenarchitektur
- Grundlegende Unterstützung für verschiedene Datenbanken
- Intergrierte Docker - Bereitstellung
- Integrierte Swagger UI-Dokumentation
- Fokus auf Performance
- Einfache und anpassbare Datenquellenkonfiguration
- Unterstützung von GeoJSON und EsriJSON als Eingabe und Transformstion in das jeweils andere Format
- beliebige KRS-Wahl
- Rückgabe der getroffenen Geometrie möglich
- Unterstützung von Rasterdaten auch als Tile Set
- Unit- und E2E-Tests

### Vorgefertigte Schnittstellen (räumliche Tests)
- within
- intersect
- nearest-neighbour
- valuesAtPoint
- transform
- health

## Nutzer- und Entwicklerbereich

Bitte schauen sie für die umfangreiche Installations- und Entwicklungsanweisungen in folgenden Bereichen:

[Installationsanweisung](./README-development.md#installation-and-debugging)

[Möglichkeiten der Mitentwicklung](./README-development.md#contribution)

## Lizenz
GPL 

## Kontakt

Dieses Projekt wurde vom Landesamt für Geobasisinformation Sachsen und con terra GmbH entwickelt.

Verantwortlicher: Sebe Weiß

Email: servicedesk@geosn.sachsen.de 
