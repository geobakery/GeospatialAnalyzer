# Intersect - API Call

In this document we will describe important and good-to-know facts about the intersection service.

## Functionality

Returns all features that are touched by the transferred geometries.

## Examples

Post-call http://localhost:3000/v1/intersect with JSON body:

### Polygon

```json
{
  "inputGeometries": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [13.7702, 51.0345],
            [13.7702, 51.0294],
            [13.7853, 51.0294],
            [13.7853, 51.0345],
            [13.7702, 51.0345]
          ]
        ]
      },
      "properties": {
        "name": "example"
      }
    }
  ],
  "topics": ["kreis_f"],
  "returnGeometry": false,
  "outputFormat": "geojson",
  "outSRS": 4326
}
```

### Point

```json
{
  "inputGeometries": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [13.7795, 51.0303]
      },
      "properties": {
        "name": "example"
      }
    }
  ],
  "topics": ["kreis_f", "land_f"],
  "returnGeometry": false,
  "outputFormat": "geojson",
  "outSRS": 4326
}
```

### Line

```json
{
  "inputGeometries": [
    {
      "type": "Feature",
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [13.7695, 51.0296],
          [13.7842, 51.0339]
        ]
      },
      "properties": {
        "name": "example"
      }
    }
  ],
  "topics": ["kreis_f"],
  "returnGeometry": false,
  "outputFormat": "geojson",
  "outSRS": 4326
}
```

### EsriJSON Point

```json
{
  "inputGeometries": [
    {
      "geometry": {
        "x": 414418,
        "y": 5653903,
        "spatialReference": {
          "wkid": 25833
        }
      },
      "attributes": {
        "name": "testname"
      }
    }
  ],
  "topics": ["kreis_f"],
  "returnGeometry": false,
  "outputFormat": "esrijson",
  "outSRS": 25833
}
```

## Known Limitations - Not planned to implement

- Unsupported geo-types in GeoJSON
  - MultiPolygon
  - MultiLineString
  - MultiPoint
  - GeometryCollection
