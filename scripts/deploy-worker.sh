#!/usr/bin/env bash
# Deploy Cloudflare Worker v5
cd cf-deploy
npx wrangler deploy nonusd-data-worker.js --name nonusd-data
