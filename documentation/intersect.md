# Intersect - API Call
In this document, we will describe important and good-to-know facts about the intersection service

## Examples
Post-call http://localhost:3000/v1/intersect with JSON body: 

### Polygon
```json
{
  "inputGeometries": [{
    "type": "Feature",
    "geometry": {
      "type": "Polygon",
      "crs": {
        "type": "name",
        "properties": {
          "name": "EPSG:25833"
        }
      },
      "coordinates": [[
        [
          414719.40307246643,
          5656632.0332482075
        ],
        [
          417165.3928695737,
          5656632.0332482075
        ],
        [
          417165.3928695737,
          5654797.540900376
        ],
        [
          414719.40307246643,
          5654797.540900376
        ],
        [
          414719.40307246643,
          5656632.0332482075
        ]
      ]
      ]
    },
    "properties": {
      "name": "example"
    }
  }],
  "topics": ["verw_kreis_f"],
  "error": "",
  "timeout": 60000
}
```

### Point
```json
{
  "inputGeometries": [{
    "type": "Feature",
    "geometry": {
      "type": "Point",
      "crs": {
        "type": "name",
        "properties": {
          "name": "EPSG:25833"
        }
      },
      "coordinates": [411967, 5659861]
    },
    "properties": {
      "name": "example"
    }
  }],
  "topics": ["verw_kreis_f", "verw_land_f"],
  "error": "",
  "timeout": 60000
}
```

### Line
```json
{
  "inputGeometries": [{
    "type": "Feature",
    "geometry": {
      "type": "LineString",
      "crs": {
        "type": "name",
        "properties": {
          "name": "EPSG:25833"
        }
      },
      "coordinates": [ [414872.2774347855, 5651434.304929351],[426184.9802464067, 5655256.163987332] ]
    },
    "properties": {
      "name": "example"
    }
  }],
  "topics": ["verw_kreis_f"],
  "error": "",
  "timeout": 60000
}
```

## Known Limitations
- Only GeoJSON input will be accepted
  - Multiple single feature, but no feature collections
- Unsupported geo-types
  - MultiPolygon
  - MultiLineString
  - MultiPoint
  - GeometryCollection
- Only `EPSG:25833` is supported
- Only `inputGeometries` & `topics` are considered as parameter

## Work In Progress
- implement most known limitations
- add different database support than PostGIS