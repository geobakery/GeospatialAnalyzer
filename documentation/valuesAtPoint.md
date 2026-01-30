# ValuesAtPoint - API Call

In this document we will describe important and good-to-know facts about the valuesAtPoint service.

## Functionality

Returns the values at the transferred point.

## Examples

Post-call http://localhost:3000/v1/valuesAtPoint with JSON body:

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
  "topics": ["hoehe_r"],
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
  "topics": ["hoehe_r"],
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
  "topics": ["hoehe_r"],
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
  "topics": ["hoehe_r"],
  "returnGeometry": true,
  "outputFormat": "esrijson",
  "outSRS": 25833
}
```

## Value metadata in responses

- Each returned feature may include two optional properties with value metadata. This is particularly useful for metadata descriptions of elevation data using interface `valuesAtPoint`.
  - `__unit`: unit of the value (e.g. "m", "cm").
  - `__verticalDatum`: vertical datum of the value (e.g. "DHHN2016")

- Metadata comes from the configuration in `topic.json` as follows:
  - topic-level metadata:
    ```
    "__valueMetadata__": {
      "unit": "m",
      "verticalDatum": "DHHN2016"
    }
    ```
  - **or** per-source properties:
    ```
    "unit": "m",
    "verticalDatum": "DHHN2016"
    ```

  If a per-source property is present, it overrides the corresponding topic-level metadata.

  You can also take a look at the provided `topic.json` in the topic `hoehe_r`. The properties are defined at the topic-level here.

## Known Limitations - Not planned to implement

- Unsupported geo-types in GeoJSON
  - MultiPolygon
  - MultiLineString
  - MultiPoint
  - GeometryCollection
