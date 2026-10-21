# nearestNeighbour - API Call

In this document we will describe important and good-to-know facts about the nearestNeighbour service

## Functionality

Returns all features that are within a certain distance of the transferred geometry. The number of features returned can be limited using the count parameter. The features are returned in ascending order of distance from the transferred geometry.
The maximum distance of returned features can be restricted using the maxDistanceToNeighbour parameter.
Two optional parameters are available for polygon input geometries to exclude features based on their spatial relationship with the input polygon. `polygonExcludesInnerFeatures` excludes features, that have any part inside the input polygon. `polygonExcludesEntirelyInnerFeatures` excludes features, that are entirely inside the input polygon (geometries that only intersect with the border of the Polygon are not excluded). Both parameters are mutually exclusive (only one of them can be enabled at a time).

## Examples

Post-call http://localhost:3000/v2/nearestNeighbour with JSON body:

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
  "outSRS": 4326,
  "count": 3,
  "maxDistanceToNeighbour": 10000,
  "polygonExcludesInnerFeatures": true,
  "polygonExcludesEntirelyInnerFeatures": false
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
  "outSRS": 4326,
  "count": 3,
  "maxDistanceToNeighbour": 10000,
  "polygonExcludesInnerFeatures": false,
  "polygonExcludesEntirelyInnerFeatures": false
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
  "outSRS": 4326,
  "count": 3,
  "maxDistanceToNeighbour": 10000,
  "polygonExcludesInnerFeatures": false,
  "polygonExcludesEntirelyInnerFeatures": false
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
  "outputFormat": "geojson",
  "outSRS": 4326,
  "count": 3,
  "maxDistanceToNeighbour": 10000,
  "polygonExcludesInnerFeatures": false,
  "polygonExcludesEntirelyInnerFeatures": false
}
```

## Known Limitations - Work in progres

- Unsupported user parameter:
  - buffer
- Complete parameter validation
- API token authentication

## Known Limitations - Not planned to implement

- Unsupported geo-types in GeoJSON
  - MultiPolygon
  - MultiLineString
  - MultiPoint
  - GeometryCollection
