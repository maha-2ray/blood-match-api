#!/bin/sh
set -e

echo "Running database migrations..."
if ! npm run migration:run; then
  echo "WARNING: Migrations failed, but continuing startup..."
fi

echo "Starting application..."
exec node dist/src/main.js
