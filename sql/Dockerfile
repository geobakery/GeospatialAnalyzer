FROM postgis/postgis:15-3.4

COPY . /docker-entrypoint-initdb.d/
RUN chmod +x /docker-entrypoint-initdb.d/pg_restore.sh
