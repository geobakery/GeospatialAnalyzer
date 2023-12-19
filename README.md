## Prerequisites
You need `node.js` with version v16 or higher installed on your machine.
For example you can run following [guide](https://learn.microsoft.com/de-de/windows/dev-environment/javascript/nodejs-on-windows) for windows.

You also need `pnpm` as package manager. Check the installation [guide](https://pnpm.io/installation)

You need a database connection, as described in the next section

## Database
You need an accessible database connection to be able to querying.
The database requires to have the schema from the `GeoBakery` repository.
Inside `.env` are the necessary connection parameter. They can be replaced by a local `.env.dev` file.
This file overwrites the base settings and will be ignored by git, so your connection data stays local.

## Installation

```bash
$ pnpm install
```

## Running the app

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```

## Browser
Navigate to [localhost:3000/v1](localhost:3000/v1) to check out the "Hello World" greeting.

Navigate to [localhost:3000/api](localhost:3000/api) to check out the SwaggerUI OpenAPI documentation.

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
Navigate to [localhost:3000](localhost:3000) to check out the "Hello World" greeting.\

Changes inside the `src/` directory will be directly synced with the docker volume. So the backend-API always has the most current state.

### Troubleshooting
If you update your `package.json`, change your docker files, have down changes to your database, or other problems that lead to a problematic
start of your docker container; do following: \
(<b> Beware this will delete all your database data <b>) 

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
Navigate to [localhost:5050](localhost:5050) to check out PgAdmin4.

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

Nest is [MIT licensed](LICENSE).
