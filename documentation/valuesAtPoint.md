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
