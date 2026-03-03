# Dataset and scripts for docker compose

When running the docker compose dev setup, it will mount some scripts and the `data`-file into the database container. The postgres db in the container will then set itself up with the default dataset. That dataset is compatible for use with the GeospatialAnalyzer backend when the backend is configured with the default `topic.json`. The data is restored from the `data`-file in this repository which is created with [`pg_dump`](https://www.postgresql.org/docs/15/app-pgdump.html) and uses the custom postgres backup file format.

# Dockerfile-hardrestore-without-extensions - Hardrestore database utility image

This directory contains a Dockerfile to generate a database utility container image. It uses the same default dataset used in the docker compose dev setup. It is especially useful for initializing / restoring a database for use with the geospatialanalyzer in an orchestrated and isolated environment (e.g. kubernetes cluster).

This image does not contain any database itself. It takes a [postgres connection string](https://www.postgresql.org/docs/15/libpq-connect.html#LIBPQ-CONNSTRING) pointing to an external database server and restores the default data dump to that database. It will first _wipe clean all relations from the specified database that are also contained in the dump_. Just deploy the image as a container to an environment were it can reach the postgres database and set the `POSTGRES_DB_URI` environment variable with the connection details.

The database specified has to contain the `postgis` and the `postgis_raster` extensions. This image can be used to bring testing data to an existing or by other means automatically created database. It is used for this goal for testing kubernetes deployments with managed postgres clusters, cf. [the kubernetes deployment configuration for the geospatialanalyzer backend](https://github.com/geobakery/gsa-deployment/blob/main/README.md#database-initialization-or-restoration).

Build command (from the parent folder; remove `sql` from both paths if run in this folder):
```bash
docker buildx build -f sql/Dockerfile-hardrestore-without-extensions -t <your-tag> sql/
```

## Building custom utility images

To supply a custom dataset fork the repository and switch out the `data` file in this directory before building the utility Dockerfile. You can use any file compatbile with [`pg_restore`](https://www.postgresql.org/docs/15/app-pgrestore.html).