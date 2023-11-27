# Transform - API Call
In this document, we will describe important and good-to-know facts about the transform service

## Examples
Post-call http://localhost:3000/v1/transformGeoJSONToEsriJSON with JSON body:

### LineString
```json
{
  "geoJsonArray": [
    {
      "type": "Feature",
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            102,
            0
          ],
          [
            103,
            1
          ],
          [
            104,
            0
          ],
          [
            105,
            1
          ]
        ]
      },
      "properties": {
        "BEMERK": " ",
        "DES": "Freistaat",
        "GEN": "Sachsen",
        "OBJECTID": 13,
        "RAU_RS": "146120000000",
        "RS": "14",
        "searchfield": "Sachsen (Freistaat)"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            102,
            0
          ],
          [
            103,
            1
          ],
          [
            104,
            0
          ],
          [
            105,
            1
          ]
        ]
      },
      "properties": {
        "BEMERK": " ",
        "DES": "Land",
        "GEN": "Sachsen-Anhalt",
        "OBJECTID": 14,
        "RAU_RS": "150030000000",
        "RS": "15",
        "searchfield": "Sachsen-Anhalt (Land)"
      }
    }
  ],
  "epsg": "3035"
}
```

### Point
```json
{
  "geoJsonArray": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          125.6,
          10.1
        ]
      },
      "properties": {
        "name": "Dinagat Islands"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          125.6,
          10.1
        ]
      },
      "properties": {
        "name": "Dinagat Islands"
      }
    }
  ],
  "epsg": "3035"
}
```
Post-call http://localhost:3000/v1/transformEsriJSONToGeoJSON with JSON body:

### LineString
```json
{
  "esriJsonArray": [
    {
      "geometry": {
        "paths": [
          [
            [
              13427950.015829453,
              3459965.6206572256
            ],
            [
              13406148.332586572,
              3681758.239028376
            ],
            [
              13512947.638406614,
              3715213.322036697
            ],
            [
              13484905.494770989,
              3938770.4241306414
            ]
          ]
        ],
        "spatialReference": {
          "wkid": "3035"
        }
      },
      "attributes": {
        "BEMERK": " ",
        "DES": "Freistaat",
        "GEN": "Sachsen",
        "OBJECTID": 13,
        "RAU_RS": "146120000000",
        "RS": "14",
        "searchfield": "Sachsen (Freistaat)"
      }
    },
    {
      "geometry": {
        "paths": [
          [
            [
              13427950.015829453,
              3459965.6206572256
            ],
            [
              13406148.332586572,
              3681758.239028376
            ],
            [
              13512947.638406614,
              3715213.322036697
            ],
            [
              13484905.494770989,
              3938770.4241306414
            ]
          ]
        ],
        "spatialReference": {
          "wkid": "3035"
        }
      },
      "attributes": {
        "BEMERK": " ",
        "DES": "Land",
        "GEN": "Sachsen-Anhalt",
        "OBJECTID": 14,
        "RAU_RS": "150030000000",
        "RS": "15",
        "searchfield": "Sachsen-Anhalt (Land)"
      }
    }
  ]
}
```

### Point
```json
{
  "esriJsonArray": [
    {
      "geometry": {
        "x": 12879178.72502107,
        "y": 7470965.153461802,
        "spatialReference": {
          "wkid": "3035"
        }
      },
      "attributes": {
        "name": "Dinagat Islands"
      }
    },
    {
      "geometry": {
        "x": 12879178.72502107,
        "y": 7470965.153461802,
        "spatialReference": {
          "wkid": "3035"
        }
      },
      "attributes": {
        "name": "Dinagat Islands"
      }
    }
  ]
}
```

## Known Limitations
- Both GeoJSON and EsriJSON have separate services
    - For GeoJSON an EPSG code and an Array with GeoJSON objects must be input
    - For EsriJSON an Array with EsriJSON objects must be input and it will always be converted to EPSG:4326
    - GeoJSON only supports EPSG:4326
- Unsupported geo-types
    - MultiPolygon
    - MultiLineString
    - MultiPoint
    - GeometryCollection
- Expected GeoJSON and EsriJSON can be seen in swagger examples and DTO schema definitions

## Work In Progress
- testing
