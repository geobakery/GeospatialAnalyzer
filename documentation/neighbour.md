# nearestNeighbour - API Call
In this document, we will describe important and good-to-know facts about the nearestNeighbour service

## Examples
Post-call http://localhost:3000/v1/nearestNeighbour with JSON body: 

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
  "topics": ["verw_kreis_f"]
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
  "topics": ["verw_kreis_f", "verw_land_f"]
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
  "topics": ["verw_kreis_f"]
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
  "topics": ["verw_kreis_f"],
  "returnGeometry": true
}
```

## Known Limitations - Work in progres

- GeoJSON feature collections aren't supported (currently array of single feature)
- Currently, unsupported user parameter
  - timeout
  - buffer
  - maxDistanceToNeighbour
- Currently, user parameter with known bugs
  - outSRS
    - returnGeometry has to be true, or transfer throws error of valid coordinates
  - outputFormat
    - returnGeometry has to be true, or transfer throws error of valid coordinates
- Complete parameter validation
- add different database support
- Currently, only basic Testcases
- API token authentication


## Known Limitations - Not planned to implement
- Unsupported geo-types in GeoJSON
  - MultiPolygon
  - MultiLineString
  - MultiPoint
  - GeometryCollection
