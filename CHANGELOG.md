# Changelog

All notable changes to this project will be documented in this file.

The format follows [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html). Major releases include a `Breaking Changes` section at the top with migration notes.

## [Unreleased]

## [2.0.0] - 2026-05-29

### Highlights

The API base path moves to `/v2/`. Height values from raster topics are now returned in meters (previously centimeters). The `/topics` response includes attributes, and optional value metadata and provider attribution. A new Prometheus `/metrics` endpoint is available.

### Breaking Changes

- API base path: `/v1/*` → `/v2/*`.
- Height values from raster topics are returned in meters instead of centimeters. The response field is renamed `__height` → `height` (#79).
- Topic attribute names changed and the bundled database dump matches the new names (#163, #178). Re-fetch `/v2/topics` to look up the new attribute names.
- Topic identifiers in the bundled `topic.json` were renamed (e.g. `sn_land` → `sn_land_f`, `sn_natura2000_gebiet` → `sn_natura2000_f`). Re-fetch `/v2/topics` for the current list.
- `/health` no longer has a version prefix; call `/health` directly.
- Environment variables renamed to `UPPER_SNAKE_CASE` (#70).

#### Migration from v1

1. Replace `/v1/` with `/v2/` in API URLs.
2. Update clients that read height values: now meters (was centimeters), and the property is `height` (was `__height`).
3. Re-fetch `/v2/topics` for the renamed topic identifiers and attribute names.
4. Rename environment variables in deployment configs to `UPPER_SNAKE_CASE`.
5. Health probes: use `/health` (no version prefix).

### Added

- `/metrics` endpoint for Prometheus. Metrics are prefixed with `geospatialanalyzer` and initialized to zero (#75).
- Env flag to hide the `/metrics` endpoint in the OpenAPI document (#120). Useful for production environments where the endpoint is only available to specific services inside a privileged network.
- `GEOSPATIAL_ANALYZER_URL_PREFIX` env variable to configure a global URL prefix (#94).
- Topic group filter: one configuration file serves both demo and production topics. Can be filtered by setting `GEOSPATIAL_ANALYZER_TOPIC_GROUP_FILTER` e.g. to `demodata`. (#85)
- Static OpenAPI spec files (`openapi.yaml`, `openapi.json`) served at `/v2/openapi.{yaml,json}`, regenerated on app startup (#124).
- `__unit` and `__verticalDatum` properties on `valuesAtPoint` feature responses (#108).
- `attributes` field on the `/topics` response (#132).
- Optional `valueMetadata` and provider `attribution` blocks on the `/topics` response (#108, #132, #161, #163, #178).
- DB-init Dockerfile that hard-resets and loads a default data dump (#107).

### Changed

- Topic and topic-all configuration files merged into one; group filter replaces the dual-file setup.
- Removed duplicate metadata properties from internal topic types.
- Internal rename: `DB_NAME_NAME` → `SOURCE_NAME_PROPERTY`.
- Bundled `topic.json` and demo data dump use the database schema `ga` (previously `spatialyzer_demo`); source table paths in `__source__` updated accordingly. Self-hosted deployments need to either migrate their schema or adapt their `topic.json`.
- Internal tooling: ESLint migrated to flat config (#145), Jest 30, `@types/node` 25, Node.js base images bumped within the v24 line, plus routine Dependabot updates across runtime deps, GitHub Actions, and `@swc/core`.

### Fixed

- Swagger UI uses the global URL prefix for local API doc routing (#172). Previous solution did not work with the node dev server.
- `esrijson` output format returns the correct geometry (#81).
- `valuesAtPoint` with `"returnGeometry": true` no longer fails.
- Example geometries and DTO example coordinates corrected to match the demo data (#119).

### Security

- Updated all dependencies. Includes fixes for known CVEs.
- Dependency settings hardened against supply-chain attacks (#150).
- `pnpm` pinned to 11.1.2 with dependency build scripts disabled by default (#165).
- SBOM is now attested and uploaded to the github attestation page (see https://github.com/geobakery/GeospatialAnalyzer/attestations).

**Contributors:** @dschlarmann, @einspanier, @sebeweiss, @TimMoser92, @dependabot[bot]

**Full Changelog:** https://github.com/geobakery/GeospatialAnalyzer/compare/v1.3.0...v2.0.0

## [1.3.0] - 2025-10-30

### Added

- Graceful shutdown handler.
- `engines` property in `package.json` to warn on unsupported Node.js versions.

### Changed

- Docker / Podman: hardened Dockerfile and upgraded Node.js to Active LTS v24.

### Fixed

- Test corrections.
- Transform-service handling improvements for CRS definitions.

### Security

- Dependencies updated to their latest major versions, addressing security vulnerabilities.

**Full Changelog:** https://github.com/geobakery/GeospatialAnalyzer/compare/v1.2.1...v1.3.0

## [1.2.1] - 2025-06-23

### Fixed

- `proj4.defs()` API compatibility after a dependency update.

### Security

- Dependencies updated to address several security vulnerabilities.

**Full Changelog:** https://github.com/geobakery/GeospatialAnalyzer/compare/v1.2.0...v1.2.1

## [1.2.0] - 2025-01-16

### Added

- Non-root user configuration for the production Docker deployment.

### Changed

- Docker (production): `pnpm-lock.yaml` included in the build; `--frozen-lockfile` enforced for reproducible builds.

### Security

- Dependencies updated to address several security vulnerabilities.

**Full Changelog:** https://github.com/geobakery/GeospatialAnalyzer/compare/v1.1.0...v1.2.0

## [1.1.0] - 2024-11-12

### Added

- Nginx integration for Docker deployments, including `nginx.config` and a startup script.

### Changed

- API structure updated for stricter OpenAPI 3.0 compliance after a `@nestjs/swagger` upgrade.
- Docker (production): `Dockerfile-prod` cleaned and optimized; `docker-compose-prod.yml` improved; database port no longer forwarded by default; ports configurable via environment variables; logging configured for the application and Nginx.

### Security

- Dependencies updated to address several security vulnerabilities.

**Full Changelog:** https://github.com/geobakery/GeospatialAnalyzer/compare/v1.0.0...v1.1.0

## [1.0.0] - 2024-07-12

Initial stable release. Compared to [1.0.0-rc1], this release fixes typos and polished the documentation (#45).

**Full Changelog:** https://github.com/geobakery/GeospatialAnalyzer/compare/v1.0.0-rc1...v1.0.0

## [1.0.0-rc1] - 2024-05-30

Initial release candidate. README and documentation finalized for the first public release (#44).

[Unreleased]: https://github.com/geobakery/GeospatialAnalyzer/compare/v2.0.0...HEAD
[2.0.0]: https://github.com/geobakery/GeospatialAnalyzer/compare/v1.3.0...v2.0.0
[1.3.0]: https://github.com/geobakery/GeospatialAnalyzer/compare/v1.2.1...v1.3.0
[1.2.1]: https://github.com/geobakery/GeospatialAnalyzer/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/geobakery/GeospatialAnalyzer/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/geobakery/GeospatialAnalyzer/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/geobakery/GeospatialAnalyzer/compare/v1.0.0-rc1...v1.0.0
[1.0.0-rc1]: https://github.com/geobakery/GeospatialAnalyzer/releases/tag/v1.0.0-rc1
