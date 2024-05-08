[![en](https://img.shields.io/badge/lang-en-red.svg)](./README.md)
[![deu](https://img.shields.io/badge/lang-deu-green.svg)](./README.de.md)

- [] Logo

# GeospatialAnalyzer

Dies ist ein Open-Source-Projekt des Landesamtes für Geobasisinformation Sachsen (GeoSN) mit freundlicher Unterstützung in der Entwicklung durch die con terra GmbH.

GeospatialAnalyzer ist eine auf Node.js basierende HTTP-API, die NestJS, TypeORM, fastify, OpenAPI, Swagger und mehr verwendet.

Dieser Webservice kann in elektronische Prozesse wie Anwendungen und Fachverfahren integriert werden.

Er ermöglicht die Übergabe von Geoobjekten in Form von Koordinaten, um sie gegen verschiedene räumliche Zuordnungen zu prüfen. Zurückgegeben werden die gefundenen, dem Objekt zugeordneten, Attribute und optional ihre Geometrie. Auf diese Weise kann z. B. automatisiert ermittelt werden, in welchem Landkreis ein übergebenes Objekt liegt.

Für mehr Informationen lesen sie bitte in der ausführlichen Dokumentation nach.

## Wesentliche Funktionalitäten

- Allgemeine Interoperabilität und Schnittstellenarchitektur
- Grundlegende Unterstützung für verschiedene Datenbanken
- Intergrierte Docker-Bereitstellung
- Integrierte Swagger UI-Dokumentation
- Fokus auf Performance
- Einfache und anpassbare Datenquellenkonfiguration
- Unterstützung von GeoJSON und EsriJSON als Ein- und Ausgabe 
- Transformation in das jeweils andere Format
- Beliebige KRS-Wahl
- Rückgabe der getroffenen Geometrie möglich
- Unterstützung von Rasterdaten auch als Tile Set
- Unit- und E2E-Tests

## Schnittstellen

- [within](documentation/within.md)
- [intersect](documentation/intersect.md)
- [nearest-neighbour](documentation/neighbour.md)
- [valuesAtPoint](documentation/valuesAtPoint.md)
- [transform](documentation/transform.md)
- health

# Nutzer- und Entwicklerbereich

Bitte schauen Sie für umfangreiche Installations- und Entwicklungshinweise in folgenden Bereichen:

[Installationshinweise](./README.development.md#installation-and-debugging)

[Möglichkeiten der Mitentwicklung](./README.development.md#contribution)

# Lizenz

GPL v3

# Kontakt

Dieses Projekt wurde vom Landesamt für Geobasisinformation Sachsen (GeoSN) und con terra GmbH entwickelt.

Verantwortlicher: Sebe Weiß (GeoSN)

E-Mail: servicedesk@geosn.sachsen.de