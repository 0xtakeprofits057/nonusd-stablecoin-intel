#!/usr/bin/env bash
# Deploy nonUSD Data Worker to Cloudflare Workers
set -e

echo "Deploying Worker to Cloudflare Workers..."
cd "$(dirname "$0")/../cf-deploy"
npx wrangler deploy
echo "Worker deployed to https://nonusd-data.0xtakeprofits.workers.dev"
