# Environment
In this document, we will describe important and good-to-know facts about the basic environment.

## Env files
Consider the `.env` file template for your own `.env.dev`. The dev file will be ignored for git.

```text
#database connection
geospatial_analyzer_db_type: postgres
geospatial_analyzer_db_host: db
geospatial_analyzer_db_port: 5432
geospatial_analyzer_db_username: postgres
geospatial_analyzer_db_password: geobakery
geospatial_analyzer_db_database: postgres
geospatial_analyzer_db_synchronize: false
geospatial_analyzer_db_logging: true
[...]
```

## Topic.json
The `topic.json` contains all your relevant data, that you want to display and the connection source.

```json
{
  "identifiers": ["sn_land", "land"],
  "title": "Bundesländer und Länder",
  "description": "An Sachsen grenzende Bundesländer und Länder.",
  "__source__": {
    "name": "unused",
    "source": "spatialyzer_demo.land",
    "srid": 25833
  },
  "__attributes__": [
    "bundesland",
    "land",
    "name"
  ],
  "__supports__": ["intersect", "within", "nearestNeighbour"]
}
```

## Swagger description
The swagger description in markdown `swagger-descprition.md` will be shown at your swagger OpenAPI page. 

``` markdown
this is the REST inspired HTML interface for geospatial analysis

## Github
Visit us on GitHub: [GeospatialAnalyzer](https://github.com/geobakery)

```



