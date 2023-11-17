# Running PostgreSQL without installation on Windows
This document describes how to set up PostgresSQL with PostGIS on a Windows machine without administrator rights.

## Download and extract binaries

### Download

1. PostgreSQL: https://www.enterprisedb.com/download-postgresql-binaries
2. PostGIS: https://download.osgeo.org/postgis/windows/

### Extract
1. Extract PostgreSQL-binaries
2. In the same folder, extract PostGIS-binaries

## Create and run script

Create a `*.bat` file in the root of the PostgreSQL folder:
```
@ECHO ON
REM The script sets environment variables helpful for PostgreSQL
@SET PATH="%~dp0\bin";%PATH%
@SET PGDATA=%~dp0\data
@SET PGDATABASE=postgres
@SET PGUSER=postgres
@SET PGPORT=5432
@SET PGLOCALEDIR=%~dp0\share\locale
REM "%~dp0\bin\initdb" -U postgres -A trust
"%~dp0\bin\pg_ctl" -D "%~dp0/data" -l logfile start
ECHO "Click enter to stop"
pause
"%~dp0\bin\pg_ctl" -D "%~dp0/data" stop
```

Change the parameters if you want to.

In the first run, remove `REM` from line `REM "%~dp0\bin\initdb" -U postgres -A trust`.

Source of the script: http://www.postgresonline.com/journal/archives/172-Starting-PostgreSQL-in-windows-without-install.html