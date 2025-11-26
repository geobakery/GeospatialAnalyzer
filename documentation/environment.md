# Environment

In this document we will describe important and good-to-know facts about the basic environment.

## Env files

The application uses different `.env` files depending which environment you want to use:

- `.env`: Base `.env` settings, used for production images. DB Connection properties are set either in a local `env.dev` file or in the `docker-compose-(prod).yml` file.
- `.env.dev.sample`: Template file which can be used for creating you own `env.dev` file. This resulting `env.dev` file is than used for the local running node application. Please note: The `.env.dev` file will be ignored for git.
- `.env.test`: File for integrated unit and end-to-end tests. The defined settings are the default values and are loaded via the `test-configuration.helper.ts`. If you want to use another database, you can change the values here.

Creating your own `env.dev` file should include at least the following properties. All other properties are automatically applied from the `.env`. If you would like to change those settings, overwrite them in your `env.dev`.

```text
#Database connection
GEOSPATIAL_ANALYZER_DB_TYPE: postgres
#If docker-compose setup is used, the service name "db" needs to be set
GEOSPATIAL_ANALYZER_DB_HOST: localhost
GEOSPATIAL_ANALYZER_DB_PORT: 5432
GEOSPATIAL_ANALYZER_DB_USERNAME: postgres
GEOSPATIAL_ANALYZER_DB_PASSWORD: geobakery
GEOSPATIAL_ANALYZER_DB_DATABASE: postgres
GEOSPATIAL_ANALYZER_DB_SYNCHRONIZE: false
GEOSPATIAL_ANALYZER_DB_LOGGING: true
#Metrics (optional, defaults to true)
GEOSPATIAL_ANALYZER_METRICS_ENABLED: true
[...]
```

## Topic.json

The `topic.json` contains all your relevant data, that you want to display and the connection source.

```json
{
  "identifiers": ["sn_land_f", "land_f"],
  "title": "Bundesländer und Länder",
  "description": "An Sachsen grenzende Bundesländer und Länder.",
  "__source__": {
    "name": "unused",
    "source": "spatialyzer_demo.verw_land_f",
    "srid": 25833
  },
  "__attributes__": ["bundesland", "land", "name"],
  "__supports__": ["intersect", "within", "nearestNeighbour"]
}
```

## Swagger description

The swagger description in markdown `swagger-descprition.md` will be shown on your swagger OpenAPI page.

## Topic.json special feature

If you want to use more than one database schema, your able to use "**multipleSources**" to list them in your topic.json file.
