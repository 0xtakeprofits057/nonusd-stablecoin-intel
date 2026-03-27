#!/usr/bin/env bash
# Deploy nonUSD Dashboard to Cloudflare Pages (production)
# Run from the repo root directory
set -e

echo "Deploying dashboard to Cloudflare Pages..."
cd "$(dirname "$0")/.."
npx wrangler pages deploy dashboard/ --project-name=nonusd --branch=main
echo "Dashboard deployed to https://nonusd.pages.dev"
