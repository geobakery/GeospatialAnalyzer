#!/bin/bash
set -e

pg_restore -U "postgres" -d "postgres" < '/docker-entrypoint-initdb.d/data';