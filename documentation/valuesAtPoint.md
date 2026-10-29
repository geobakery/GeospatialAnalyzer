# ValuesAtPoint - API Call

In this document we will describe important and good-to-know facts about the valuesAtPoint service.

## Functionality

Returns values of a grid that is covered by the transferred geometry.
Each value is rounded to a count of decimal places provided as optional parameter `decimalPlaces` in __valueMetadata__ for each topic.
In accordance with scientific standards the standard deviation (in the statistics) is rounded to one more decimal place.

For a **Point**, the service returns the value at the given location.

For a **LineString**, the service samples points along the line at 10-meter intervals between the vertices. The value is retrieved at each point's location (vertices and interpolated). The results are returned as a profile, consisting of these points in order along the line. Each point includes its grid value, an indicator of whether it is a vertex, and its chainage (distance along the line) in meters. In addition, the response provides statistics of the grid values (minimum, maximum, summary, mean, standard deviation, count of points, and the count of points with and without a value).

For a **Polygon**, the service calculates statistics of the cells, that are covered by the polygon.
It returns the summary, mean, minimum, maximum and standard deviation of the values and the count of covered pixels with a value.
The Polygon must not be complex (self-crossing).
The accuracy depends on the used PostGIS version (if parameter `touched` of ST_Clip is supported). A PostGIS version less than 3.5 excludes pixels where the center of the pixel is not covered by the Polygon (less accurate).

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
            [13.786, 51.062],
            [13.788, 51.062],
            [13.788, 51.063],
            [13.786, 51.063],
            [13.786, 51.062]
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

### EsriJSON LineString

```json
{
  "inputGeometries": [
    {
      "geometry": {
        "paths": [
          [
            [414418, 5653903],
            [414560, 5654015],
            [414700, 5654100]
          ]
        ],
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

### EsriJSON Polygon

```json
{
  "inputGeometries": [
    {
      "geometry": {
        "rings": [
          [
            [414418, 5653903],
            [414560, 5653903],
            [414560, 5654100],
            [414418, 5654100],
            [414418, 5653903]
          ]
        ],
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
            "decimalPlaces": 1,
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
            "decimalPlaces": 1,
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
