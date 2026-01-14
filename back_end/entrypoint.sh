#!/bin/sh
set -e

echo "Running Prisma generate..."
npx prisma generate

echo "Applying migrations..."
npx prisma migrate deploy

echo "Seeding database..."
npm run prisma:seed

echo "Starting backend server..."
npm run start
