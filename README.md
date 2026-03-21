# Non-USD Stablecoin Intelligence — Project Documentation

**Live dashboard:** https://nonusd.pages.dev
**Data API:** https://nonusd-data.0xtakeprofits.workers.dev/data
**Last updated:** March 2026

---

## Overview

The Non-USD Stablecoin Intelligence dashboard tracks 40+ non-USD stablecoins across 19 currencies and 11 chains in real-time. It combines a Cloudflare Worker data pipeline (fetching from Token Terminal) with a fully self-contained, single-file HTML dashboard deployed on Cloudflare Pages.

---

## Architecture

```
Token Terminal API
   ↓ (daily, 40 parallel requests)
Cloudflare Worker  →  KV Cache (nexus:data:v2)
   ↓                       ↑ (22h TTL, background refresh)
GET /data endpoint  ←  Cloudflare Pages dashboard
```

**Data flow:**
1. Worker fetches 40 stablecoins from Token Terminal (all 8 metrics, 180-day interval)
2. Processes into per-asset timeseries, calculates pct changes, peg deviation, velocity
3. Stores compressed JSON in KV with 7-day expiration
4. Dashboard fetches from `/data` on load; KV serves cached response (< 50ms) while background refresh runs if stale

---

## Cloudflare Worker (`nonusd-data`)

**URL:** `https://nonusd-data.0xtakeprofits.workers.dev`
**Source:** `nonusd-data-worker.js`
**Wrangler config:** `wrangler.toml`

### Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /data` | Returns latest processed JSON from KV (or fetches live if cache miss) |
| `GET /refresh?key=nexus-admin-2024` | Manually triggers a full data refresh |
| `GET /refresh?key=nexus-admin-2024&debug=1` | Debug: tests single EURC API call, returns raw response |

### Environment Variables

These must be set in the Cloudflare Workers dashboard under **Settings → Variables**:

| Variable | Value | Notes |
|----------|-------|-------|
| `TT_API_KEY` | Token Terminal API key | Falls back to hardcoded key if missing |
| `ADMIN_KEY` | `nexus-admin-2024` | Protects the `/refresh` endpoint |

### KV Namespace

| Setting | Value |
|---------|-------|
| Binding name | `NEXUS_DATA` |
| Namespace ID | `13f07bc0afbc4044b54d02d3804b9597` |
| Key | `nexus:data:v2` |
| Expiry | 7 days |
| Stale threshold | 22 hours (triggers background refresh) |

### Cron Schedule

Runs daily at **06:00 UTC** (`0 6 * * *`).

### Asset Registry

40 unique stablecoins tracked across 19 currencies:

| Currency | Assets |
|----------|--------|
| EUR | EURC, EURS, EURCV, EURe, EURR, EURQ, EURØP, EURM, EURA, VEUR, AllUnity EUR, EUROe, EURT, Usual EUR |
| GBP | GBPM, GBPE, VGBP |
| AUD | AUDD, AUDX, AUDM |
| JPY | JPYC, GYEN, JPYM |
| SGD | XSGD |
| CHF | VCHF, CHFM |
| CAD | QCAD, CADM |
| MXN | MXNB, WMXN |
| BRL | BRLM |
| ARS | WARS |
| CLP | WCLP |
| COP | WCOP, COPM |
| PEN | WPEN |
| KES | KESM |
| NGN | NGNM |
| PHP | PHPM |
| ZAR | mZAR, ZARM |
| MYR | MYRC |
| GHS | cGHS |

### Metrics Fetched (Token Terminal)

| Metric ID | Description |
|-----------|-------------|
| `asset_market_cap_circulating` | Circulating market cap |
| `asset_transfer_volume` | Transfer volume |
| `asset_transfer_count` | Number of transfers |
| `asset_dau` | Daily active unique senders |
| `asset_holders` | Total holders |
| `asset_mints` | Mint events |
| `asset_redemptions` | Redemption events |
| `asset_price` | USD price |

### Output JSON Schema (per asset)

