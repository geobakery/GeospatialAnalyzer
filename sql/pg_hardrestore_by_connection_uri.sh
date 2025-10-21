#!/bin/sh
set -e

waiting_for()
{
    if [ $i -eq  6 ]; then 
        >&2 echo "$1 still not ready. Aborting."
        exit 1
    fi

    >&2 echo "Waiting for $1 ..."
    sleep 5
    i=$(($i+1))  
}

i=0
until pg_isready --dbname="$POSTGRES_DB_URI"; do
    waiting_for "Database (pg_ready)"
done

i=0
until psql --dbname="$POSTGRES_DB_URI" -c "\dx" | grep -w postgis; do
    waiting_for "postgis extension"
done

pg_restore --dbname="$POSTGRES_DB_URI" --no-owner --clean --if-exists --verbose ./data