#!/usr/bin/env bash
# Deploy Dashboard v15 to Cloudflare Pages (production)
cp dashboard/index.html cf-deploy/index.html
cd cf-deploy
npx wrangler pages deploy --project-name nonusd --branch main
