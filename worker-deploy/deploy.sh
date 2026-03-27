#!/bin/bash
# Deploy the nonusd-data Worker to Cloudflare
# Run from the worker-deploy directory:
#   cd worker-deploy && bash deploy.sh

set -e

echo "🚀 Deploying nonusd-data Worker..."
# Uses wrangler login credentials (run 'npx wrangler login' first if needed)
unset CLOUDFLARE_API_TOKEN
npx wrangler deploy

echo ""
echo "✅ Worker deployed! Testing health endpoint..."
curl -s https://nonusd-data.0xtakeprofits.workers.dev/health | python3 -m json.tool 2>/dev/null || echo "(health check will work after first cron run)"

echo ""
echo "🔄 Triggering first data refresh..."
curl -s https://nonusd-data.0xtakeprofits.workers.dev/data | head -c 200
echo ""
echo ""
echo "✅ Done! Worker will auto-refresh data every 6 hours via cron."
