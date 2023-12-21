## Prerequisites
You need `node.js` with version v16 or higher installed on your machine.
For example, you can run following [guide](https://learn.microsoft.com/de-de/windows/dev-environment/javascript/nodejs-on-windows) for windows.
You also need `pnpm` as package manager. Check the installation [guide](https://pnpm.io/installation)
You need a database connection, as described in the next section

## Configuration
The project uses the `.env`, respectively the `env.dev` file for configuring your instance. For local development, use the `env.dev` (added to `.gitignore` by default), which overwrites the default config params.

## Database
You need an accessible database connection for querying the testdata. For the first version, a Postgres (v16) database with PostGIS extension is used. Sample data is stored in the `sql\data` dump and must be imported into your local database for testing.   
The database itself can be set up by three different approaches:
* Set up a database by your own. Follow one of Step-By-Step tutorials for the initial configuration. 
  * Please ensure that the database is accessible by your host. Do not forget to add needed params to the `postgresql.conf` and `pg_hba.conf`
  * Use psql, pgadmin or any other PostgreSQL client for importing the testdata data dump.
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

You need to update one line in your `.env` or `.env.dev` file:
```bash
db_postgres_host: db
db_postgres_password: geobakery
```
This will asure that the database is taken from the docker network and not from your computer. By default, the name of the service becomes the hostname/address of the container within the Docker network.

### Run
Then just run:
```bash
docker compose up
```

3 container (Nest, Postgres, PgAdmin4) will be created. \
Navigate to [http://localhost:3000](localhost:3000) to check out the "Hello World" greeting.\

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
check the corresponding file, e.g. `psql.sh` and ensure that your IDE set the line ending to `LF`. This is necessary, because our docker container use
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

## License
GPL 