```json
{
  "id": "eurc",
  "name": "EURC",
  "cur": "EUR",
  "iss": "Circle",
  "chains": ["ethereum", "solana", "base", "avalanche", "stellar"],
  "mc": 484692643,
  "mc30pct": -1.9,
  "mc90pct": 30.1,
  "mc180pct": 64.2,
  "vol30": 6772597342,
  "txn30": 2208051,
  "dau": 4687,
  "holders": 200361,
  "mints30": 0,
  "redems30": 0,
  "netFlow30": 0,
  "price": 1.082,
  "pegDevBps": 5,
  "velocityRatio": 13.97,
  "mc_series": [372635706, "...", 484692644],
  "dau_series": [4500, 4612, "...", 4687],
  "txn_series": [72000, 68000, "...", 74000],
  "price_series": [1.081, "...", 1.082]
}
```

### FX Rates

Fetched from **frankfurter.app** (European Central Bank data, free, no API key required).
URL: `https://api.frankfurter.app/latest?from=USD&to=EUR,GBP,SGD,...`
Used to calculate peg deviation in basis points: `(price_usd / fx_rate - 1) × 10000`

Hardcoded fallback rates are included in the Worker in case the FX API is unavailable.

---

## Dashboard (`nonusd.pages.dev`)

**Source:** `index.html` (single file, ~2,800 lines)
**Deployed via:** Cloudflare Pages (upload zip)
**Version history:** v12 → v13 (header redesign) → v14 (chart data fixes)

### Dashboard Tabs

| Tab | Contents |
|-----|----------|
| **Overview** | KPI cards (Total MC, 30d Vol, Daily Senders, Active Chains, Holders, Top Gainer/Loser), sector bar chart, continent chart |
| **Currencies** | Per-currency panels with asset cards, MC/Senders/Txns sparklines, peg deviation, velocity ratio |
| **Chains** | Chain-level breakdown with MC and asset distribution |
| **Activity** | Cross-asset activity ranking (DAU, Txns, Velocity) |
| **Insights** | AI-generated commentary on notable trends |

### Data Loading Logic

The dashboard tries the live Worker first, then falls back to embedded static data:

```
1. Fetch https://nonusd-data.0xtakeprofits.workers.dev/data
   ↓ success → processWorkerData(wd)
   ↓ error → use embedded FALLBACK static snapshot
```

`processWorkerData()` maps the Worker JSON into the dashboard's internal data structures:
- `ASSETS[]` — flat array of asset objects
- `MC_SERIES{}` — sampled 180d market cap series per asset (≤18 points for rendering)
- `DAU_SERIES{}` — 30d daily senders series (if Token Terminal returns history)
- `TXN_SERIES{}` — 30d daily transaction count series (if Token Terminal returns history)
- `ACTIVITY{}` — `{dau, txn}` snapshots for current-value display
- `CHAIN_DATA{}` — per-chain MC aggregates
- `CONT_SERIES{}` — continent-level timeseries (Europe / Asia-Pacific / Americas / Africa)

### Sparkline Charts (Currency Tab)

Each asset card in the Currency tab has three sparkline modes toggled by buttons:

| Mode | Series Source | Fallback if ≤1 point |
|------|--------------|----------------------|
| **MKT CAP** | `MC_SERIES[id]` | Always has data |
| **SENDERS** | `DAU_SERIES[id]` | Shows current value + "Not enough data to compute a chart" |
| **TXNS** | `TXN_SERIES[id]` | Shows current value + "Not enough data to compute a chart" |

**Why SENDERS and TXNS may show "Not enough data":** Token Terminal may return only a single data point (snapshot) for `asset_dau` and `asset_transfer_count` for some assets rather than a full daily series. Market cap always has a full 180-day history.

---

## Deployment Guide

### Deploy the Worker

1. Make any changes to `nonusd-data-worker.js`
2. Run the deploy script on your Mac terminal:
   ```bash
   bash ~/Downloads/PASTE-THIS-INTO-TERMINAL.txt
   ```
3. Verify:
   ```bash
   curl "https://nonusd-data.0xtakeprofits.workers.dev/refresh?key=nexus-admin-2024"
   # Expected: {"ok":true,"assets":40,"ts":"..."}
   ```

