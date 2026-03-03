Dieser Webservice gibt für ein oder mehrere Grafikobjekte (Punkt, Linie, Polygon) nach einer wählbaren räumlichen Zuordnung Sachdaten zu verschiedenen Objektarten (z. B. Landkreise, Flurstücke usw.) zurück.

Die Rückgabe beinhaltet die Attribute und optional die Geometrien der Objekte, die der Anfrage entsprechen.
Unterstützt werden sowohl EsriJSON als auch GeoJSON als Eingabewerte. Der Service ist in der Lage, Rasterdaten und Tilesets zu verarbeiten.

Weitere technische Informationen finden Sie in den [Projekt-Dokumentationen auf GitHub](https://github.com/geobakery/GeospatialAnalyzer/blob/main/README.md).

## Try-it-out

Um Testanfragen an die Schnittstelle zu senden, können Sie für das jeweilige Modul den "Try-it-out"-Button benutzen. Das Textfeld ist mit einem Beispiel befüllt und kann nach Belieben umgeändert werden.

## Schemata

Im unteren Teil dieser Swagger-API-Beschreibung finden Sie das Datenmodell des GeospatialAnalyzers detailliert aufgelistet. Dort finden Sie die genutzten Datentypen und Beispiele zum besseren Verständnis.

## Maschinenlesbare API-Spezifikation

Die maschinenlesbare API-Spezifikation steht als `openapi.json` und `openapi.yaml` unter der API-Versionsroute bereit. Zum Beispiel:
`https://example.com/v1/openapi.json` und `https://example.com/v1/openapi.yaml`

Alternativ stehen die dynamischen Suffixe `-json` und `-yaml` zur Verfügung. Zum Beispiel: `https://example.com/api-json` und `https://example.com/api-yaml`
