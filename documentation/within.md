# Within - API Call
In this document we will describe important and good-to-know facts about the within service.

## Functionality
Returns all features, where the transferred geometries are completely contained. 

## Examples
Post-call http://localhost:3000/v1/within with JSON body: 

### Polygon
```json
{
  "inputGeometries": [{
    "type": "Feature",
    "geometry": {
      "type": "Polygon",
      "coordinates": [[
        [15.75, 51.07],
        [15.77, 51.08],
        [15.79, 51.07],
        [15.80, 51.08],
        [15.75, 51.07]
      ]
      ]
    },
    "properties": {
      "name": "example"
    }
  }],
  "topics": ["kreis"],
  "returnGeometry": false,
  "outputFormat": "geojson",
  "outSRS": 4326
}
```

### Point
```json
{
  "inputGeometries": [{
    "type": "Feature",
    "geometry": {
      "type": "Point",
      "coordinates": [15.75, 51.07]
    },
    "properties": {
      "name": "example"
    }
  }],
  "topics": ["kreis", "land"],
  "returnGeometry": false,
  "outputFormat": "geojson",
  "outSRS": 4326
}
```

### Line
```json
{
  "inputGeometries": [{
    "type": "Feature",
    "geometry": {
      "type": "LineString",
      "coordinates": [ [15.75, 51.07],[15.79, 51.18]]
    },
    "properties": {
      "name": "example"
    }
  }],
  "topics": ["kreis"],
  "returnGeometry": false,
  "outputFormat": "geojson",
  "outSRS": 4326
}
```

### EsriJSON Point
```json
{
  "inputGeometries": [{
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
  }],
  "topics": ["kreis"],
  "returnGeometry": false,
  "outputFormat": "geojson",
  "outSRS": 4326
}
```

## Known Limitations - Not planned to implement
- Unsupported geo-types in GeoJSON
  - MultiPolygon
  - MultiLineString
  - MultiPoint
  - GeometryCollection
