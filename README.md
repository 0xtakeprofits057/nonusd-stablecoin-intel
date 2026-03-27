# Non-USD Stablecoin Intelligence Dashboard

A single-page analytics dashboard tracking **all non-USD fiat-pegged stablecoins** listed on [Token Terminal](https://tokenterminal.com). Deployed on Cloudflare Pages with a Cloudflare Worker backend for server-side data caching.

**Live:** [nonusd.pages.dev](https://nonusd.pages.dev)

## What it tracks

- **60 stablecoin assets** across **20 fiat currencies** (EUR, GBP, JPY, CHF, BRL, AUD, SGD, MXN, CAD, PHP, MYR, ARS, COP, CLP, PEN, TRY, KES, ZAR, NGN, GHS)
- Market cap, 30d volume, daily active users, transaction counts, holder counts
- Historical trends (180d market cap, 30d activity)
- Chain distribution across 15+ blockchains
- Regional breakdown (Europe, Asia-Pacific, Americas, Africa)
- Centralized vs Decentralized issuer comparison

## Architecture

```
Token Terminal API (/v2/assets/{id}/metrics)
        |
        v
+-------------------+       +-------------------+
| Cloudflare Worker |  <->  |   Cloudflare KV   |
| (cron: 0 */6 * *)|       | (cached JSON data) |
+-------------------+       +-------------------+
        |
        v
+-------------------+
| Cloudflare Pages  |
| (index.html)      |  <- also fetches TT API directly as fallback
+-------------------+
```

### Data flow

1. **Cloudflare Worker** (`nonusd-data`) runs every 6 hours via cron trigger
   - Fetches per-asset metrics from Token Terminal's `/v2/assets/{id}/metrics` endpoint
   - Processes and caches results in Cloudflare KV
   - Serves pre-processed data via `GET /data`

2. **Dashboard** (`index.html`) loads data with a two-tier strategy:
   - **Primary:** Fetch from Worker endpoint (`/data`) for pre-processed data
   - **Fallback:** Direct per-asset Token Terminal API calls from the browser (batched, 10 at a time)
   - Results cached in `localStorage` with a 6-hour TTL
   - Auto-refresh every 6 hours via `setInterval`

## Project structure

```
nonusd-dashboard/
  index.html                  # Single-file dashboard (~290KB, v24)
  worker-deploy/
    worker.js                 # Cloudflare Worker (data pipeline)
    wrangler.toml             # Worker config (KV binding, cron schedule)
    deploy.sh                 # Deployment helper script
  DESIGN-SYSTEM-PROMPT.md     # Design system & prompt for AI-assisted development
  token-terminal-audit-2026-03-27.md  # TT API coverage audit
```

## Deployment

### Prerequisites

- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) (`npm install -g wrangler`)
- Cloudflare account with Workers & Pages enabled
- Token Terminal API key

### Deploy the Worker

```bash
cd worker-deploy
wrangler login
wrangler deploy
```

This deploys the Worker with:
- KV namespace binding: `NSI_KV` (ID: `13f07bc0afbc4044b54d02d3804b9597`)
- Cron trigger: every 6 hours (`0 */6 * * *`)
- Endpoint: `https://nonusd-data.0xtakeprofits.workers.dev`

### Deploy the Dashboard

```bash
# From the project root
wrangler pages deploy . --project-name=nonusd --branch=main
```

Or upload `index.html` as a zip via the Cloudflare Pages dashboard.

## Token Terminal API

The dashboard uses Token Terminal's v2 API:

- **Endpoint:** `GET /v2/assets/{asset_id}/metrics`
- **Auth:** Bearer token in `Authorization` header
- **Supported metrics:** `asset_market_cap_circulating`, `asset_transfer_volume`, `asset_dau`, `asset_transfer_count`, `asset_holders`, `asset_mints`, `asset_redemptions`
- **Chain grouping:** `?groupBy=chain` returns per-chain breakdown

### Known limitations

- Cloudflare Workers free plan has a 50 subrequest limit per invocation. The Worker caps at 48 asset fetches; the dashboard's browser-side fallback handles all 60 assets without limits.
- 14 of the 60 cataloged assets are "catalog-only" on TT (no market data yet): achf, aeur, audf, cadc, dchf, egbp, euro3, euroe, eurot, ibeur, mzar, qcad, seur, tryb
- 5 yield-strategy assets are excluded by design: float, rai, volt, zuneth, zunusd

## Version history

| Version | Date | Changes |
|---------|------|---------|
| v24 | 2026-03-27 | Fixed TT API endpoint (migrated from deprecated `/internal/metrics` to `/v2/assets/{id}/metrics`), Worker subrequest optimization, two-tier data loading (Worker + direct API fallback) |
| v23 | 2026-03-27 | Added 9 new assets (60 total), dynamic discovery system, 6h auto-refresh, Worker cron triggers |
| v22 | 2026-03-27 | CeD Compare tab, continent series charts |
| v21 | 2026-03-25 | All features integrated, DeFi tab |
| v20 | 2026-03-25 | Blockchain tab, region breakdowns |
| v16-v19 | 2026-03-23 | Initial builds, currency cards, chart system |

## License

MIT
