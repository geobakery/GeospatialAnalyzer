[General Readme](./README.md)

# Installation and Debugging

## Prerequisites

You need `Node.js` v24 or higher (although older version might work) installed on your machine.
For example, you can run the following [guide](https://learn.microsoft.com/de-de/windows/dev-environment/javascript/nodejs-on-windows) for windows.
You also need `pnpm` as package manager. Check out the [installation guide](https://pnpm.io/installation).
You need a database connection, as described in the [section _Database_](#database).
If you want to use docker to run this project, you need an installed and _running_ docker service. More Information can be found in [section _Docker_](#docker).

## Configuration

The project uses the `.env` or the `.env.dev` file for configuring your instance. For local development, use the `.env.dev` (added to `.gitignore` by default), which overwrites the default configuration parameters.

Additionally you need to create a `topic.json` file to set your specific topic data. Have a look at `topic-example.json` for an example.
The topic.json is added to the `.gitignore` to save your personal credentials.

Optionally you can set a `swagger-descprition.md` to be shown on your Swagger OpenAPI page. If you don't want to create your own, the example swagger description markdown file will be used to generate it.

## Database

You need an accessible database connection for querying the test data. For the first version, a PostgreSQL (v15) database with the PostGIS extension is used. Sample data is stored in the `sql\data` dump and must be imported into your local database for testing.  
The database itself can be set up using three different approaches:

- Set up a database on your own. Follow one of the step-by-step tutorials for the initial configuration.
  - Please ensure that the database is accessible by your host. Do not forget to add needed parameters to `postgresql.conf` and `pg_hba.conf`
  - Do not forget to install the PostGIS extension:
    ```
    create extension postgis;
    ```
    And if you have problems with missing type 'raster':
    ```
    create extension postgis_raster;
    ```
  - Use psql, pg_restore, pgadmin or any other PostgreSQL client for importing the test data dump.
- You can also check the [installation guide](/documentation/postgresql-without-install.md) for setting up a PostgreSQL instance for missing administrator rights. The guide provides an easy step-by-step instructions for setting up the needed environment.
- Use the provided docker environment, which will create the needed database + extension + test data automatically.

### Add new database support

If you want to support another database, read more in [Database support](/documentation/database-support.md)

## Installation

Run the following command in your shell. This will download and install all needed dependencies and packages.

```bash
$ pnpm install
```

## Running the app

Run one of the following commands to start the service. The current scripts and parameters are defined in the `package.json` file.

Compile and run the service:

```bash
$ pnpm run start
```

Start the service in `watch mode` (more information [here](https://docs.nestjs.com/cli/usages#nest-start)), which adds live-reload and debugging functionalities. For more information about debugging check the corresponding section.

```bash
$ pnpm run start:dev
```

Compile the service for production usage. This does NOT start the actual service.

```bash
$ pnpm run start:prod
```

## Browser

Navigate to [http://localhost:3000/api](http://localhost:3000/api) to check out the SwaggerUI OpenAPI documentation.

Navigate to [http://localhost:3000/api-json](http://localhost:3000/api-json) to check out the SwaggerUI OpenAPI documentation in json format.

## Test

```bash
# unit tests
$ pnpm run test

# e2e tests
$ pnpm run test:e2e

# test coverage
$ pnpm run test:cov
```

## Docker

It is possible to run and develop this project with Docker. The docker file will create an instance of the analysis-interface, a PostgreSQL database with PostGIS and some example data will be available. To comfortably check the database state, pgAdmin4 is included.
The file structure is based on the following:

```
GeospatialAnalyzer/
├── docker-compose.yml              # Development
├── docker-compose-prod.yml         # Production (hardened)
├── Dockerfile                      # Development image
├── Dockerfile-prod                 # Production image
```

### Docker Prerequisite

You need an installed and _running_ docker service. For example [Docker Desktop Windows](https://docs.docker.com/desktop/install/windows-install/).

You need to update the following lines in your `.env` or `.env.dev` file:

```bash
db_postgres_host: db
db_postgres_password: geobakery
```

This will ensure that the database is accessed from the docker network and not from your local storage. By default, the name of the service becomes the hostname/address of the container within the Docker network.

Ensure that you have created a `topic.json` file. Have a look at [Configuration](#configuration) for details.

### Run

Run:

```bash
docker compose up
```

Three containers (NestJS, PostgreSQL, PgAdmin4) will be created.

Changes inside the `src/` directory will be directly synced with the docker volume. So the backend-API always has the most current state.

### Dev / Prod container

To ensure that you use the developer container run:

```bash
docker compose -f docker-compose.yml up --build
```

If you want to run the production build, call:

```bash
docker compose -f docker-compose-prod.yml up --build
```

### Troubleshooting

If you update your `package.json`, change your docker files or have other problems that lead to a problematic start of your docker container; do the following: \
(<b> Beware, this will delete all manually added database data! </b>)

```bash
docker compose down -v
docker compose up --build
```

### Common Errors

```bash
/bin/bash^M: bad interpreter: No such file or directory
```

Check the corresponding file, e.g. `pg_restore.sh` and ensure that your IDE sets the line ending to `LF`. This is necessary, because our docker container uses
a Linux system. Especially for the database, other End of Line variations can lead to execution errors. :)

---

`ERROR [TypeOrmModule] Unable to connect to the database. Retrying (1)...`

Ensure, that you have edited your `.env` files. These files are synchronized, but are only read at the start of the application.
Therefore, you need to restart the container with `docker compose up`.

## PgAdmin4

Navigate to [http://localhost:5050](http://localhost:5050) to check out PgAdmin4.

The credentials are:
User=admin@admin.com
Password=pgadmin4

To add to your local docker database:

- On the left-hand sidebar, click Servers to expand the Servers menu.
- Right-click on Servers and select Register -> Server.
- In the General tab of the Create - Server dialog, you can give the server a name of your choice.
- In the Connection tab, fill in the following details:
  - Host name/address: db
  - Port: 5432
  - Maintenance database: postgres
  - Username: postgres
  - Password: geobakery
- Click Save to save the server configuration.

## Debug

Run:

```bash
pnpm run start:debug
```

You will see the following lines in your IDE:

Debug start: \
<img src="documentation/images/debug_start.png" alt="Debug start"/>

You can connect to the given address (e.g.: ws://127.0.0.1:9229/xxx-xxx-xxx) with a debugger of your choice.
On most IDE's a click on the address will start a debugger automatically.

Debug view in IDE: \
<img src="documentation/images/debug_view_ide.png" alt="Debug view"/>

In your web browser, visit [http://localhost:3000/api](http://localhost:3000/api). Here you can use the "try it out" Swagger function to execute the
REST-API.

Swagger UI: \
<img src="documentation/images/swagger_debug.png" alt="Swagger debug"/>

Open the dev-tools (e.g. F12 on many browsers) of your web browser and activate the Node.js dev tools.

Node.js dev tools: \
<img src="documentation/images/devTools_debug.png" alt="Dev tools Node.js"/>

In the sources tab you can navigate to the TypeScript source files to set breakpoints and debug like you are used to.
Note: The JavaScript that is actually run is in the `dist` folder, but thanks to source maps we can work with the TypeScript files.

<img src="documentation/images/devTools_debug_sourceMap.png" alt="Dev tools TypeScript"/>

Also you can call the rest API in your preferred way as long as you are connected to Node.js-dev tools.

# Contribution

## What you need to consider for co-development

Thank you for considering contributing to our project! We appreciate your help in making it better!

(1) Clone the repository and create a new branch for your feature or bug fix.

(2) Make your changes and ensure they adhere to the project's coding style.

(3) Commit your changes with an informative summary and description.

(4) Push your branch to your forked repository.

(5) Submit a pull request to the main branch with a clear description of your changes.


Please note the retention of the license for further development.

## License

[GPL v3](./LICENSE)
