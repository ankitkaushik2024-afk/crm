#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Copying environment files..."
[ -f .env ] || cp .env.example .env
[ -f apps/api/.env ] || cp .env.example apps/api/.env
[ -f apps/web/.env ] || cp apps/web/.env.example apps/web/.env 2>/dev/null || cat > apps/web/.env <<EOF
VITE_API_URL=http://localhost:4000/api/v1
VITE_WS_URL=http://localhost:4000
EOF

echo "==> Installing dependencies..."
npm install

echo "==> Building shared package..."
npm run build -w @crm/shared

echo "==> Generating Prisma client..."
npm run db:generate

if command -v docker &>/dev/null; then
  echo "==> Starting PostgreSQL & Redis..."
  docker compose up -d postgres redis
  echo "==> Waiting for database..."
  sleep 5
  echo "==> Running migrations..."
  npm run db:migrate -- --name init 2>/dev/null || npm run db:push -w @crm/api
  echo "==> Seeding database..."
  npm run db:seed
else
  echo "==> Docker not found. Start PostgreSQL manually, then run:"
  echo "    npm run db:push"
  echo "    npm run db:seed"
fi

echo ""
echo "Setup complete! Run: npm run dev"
echo "Demo login: admin@acme.com / Password@123"
