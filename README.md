## Prerequisites
You need `node.js` with version v16 or higher installed on your machine.
For example you can run following [guide](https://learn.microsoft.com/de-de/windows/dev-environment/javascript/nodejs-on-windows) for windows.

You also need `pnpm` as package manager. Check the installation [guide](https://pnpm.io/installation)

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
Navigate to [localhost:3000](localhost:3000) to check out the "Hello World" greeting.

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

## License

Nest is [MIT licensed](LICENSE).
