# ValuesAtGrid - API Call

In this document we will describe important and good-to-know facts about the valuesAtGrid service.

## Functionality

Returns values of a grid that is covered by the transferred geometry.

For a **Point**, the service returns the value at the given location.

For a **LineString**, the service samples points along the line at 10-meter intervals between the vertices. The value is retrieved at each point's location (vertices and interpolated). The results are returned as a profile, consisting of these points in order along the line. Each point includes its grid value, an indicator of whether it is a vertex, its location and its chainage (distance along the line) in meters. In addition, the response provides statistics of the grid values (minimum, maximum, sum, mean, standard deviation, count of points, and the count of points with and without a value).

For a **Polygon**, the service calculates statistics of the cells, that are covered by the polygon.
It returns the minimum, maximum (and the locations where they occur), sum, mean, standard deviation, count of cells, and the count of cells with and without a value.
The Polygon must not be complex (self-crossing).
The accuracy depends on the used PostGIS version (if parameter `touched` of ST_Clip is supported). A PostGIS version less than 3.5 excludes pixels where the center of the pixel is not covered by the Polygon (less accurate).

## Examples

Post-call http://localhost:3000/v2/valuesAtPoint with JSON body:

### Point

#### Request

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

#### Response

```json
[
  {
    "type": "Feature",
    "geometry": null,
    "properties": {
      "__name": "gelaendehoehe_dgm",
      "height": 115.64108276367188,
      ...
    }
  },
  {
    "type": "Feature",
    "geometry": null,
    "properties": {
      "__name": "oberflaechenhoehe_dom",
      "height": 127.56602478027344,
      ...
    }
  }
]
```

### LineString

#### Request

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

#### Response

```json
[
    {
        "type": "Feature",
        "geometry": null,
        "properties": {
            "__name": "gelaendehoehe_dgm",
            "valueStats": {
                "min": 371.94775390625,
                "max": 372.6474304199219,
                "sum": 1116.8427124023438,
                "mean": 372.28090413411456,
                "stddev": 0.28661504598660276,
                "count": 4,
                "countWithValue": 2,
                "countNoValue": 2
            },
            "valueProfile": [
                {
                    "index": 0,
                    "value": 371.94775390625,
                    "isVertex": true,
                    "chainageMeters": 0
                },
                {
                    "index": 1,
                    "value": null,
                    "isVertex": false,
                    "chainageMeters": 10
                },
                ...
            ],
            ...
        }
    },
    {
        "type": "Feature",
        "geometry": null,
        "properties": {
            "__name": "oberflaechenhoehe_dom",
            "valueStats": {
                "min": 373.4881286621094,
                "max": 395.2237548828125,
                "sum": 1156.7366638183594,
                "mean": 385.5788879394531,
                "stddev": 9.04050713118875,
                "count": 4,
                "countWithValue": 2,
                "countNoValue": 2
            },
            "valueProfile": [
                {
                    "index": 0,
                    "value": 395.2237548828125,
                    "isVertex": true,
                    "chainageMeters": 0
                },
                {
                    "index": 1,
                    "value": null,
                    "isVertex": false,
                    "chainageMeters": 10
                },
                ...
            ],
            ...
        }
    }
]
```

### Polygon

#### Request

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

#### Response

```json
[
    {
        "type": "Feature",
        "geometry": null,
        "properties": {
            "__name": "gelaendehoehe_dgm",
            "valueStats": {
                "min": 364.18768310546875,
                "max": 398.1256103515625,
                "sum": 4540097.425750732,
                "mean": 377.1471528286038,
                "stddev": 7.874672024958552,
                "count": 24096,
                "countWithValue": 12038,
                "countNoValue": 12058
            },
            ...
        }
    },
    {
        "type": "Feature",
        "geometry": null,
        "properties": {
            "__name": "oberflaechenhoehe_dom",
            "valueStats": {
                "min": 364.40093994140625,
                "max": 426.77252197265625,
                "sum": 4745363.548461914,
                "mean": 393.3817084027119,
                "stddev": 14.894816949577747,
                "count": 24096,
                "countWithValue": 12063,
                "countNoValue": 12033
            },
            ...
        }
    }
]
```

### EsriJSON Point

#### Request

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

#### Response

```json
[
  {
    "attributes": {
      "__name": "gelaendehoehe_dgm",
      "height": 115.6739730834961,
      ...
    }
  },
  {
    "attributes": {
      "__name": "oberflaechenhoehe_dom",
      "height": 128.80447387695312,
      ...
    }
  }
]
```

### EsriJSON LineString

#### Request

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

#### Response

```json
[
  {
    "attributes": {
      "__name": "gelaendehoehe_dgm",
      "valueStats": {
        "min": 371.94775390625,
        "max": 372.6474304199219,
        "sum": 1116.8427124023438,
        "mean": 372.28090413411456,
        "stddev": 0.28661504598660276,
        "count": 4,
        "countWithValue": 2,
        "countNoValue": 2
      },
      "valueProfile": [
        {
          "index": 0,
          "value": 371.94775390625,
          "isVertex": true,
          "chainageMeters": 0
        },
        {
          "index": 1,
          "value": null,
          "isVertex": false,
          "chainageMeters": 10
        },
        ...
      ],
      ...
    }
  },
  {
    "attributes": {
      "__name": "oberflaechenhoehe_dom",
      "valueStats": {
        "min": 373.4881286621094,
        "max": 395.2237548828125,
        "sum": 1156.7366638183594,
        "mean": 385.5788879394531,
        "stddev": 9.04050713118875,
        "count": 4,
        "countWithValue": 2,
        "countNoValue": 2
      },
      "valueProfile": [
        {
          "index": 0,
          "value": 395.2237548828125,
          "isVertex": true,
          "chainageMeters": 0
        },
        {
          "index": 1,
          "value": null,
          "isVertex": false,
          "chainageMeters": 10
        },
        ...
      ],
      ...
    }
  }
]
```

### EsriJSON Polygon

#### Request

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

#### Response

```json
[
  {
    "attributes": {
      "__name": "gelaendehoehe_dgm",
      "valueStats": {
        "min": 364.18768310546875,
        "max": 398.1256103515625,
        "sum": 4540097.425750732,
        "mean": 377.1471528286038,
        "stddev": 7.874672024958552,
        "count": 24096,
        "countWithValue": 12038,
        "countNoValue": 12058
      },
      ...
    }
  },
  {
    "attributes": {
      "__name": "oberflaechenhoehe_dom",
      "valueStats": {
        "min": 364.40093994140625,
        "max": 426.77252197265625,
        "sum": 4745363.548461914,
        "mean": 393.3817084027119,
        "stddev": 14.894816949577747,
        "count": 24096,
        "countWithValue": 12063,
        "countNoValue": 12033
      },
      ...
    }
  }
]
```

## Value metadata in responses

- Each returned feature may include two optional properties with value metadata. This is particularly useful for metadata descriptions of elevation data using interface `valuesAtGrid`.
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
