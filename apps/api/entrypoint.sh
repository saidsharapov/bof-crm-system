#!/bin/sh
set -e

echo "[api] Waiting for database to accept connections..."
until node_modules/.bin/prisma migrate status > /dev/null 2>&1; do
  echo "[api] Database not ready yet — retrying in 2s..."
  sleep 2
done

echo "[api] Running database migrations..."
node_modules/.bin/prisma migrate deploy

echo "[api] Starting application..."
exec node dist/main.js
