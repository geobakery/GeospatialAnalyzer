# nearestNeighbour - API Call

In this document we will describe important and good-to-know facts about the nearestNeighbour service

## Functionality

Returns all features that are within a certain distance of the transferred geometry. The number of features returned can be limited using the count parameter. The features are returned in ascending order of distance from the transferred geometry.
An optional buffer around each input geometry is also supported. 
Using the buffer parameter, its distance can be entered in meters.

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
  "buffer": 100,
  "returnBufferGeometry": false
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
  "buffer": 100,
  "returnBufferGeometry": false
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
  "buffer": 100,
  "returnBufferGeometry": false
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
  "buffer": 100,
  "returnBufferGeometry": false
}
```

## Known Limitations - Work in progres

- Complete parameter validation
- API token authentication

## Known Limitations - Not planned to implement

- Unsupported geo-types in GeoJSON
  - MultiPolygon
  - MultiLineString
  - MultiPoint
  - GeometryCollection

- Accuracy of buffer is limited (10cm)
  - polygonal approximation using quadSegs (count of segments per quarter circle)
  - count depends on buffer distance (so max. error from "real" buffer is 10cm)
  - max. 256 quadSegs (max. error of 10cm until buffer distance of 21km)