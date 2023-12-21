# ValuesAtPoint - API Call
In this document, we will describe important and good-to-know facts about the valuesAtPoint service

## Examples
Post-call http://localhost:3000/v1/valuesAtPoint with JSON body: 

### Point
```json
{
  "inputGeometries": [{
    "type": "Feature",
    "geometry": {
      "type": "Point",
      "coordinates": [13.819230850782265, 51.02066601255865]
    },
    "properties": {
      "name": "example"
    }
  }],
  "topics": ["hoehe2m_r"]
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
