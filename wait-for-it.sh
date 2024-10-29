#!/bin/sh

set -e

HOST="$1"
shift
CMD="$@"

until nc -z "$HOST" 3000; do
  >&2 echo "Waiting for $HOST:3000..."
  sleep 1
done

>&2 echo "$HOST:3000 is up - executing command"
exec $CMD