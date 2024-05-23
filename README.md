[![en](https://img.shields.io/badge/lang-en-red.svg)](./README.md)
[![deu](https://img.shields.io/badge/lang-deu-green.svg)](./README.de.md)


# GeospatialAnalyzer

This is an Open-Source-Project from Landesamt für Geobasisinformation Sachsen (GeoSN) with friendly development support from con terra GmbH.

GeospatialAnalyzer is a Node.js based HTTP-API using NestJS, TypeORM, fastify, OpenAPI, Swagger and more.

The API can be integrated into different data processing and information systems, such as applications and specialised procedures.

It enables the transfer of geo-objects in the form of coordinates to check them against certain data topics using spatial tests.
The response contains attributes of the objects found and optionally their geometry. In this way its possible to automatically determine, for example, in which district or on which parcel a transferred object is located.

For more information have a look in the documentation.

## Get Started

(1) Clone the repository 
> git clone https://github.com/geobakery/GeospatialAnalyzer.git && cd GeospatialAnalyzer

(2) Install the dependencies
> pnpm install

(3) Configure your env.dev and topic.json 

(4) Provide a database connection and the required configuration

(5) Start development server
> pnpm run dev

(6) Open 
> http://localhost:3000/api
to show the SwaggerUI

## Key features

- Generic interoperability and interface architecture
- Fundamental support for several databases
- Built-in Docker deployment capability
- Integrated Swagger UI documentation
- Focus on performance
- Simple and customizable datasource configuration
- Support GeoJSON and EsriJSON as input and output 
- Transformation into the other format
- Support for different CRS
- Support raster data also as tile set
- It is possible to return the geometry
- Unit- and E2E-Tests

## Interfaces

- [within](documentation/within.md)
- [intersect](documentation/intersect.md)
- [nearest-neighbour](documentation/neighbour.md)
- [valuesAtPoint](documentation/valuesAtPoint.md)
- [transform](documentation/transform.md)
- [health](documentation/health.md)
- [topics](documentation/topics.md)

# Prerequisites

[![PNPM](https://img.shields.io/badge/pnpm-%234a4a4a.svg?style=for-the-badge&logo=pnpm&logoColor=f69220)](https://pnpm.io/installation)
[![NodeJS](https://img.shields.io/badge/nodejs-_version%20%3E=%2016-red)](https://nodejs.org/en/download/package-manager)

or
[![(Docker)](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)](https://docs.docker.com/get-docker/)


# User- and Developer-Area

Please have a look at our comprehensive section for more information on how to install and contribute to this project.

[Installation guide](./README.development.md#prerequisites)

[Informations for contributors](./README.development.md#contribution)

# License

[GPL v3](./LICENSE)

# Contact

This project was developed by Landesamt für Geobasisinformation Sachsen (GeoSN) and con terra GmbH.

Responsible person: Sebe Weiß (GeoSN)

E-Mail: servicedesk@geosn.sachsen.de
