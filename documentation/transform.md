# Transform - API Call

In this document, we will describe important and good-to-know facts about the transform service

## Examples (GeoJSON to EsriJSON)

Post-call http://localhost:3000/v1/transformGeoJSONToEsriJSON with JSON body:

### LineString

```json
{
  "input": [
    {
      "type": "Feature",
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [102, 0],
          [103, 1],
          [104, 0],
          [105, 1]
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
          [106, 0],
          [107, 1],
          [108, 0],
          [109, 1]
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
  "epsg": 3035
}
```

### Point

```json
{
  "input": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [125.6, 10.1]
      },
      "properties": {
        "name": "Dinagat Islands"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [130.5, 15.1]
      },
      "properties": {
        "name": "Dinagat Islands"
      }
    }
  ],
  "epsg": 3035
}
```

## Examples (EsriJSON to GeoJSON)

Post-call http://localhost:3000/v1/transformEsriJSONToGeoJSON with JSON body:

### LineString

```json
{
  "input": [
    {
      "geometry": {
        "paths": [
          [
            [13427950.015829453, 3459965.6206572256],
            [13406148.332586572, 3681758.239028376],
            [13512947.638406614, 3715213.322036697],
            [13484905.494770989, 3938770.4241306414]
          ]
        ],
        "spatialReference": {
          "wkid": 3035
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
            [13589467.309550026, 3975687.6861135554],
            [13554993.932670332, 4200884.870824748],
            [13657172.69050367, 4241323.534731941],
            [13616073.830728564, 4468023.713361271]
          ]
        ],
        "spatialReference": {
          "wkid": 3035
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
  "input": [
    {
      "geometry": {
        "x": 12879178.72502107,
        "y": 7470965.153461802,
        "spatialReference": {
          "wkid": 3035
        }
      },
      "attributes": {
        "name": "Dinagat Islands"
      }
    },
    {
      "geometry": {
        "x": 12220970.73915515,
        "y": 8386804.009809739,
        "spatialReference": {
          "wkid": 3035
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

- None