**Important:** Always use `--keep-vars` flag (already in the script) to preserve `TT_API_KEY` and `ADMIN_KEY` environment variables. Without it, Cloudflare wipes env vars on each deploy.

### Deploy the Dashboard

1. Go to **Cloudflare Pages** → `nonusd` project → **Deployments**
2. Click **Upload assets**
3. Upload `nonusd-cloudflare-v14.zip` (or latest version)
4. Deployment is instant

### After Deploying the Worker

The KV cache will still hold the old data. To refresh immediately:
```bash
curl "https://nonusd-data.0xtakeprofits.workers.dev/refresh?key=nexus-admin-2024"
```

The cron job runs daily at 06:00 UTC automatically.

---

## Cloudflare Account Details

| Setting | Value |
|---------|-------|
| Account ID | `e438a5fc1e04c5ad62f0ee974c8d6627` |
| Worker name | `nonusd-data` |
| Pages project | `nonusd` |
| KV namespace ID | `13f07bc0afbc4044b54d02d3804b9597` |

---

## Known Issues & Data Quality

### Assets with Partial Data

Some smaller assets may have limited Token Terminal coverage:
- **AUDX** (`dau: 0`) — DAU metric not tracked by TT for this asset
- **GBPM** — Very small MC, volatile series
- Assets with `mc < $100K` are filtered out of gainer/loser calculations

### Duplicate Asset IDs in Registry

The `ASSETS` array in the Worker has two duplicate entries each for `eur0p` and `eurq`. These are deduplicated by the `seen = new Set()` logic in `fetchAndProcess()`, so only the first occurrence is processed. This should be cleaned up in a future version.

### Token Terminal Rate Limits

The Worker makes 40 parallel API requests on each refresh. Token Terminal's free tier may throttle requests. If `assets < 40` on a refresh, some requests likely 429'd. The Worker logs individual asset errors to Cloudflare's Workers console.

---

## File Structure

```
cf-deploy/
  nonusd-data-worker.js    ← Worker source (current deployed version)
  wrangler.toml            ← Wrangler configuration

outputs/
  nonusd-cloudflare-v14.zip  ← Latest dashboard build (deploy to Pages)
  PASTE-THIS-INTO-TERMINAL.txt  ← Self-contained Worker deploy script
```

---

## Token Terminal API Reference

**Base URL:** `https://api.tokenterminal.com/v2`
**Auth:** `Authorization: Bearer {api_key}`

### Endpoint Used

```
GET /v2/assets/{assetId}/metrics?metric_ids[]=metric1&metric_ids[]=metric2&interval=180d
```

**Response format:**
```json
{
  "data": [
    {
      "timestamp": "2026-03-20",
      "asset_id": "eurc",
      "product_id": "eurc",
      "asset_market_cap_circulating": 484692644,
      "asset_dau": 4687
    }
  ]
}
```

Each row in `data` represents one day. All requested metrics appear as fields on the same row.

### Endpoints That Do NOT Work (historical reference)

- `GET /v2/metrics` — Returns metrics catalog (definitions), not data
- `GET /v2/assets/metrics?asset_ids[]=eurc` — Returns 404; asset ID must be in the URL path
- CSV format (`Accept: text/csv`) — TT returns JSON regardless; ignore `Accept` header

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| v12 | Mar 2026 | Base release, deployed to nonusd.pages.dev |
| v13 | Mar 2026 | Header redesign: larger title, removed redundant stats box, moved data freshness to footer, added KPI cards for Holders/Gainer/Loser |
| v14 | Mar 2026 | Fixed Currency tab sparklines: populate DAU_SERIES/TXN_SERIES from Worker data; replaced "snapshot · no history" with "Not enough data to compute" message; Worker now outputs `dau_series` and `txn_series` arrays per asset |

| Worker Version | Date | Changes |
|----------------|------|---------|
| v1 | Mar 2026 | Initial deployment, CSV parsing, wrong endpoint |
| v2 | Mar 2026 | Fixed endpoint: `/v2/assets/{id}/metrics`, switched to JSON parsing |
| v3 | Mar 2026 | Added `dau_series` and `txn_series` to asset output |
