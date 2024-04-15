
[![en](https://img.shields.io/badge/lang-en-red.svg)](./README.md)
[![deu](https://img.shields.io/badge/lang-deu-green.svg)](./README-german.md)
- [] Logo

## GeospatialAnalyzer

This is an Open-Source-Project from Landesamt für Geobasisinformation Sachsen (GeoSN) with friendly development support from con terra GmbH.

GeospatialAnalyzer is a Node.js based HTTP-API using NestJS, TypeORM, fastify, OpenAPI, Swagger and more. 

The API can be integrated into electronic processes, such as external applications and specialised procedures.

It enables the transfer of geo-objects in the form of coordinates to check them against certain data themes using spatial tests.
The response contains attributes of the objects found and optionally their geometry.

In this way its possible to automatically determine, for example, in which district or on which parcel a transferred object is located.

For more information have a look in the documentation.

### Key features
- Generic interoperability and interface architecture
- Fundamental support for several databases
- Built-in Docker deployment capability
- Integrated Swagger UI documentation
- Focus on performance
- Simple and customizable datasource configuration
- Support GeoJSON and EsriJSON as input and transformation into the other format
- Support for different KRS
- Support raster data also as a tile set
- Return of the taken geometry is possible
- Unit- and E2E-Tests

### Prebuild interfaces (spatial tests)
- within
- intersect
- nearest-neighbour
- valuesAtPoint
- transform
- health

## Prerequisites
You need `node.js` with version v16 or higher installed on your machine.
For example, you can run following [guide](https://learn.microsoft.com/de-de/windows/dev-environment/javascript/nodejs-on-windows) for windows.
You also need `pnpm` as package manager. Check the installation [guide](https://pnpm.io/installation).
You need a database connection, as described in the next section.

## User- and Developer-Area

Please have a look to our comprehensive area for more information about installing and contributing something to this project.

[Installation guide](./README-development.md#prerequisite)

[Informations for contributors](./README-development.md#contribution)

## License
GPL 

## Contact

This project was developed by Landesamt für Geobasisinformation Sachsen and con terra GmbH.

Responsible person: Sebe Weiß
Email: servicedesk@geosn.sachsen.de   
