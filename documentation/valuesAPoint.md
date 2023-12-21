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


## Known Limitations
- Only GeoJSON input will be accepted
  - Multiple single feature, but no feature collections
- Unsupported geo-types (not planned)
  - MultiPolygon
  - MultiLineString
  - MultiPoint
  - GeometryCollection
- Only `EPSG:25833` is supported
- Only `inputGeometries` & `topics` are considered as parameter

## Work In Progress
- implement most known limitations
- add different database support than PostGIS