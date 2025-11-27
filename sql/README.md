# GeospatialAnalyzer Database Container Images

This directory contains Dockerfiles for two different database utility container images. Both provide the same default dataset compatible for use with the GeospatialAnalyzer backend when it is configured with the default `topic.json`. The data is restored from the `data`-file in this repository which is created with [`pg_dump`](https://www.postgresql.org/docs/15/app-pgdump.html) and uses the custom postgres backup file format.

Currently both images are based on postgres 15.

The images are suited for different use cases:

## Dockerfile

This image contains a full postgis db server that can be used as database for the backend. It is used for the developer environment provided by the `docker-compose.yaml`.

Build command (from the parent folder; adjust the pathing if run from this folder directly):
```bash
docker buildx build -t <your-tag> sql/
```

## Dockerfile-hardrestore-without-extensions

This image does not contain any database itself. It takes a postgres database connection string pointing to an external database server and restores the default data dump to that database. It will first _wipe clean all relations from the specified database that are also contained in the dump_. 

The database specified has to contain the `postgis` and the `postgis_raster` extensions. This image can be used to bring testing data to an existing or by other means automatically created database. It is used for this goal for testing kubernetes deployments with managed postgres clusters, cf. [the kubernetes deployment configuration for the geospatialanalyzer backend](https://github.com/geobakery/gsa-deployment/blob/main/README.md#database-initialization-or-restoration).

Build command (from the parent folder; remove `sql` from both paths if run in this folder):
```bash
docker buildx build -f sql/Dockerfile-hardrestore-without-extensions -t <your-tag> sql/
```

## Building custom images

To supply a custom dataset fork the repository and switch out the `data` file in this directory before building one of the given Dockerfiles. You can use any file compatbile with [`pg_restore`](https://www.postgresql.org/docs/15/app-pgrestore.html).