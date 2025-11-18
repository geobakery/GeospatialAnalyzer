# nearestNeighbour - API Call

In this document we will describe important and good-to-know facts about the nearestNeighbour service

## Functionality

Returns all features that are within a certain distance of the transferred geometry. The number of features returned can be limited using the count parameter. The features are returned in ascending order of distance from the transferred geometry.

## Examples

Post-call http://localhost:3000/v1/nearestNeighbour with JSON body:

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
            [15.75, 51.07],
            [15.77, 51.08],
            [15.79, 51.07],
            [15.8, 51.08],
            [15.75, 51.07]
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
        "coordinates": [15.75, 51.07]
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
          [15.75, 51.07],
          [15.79, 51.18]
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
        "x": 413093.3077572279,
        "y": 5659110.3644715585,
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
  "outputFormat": "geojson",
  "outSRS": 4326
}
```

## Known Limitations - Work in progres

- Currently, unsupported user parameter
  - buffer
- Complete parameter validation
- API token authentication

## Known Limitations - Not planned to implement

- Unsupported geo-types in GeoJSON
  - MultiPolygon
  - MultiLineString
  - MultiPoint
  - GeometryCollection
