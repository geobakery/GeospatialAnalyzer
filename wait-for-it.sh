#!/bin/sh

set -e

HOST="$1"

until curl --output /dev/null --silent --head --fail "$HOST/v1/health"; do
  >&2 echo "Waiting for $HOST/v1/health ..."
  sleep 1
done

>&2 echo "$HOST/v1/health is up - launching Nginx"
exec nginx -g "daemon off;"