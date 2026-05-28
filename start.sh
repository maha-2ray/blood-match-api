#!/bin/sh
set -e

echo "Running database migrations..."
npm run migration:run || true

echo "Starting application..."
node dist/src/main.js
