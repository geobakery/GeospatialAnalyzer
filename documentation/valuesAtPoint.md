# ValuesAtPoint - API Call

In this document we will describe important and good-to-know facts about the valuesAtPoint service.

## Functionality

Returns values for the transferred geometry.

For a **Point**, the service returns the value at the given location.

For a **LineString**, the service samples points along the line (every 10m) and returns the value at their given location
(ordered by their location). Also the minimum, maximum, and average value is given.

## Examples

Post-call http://localhost:3000/v2/valuesAtPoint with JSON body:

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
  "topics": ["hoehe_r"],
  "returnGeometry": false,
  "outputFormat": "geojson",
  "outSRS": 4326
}
```

### LineString

```json
{
  "inputGeometries": [
    {
      "type": "Feature",
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [13.786, 51.062],
          [13.788, 51.063]
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

```json
{
  "heights": {
    "min": 248.1,
    "max": 249.4,
    "avg": 248.7,
    "points": [
      {
        "index": 0,
        "height": 248.2
      },
      {
        "index": 1,
        "height": 248.7
      },
      {
        "index": 2,
        "height": 249.1
      }
    ]
  }
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
  "topics": ["hoehe_r"],
  "returnGeometry": false,
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
    ```json
    {
      "__topicsConfig__": [
        ...
        {
          "identifiers": ["sn_hoehe_r", "hoehe_r"],
          ...
          "__valueMetadata__": {
            "unit": "m",
            "verticalDatum": "DHHN2016"
          }
          ...
        }
        ...
      ]
    }
    ```
  - **or** per-source properties:
    ```json
    {
      "__topicsConfig__": [
        ...
        {
          "identifiers": ["sn_hoehe_r", "hoehe_r"],
          ...
          "__source__": {
            "name": "gelaendehoehe_dgm",
            ...
            "unit": "m",
            "verticalDatum": "DHHN2016"
          }
          ...
        }
        ...
      ]
    }
    ```

  If a per-source property is present, it overrides the corresponding topic-level metadata.

  You can also take a look at the provided `topic.json` in the topic `hoehe_r`. The properties are defined at the topic-level here.

## Known Limitations - Not planned to implement

- Unsupported geo-types in GeoJSON
  - MultiPolygon
  - MultiLineString
  - MultiPoint
  - GeometryCollection
