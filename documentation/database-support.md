# Database support
In this document, we will talk about the database support for this API-backend.
From start there is full `Postgres` with `Postgis` support.
Other databases are currently not supported, but can be added as an adapter.
In General all supported databases from `TypeORM` can be connected.

This is currently: \
`MySQL` / `MariaDB` / `Postgres` / `CockroachDB` / `SQLite` / `Microsoft SQL Server` / `Oracle` / `SAP Hana` / `sql.js` / `MongoDB NoSQL database`. \

It is important to notice that for a geospatial usage an equivalent of `Postgis` is needed for the database. For example `SpatiaLite` for `SQLite`.

## Add new database support

To add database support, you need to add a database adapter. The database must be part of the list from above and need an equivalent GIS extension.
If this is fullfilled following changes are needed:

1. Add your database to `supportedDatabase` in `general.constants`

```typescript
export enum supportedDatabase {
  postgres = 'postgres',
  newDatabase = 'newDatabase'  
}
```

2. Create an adapter in `general/adapter` parallel to `postgeres.service.ts`. It's important to extend `DbAdapterService`:

```typescript
@Injectable()
export class NewdatabaseService extends DbAdapterService {
    constructor() {
        super();
    }
  override transformFeature(featureWkt: SqlParameter, toCrs: number): string {
    return `ST_TRANSFORM(${featureWkt.value}::text, ${toCrs})`; // Use your equivalent to Postgis ST_TRANSFORM
  }

    // ... overwrite all methods
}
```

3. Add your adapter in `general.service` in the methode `getDbAdapter()`

```typescript

function getDbAdapter(): DbAdapterService {
    if (this.adapter) {
        return this.adapter;
    }
    const dbtype = process.env.geospatial_analyzer_db_type;
    if (dbtype) {
        switch (dbtype) {
            case supportedDatabase.postgres: {
                return new PostgresService();
            }
            default: {
                return new DbAdapterService();
            }
        }
    }
}
```
4. Edit your `.env` file with the new database name:

``` shell
geospatial_analyzer_db_type: new_database
```
