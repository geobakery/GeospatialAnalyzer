## Prerequisites
You need `node.js` with version v16 or higher installed on your machine.
For example, you can run following [guide](https://learn.microsoft.com/de-de/windows/dev-environment/javascript/nodejs-on-windows) for windows.
You also need `pnpm` as package manager. Check the installation [guide](https://pnpm.io/installation)
You need a database connection, as described in the next section

## Configuration
The project uses the `.env`, respectively the `env.dev` file for configuring your instance. For local development, use the `env.dev` (added to `.gitignore` by default), which overwrites the default config params. 

Additional you need to create a `topic.json` file to set your specific topic data. Have a look at `topic-example.json` for an example.
The topic.json is added to the `.gitignore` to save your personal data conventions.

## Database
You need an accessible database connection for querying the testdata. For the first version, a Postgres (v15) database with PostGIS extension is used. Sample data is stored in the `sql\data` dump and must be imported into your local database for testing.   
The database itself can be set up by three different approaches:
* Set up a database by your own. Follow one of Step-By-Step tutorials for the initial configuration. 
  * Please ensure that the database is accessible by your host. Do not forget to add needed params to the `postgresql.conf` and `pg_hba.conf`
  * Do also not forget to install the PostGIS extension:
    ```
    create extension postgis;
    ```
    And if you have problems with missing type 'raster':
     ```
    create extension postgis_raster;
    ```
  * Use psql, pg_restore, pgadmin or any other PostgreSQL client for importing the testdata data dump.
* You can also check the [installation guide](/documentation/postgresql-without-install.md) for setting up and PostgreSQL instance for missing administrator rights. Guide provides an easy step-by-step instructions for setting up the needed environment.
* Use the provided docker environment, which will create the needed database + extension + testdata automatically.

## Installation
Run the following in your shell. Command will download and install all needed dependencies and packages.

```bash
$ pnpm install
```

## Running the app
Run one of the following command to start the service.  The actual scripts and params are defined in the `package.json` file.

Compile and run the service:
```bash
$ pnpm run start
```
Start the service in ``watch mode`` (more information [here](https://docs.nestjs.com/cli/usages#nest-start)), which adds live-reload and debugging  functionalities. For more information about debugging check the corresponding section.
```bash
$ pnpm run start:dev
```

Compile the service for production usage. This does NOT start the actual service.
```bash
$ pnpm run start:prod
```

## Debugging


## Browser
Navigate to [http://localhost:3000/v1](localhost:3000/v1) to check out the "Hello World" greeting.

Navigate to [http://localhost:3000/api](localhost:3000/api) to check out the SwaggerUI OpenAPI documentation.

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
It is possible to run and develop this project with Docker. The docker file will create an instance of the analysis-interface,
a postgres database with postgis and some example data will be available. To comfortably check the database state, pgAdmin4 is included.

### Prerequisite
You need an installed and *running* docker service. For example [Docker Desktop Windows](https://docs.docker.com/desktop/install/windows-install/).

You need to update following lines in your `.env` or `.env.dev` file:
```bash
db_postgres_host: db
db_postgres_password: geobakery
```
This will asure that the database is taken from the docker network and not from your computer. By default, the name of the service becomes the hostname/address of the container within the Docker network.

Assure that, you have created a `topic.json` file. Have a look at [Configuration](#configuration) for details

### Run
Then just run:
```bash
docker compose up
```

3 container (Nest, Postgres, PgAdmin4) will be created. \
Navigate to [http://localhost:3000/v1](localhost:3000/v1) to check out the "Hello World" greeting.\

Changes inside the `src/` directory will be directly synced with the docker volume. So the backend-API always has the most current state.

### Troubleshooting
If you update your `package.json`, change your docker files, have down changes to your database, or other problems that lead to a problematic
start of your docker container; do following: \
(<b> Beware this will delete all your database data </b>)

```bash
docker compose down -v
docker compose up --build
```

### Common Errors

```bash
/bin/bash^M: bad interpreter: No such file or directory
```
check the corresponding file, e.g. `pg_restore.sh` and ensure that your IDE set the line ending to `LF`. This is necessary, because our docker container use
a linux system. Specially for the database, other line ending can lead to execution errors :)

## PgAdmin4
Navigate to [http://localhost:5050](localhost:5050) to check out PgAdmin4.

The credentials are:\
User=admin@admin.com\
Password=pgadmin4

To add your local docker database :

- In the left-hand sidebar, click Servers to expand the Servers menu.
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

run:
```bash
pnpm run start:debug
```

You will see following lines in your IDE:

Debug start: \
<img src="documentation/images/debug_start.png" alt="Debug start"/>

You can connect to the given address (e.g.: ws://127.0.0.1:9229/xxx-xxx-xxx) with a debugger of your choice. 
On most IDE's a click on the address will start a debugger automatically.

Debug view in IDE: \
<img src="documentation/images/debug_view_ide.png" alt="Debug view"/>

In your web browser, visit http://localhost:3000/api. Here you can use the "try it out" Swagger function to execute the 
REST-API.

Swagger UI: \
<img src="documentation/images/swagger_debug.png" alt="Swagger debug"/>

Open the dev-tools (e.g. F12 on many browser) of your web browser and activate the Nodejs dev tools. Here you find the
translated typescript code in source. You can set breakpoints and debug like you are used to.

Nodejs dev tools: \
<img src="documentation/images/devTools_debug.png" alt="Dev tools Nodejs"/>

Also you can call the rest API on your common way as long as you connected to the nodejs-dev tools.

## License
GPL 
