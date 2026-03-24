# Non-USD Stablecoin Intelligence

**Live dashboard:** https://nonusd.pages.dev
**Data API:** https://nonusd-data.0xtakeprofits.workers.dev/data
**Last updated:** March 2026

A real-time intelligence dashboard tracking 40+ non-USD stablecoins across 19 currencies and 11 chains. Built on a Cloudflare Worker data pipeline (sourcing from Token Terminal) and deployed as a single-file HTML dashboard on Cloudflare Pages.

---

## Architecture

```
Token Terminal API
   ↓  (daily cron + on-demand, 40 parallel requests)
Cloudflare Worker (nonusd-data)
   ↓                    ↑
KV Cache (nexus:data:v2, 7-day TTL, 22h stale threshold)
   ↓
GET /data endpoint
   ↓
Dashboard (nonusd.pages.dev)
   ↓
localStorage cache (12h TTL, client-side)
```

**Data flow:**
1. Worker fetches 40 stablecoins from Token Terminal (8 metrics, 180-day interval)
2. Processes per-asset timeseries, pct changes, peg deviation, velocity ratio
3. Stores compressed JSON in KV (key `nexus:data:v2`, 7-day expiry)
4. Dashboard fetches from `/data` on load; KV serves cached response (<50ms) while a background refresh runs if data is >22h stale
5. Dashboard caches the processed result in `localStorage` for 12h to avoid redundant fetches

---

## Cloudflare Worker (`nonusd-data`)

**Source:** `cf-deploy/nonusd-data-worker.js`
**Wrangler config:** `cf-deploy/wrangler.toml`
**Current version:** v5

### Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /data` | Returns latest processed JSON from KV (or fetches live on cache miss) |
| `GET /refresh?key=nexus-admin-2024` | Manually triggers a full data refresh |
| `GET /refresh?key=nexus-admin-2024&debug=1` | Tests a single EURC API call and returns raw response |

### Environment Variables

Set in Cloudflare Workers dashboard under **Settings → Variables**:

| Variable | Notes |
|----------|-------|
| `TT_API_KEY` | Token Terminal API key |
| `ADMIN_KEY` | Protects the `/refresh` endpoint (`nexus-admin-2024`) |

> ⚠️ Always deploy with `--keep-vars` to preserve these. Without it Cloudflare wipes env vars on each deploy.

### KV Namespace

| Setting | Value |
|---------|-------|
| Binding name | `NEXUS_DATA` |
| Key | `nexus:data:v2` |
| Expiry | 7 days |
| Stale threshold | 22 hours (triggers background refresh) |

### Cron Schedule

Runs daily at **06:00 UTC** (`0 6 * * *`).

### Metrics Fetched (Token Terminal)

| Metric ID | Description |
|-----------|-------------|
| `asset_market_cap_circulating` | Circulating market cap |
| `asset_transfer_volume` | 30d transfer volume |
| `asset_transfer_count` | 30d transfer count |
| `asset_dau` | Daily active unique senders (30d series) |
| `asset_holders` | Total holders |
| `asset_mints` | Mint events |
| `asset_redemptions` | Redemption events |
| `asset_price` | USD price |

### Output JSON Schema

Top-level structure:

```json
{
  "updated_at": "2026-03-23T13:14:27.615Z",
  "fx_rates": { "EUR": 1.155, "GBP": 1.337, ... },
  "sector": { "total_mc": 2340000000, "total_vol30": 45000000000, ... },
  "top_gainer": { "id": "gbpm", "mc30pct": 12.4 },
  "top_loser":  { "id": "eurt", "mc30pct": -8.1 },
  "assets": [ ...per-asset objects... ],
  "currencies": { "EUR": { "mc": 1800000000, ... }, ... },
  "dau_series": { "eurc": [3419, 3176, 4455, ...], "eurs": [...], ... },
  "txn_series": { "eurc": [68000, 72000, 74000, ...], "eurs": [...], ... }
}
```

Per-asset object:

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
  "mc_series": [372635706, ..., 484692644],
  "price_series": [1.081, ..., 1.082]
}
```

> **Note on `dau_series` / `txn_series`:** As of Worker v5 these are stored as **top-level maps** (`{ assetId → [values] }`) rather than per-asset fields. This avoids a Cloudflare Workers V8 runtime issue where dynamically assigned properties on objects were silently dropped during JSON serialisation.

### FX Rates

Fetched from **frankfurter.app** (European Central Bank data, free, no key required).
URL: `https://api.frankfurter.app/latest?from=USD&to=EUR,GBP,...`
Used to calculate peg deviation in basis points: `(price_usd / fx_rate - 1) × 10000`.
Hardcoded fallback rates are included in the Worker.

### Asset Registry

40 stablecoins across 19 currencies:

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

---

## Dashboard (`nonusd.pages.dev`)

**Source:** `index.html` (single file)
**Deployed via:** Cloudflare Pages
**Current version:** v18

### Tabs

| Tab | Contents |
|-----|----------|
| **Overview** | KPI cards (Total MC, 30d Vol, Daily Senders, Active Chains, Holders, Top Gainer/Loser), sector bar chart, continent chart |
| **Currencies** | Per-currency panels with asset cards, MC/Senders/Txns sparklines, peg deviation, velocity ratio |
| **Chains** | Chain-level MC breakdown and asset distribution |
| **Activity** | Cross-asset ranking by DAU, Txns, and Velocity |
| **Insights** | AI-built commentary on notable trends |

### CoinGecko Trading Pairs (Feature 3 — v18)

Each asset card includes an expandable **Trading Pairs** button that lazy-loads live market data from the CoinGecko free API (`/coins/{id}/tickers`).

- **CG_ID_MAP:** Maps 40+ dashboard asset IDs to CoinGecko coin IDs (verified Mar 2026)
- **In-memory cache:** 5-minute TTL per coin to stay within CoinGecko free-tier rate limits (5-15 calls/min)
- **cleanSymbol():** Resolves DEX contract addresses to human-readable ticker symbols via a 40+ entry lookup table
- **Display:** Exchange name, trading pair, USD price, 24h volume, bid/ask spread, ±2% order book depth, direct trade links
- **Client-side only:** No Worker changes needed; API calls go directly from the browser to CoinGecko

### Market Context (Features 1+2 — v18)

- **Stablecoin Market Context:** USD vs non-USD market cap comparison bars (live data from Token Terminal)
- **The Opportunity Gap:** Log-scale bubble visualization comparing FX daily turnover ($7.5T BIS 2022), USD stablecoins, and non-USD stablecoins

### Data Loading

```
1. Check localStorage (key: nsi_live_v2, TTL: 12h)
   → Hit & fresh: hydrate from cache, render immediately
   → Miss or stale: continue ↓

2. Fetch Worker /data endpoint (12s timeout)
   → processWorkerData(wd) → cache to localStorage → render
   → Error: continue ↓

3. Fallback: fetch Token Terminal API directly
   → processAllData() → render
```

### `processWorkerData()` — Data Mapping

Maps Worker JSON into dashboard-internal structures:

| Variable | Source |
|----------|--------|
| `ASSETS[]` | `wd.assets` mapped to display objects |
| `MC_SERIES{}` | Per-asset 180d market cap, sampled to ≤18 points |
| `DAUSERIES{}` | `wd.dau_series` (top-level map, v5+) |
| `TXN_SERIES{}` | `wd.txn_series` (top-level map, v5+) |
| `ACTIVITY{}` | `{dau, txn}` snapshots for current-value display |
| `CHAIM_DATA;}` | Per-chain MC aggregates |
| `CONT_SERIES{}` | Continent-level MC timeseries (Europe / Asia-Pacific / Americas / Africa) |

### Sparklines (Currency Tab)

Each asset card has three sparkline modes:

| Mode | Data source | Fallback if ≤1 point |
|------|-------------|----------------------|
| **MKT CAP** | `MC_SERIES[id]` | Always has data (180d) |
| **SENDERS** | `DAUSERIES{id]}` | "Not enough data to compute a chart" |
| **TXNS** | `TXN_SERIES[id]` | "Not enough data to compute a chart" |

---

## Deployment

### Deploy the Worker

Run the self-contained deploy script (includes the full Worker source base64-encoded):

```bash
bash ~/Downloads/PASTE-THIS-INTO-TERMINAL.txt
```

The script will:
- Decode and verify the Worker source
- Run `npx wranglor@latest deploy --keep-vars`
- Auto-trigger `/refresh` and print a Python verification summary

After deploying, trigger an immediate cache refresh:

```bash
curl "https://nonusd-data.0xtakeprofits.workers.dev/refresh?key=nexus-admin-2024"
# → {"ok":true,"assets":40,"ts":"..."}
```

### Deploy the Dashboard

Run the self-contained Pages deploy script:

```bash
bash ~/Downloads/DEPLOY-DASHBOARD-v18.sh
```

Or manually via Cloudflare Pages UI:

1. Go to **Cloudflare Pages → nonusd → Deployments**
2. Click **Upload assets** and upload `nonusd-cloudflare-v18.zipp`
3. **Important:** ensure it deploys to the **Production** environment (not Preview)

### After Dashboard Deploy — Clear Client Cache

If you (or users) see stale data after a deploy, clear localStorage in the browser console:

```js
localStorage.removeItem('nsi_live_v2');
location.reload(true);
```

---

## Cloudflare Account

| Resource | Value |
|----------|-------|
| Account ID | `e438a5fc1e04c5ad62f0ee974c8d6627` |
| Worker name | `nonusd-data` |
| Pages project | `nonusd` |
| KV namespace ID | `13f07bc0afbc4044b54d02d3804b9597` |

---

## Known Issues

- **Some assets show "Not enough data" on SENDERS/TXNS sparklines.** Token Terminal returns only a single snapshot (not a time series) for `asset_dau` / `asset_transfer_count` on smaller or less-tracked assets. Nothing to fix — the fallback message is intentional.
- **AUDX `dau: 0`**— DAU not tracked by Token Terminal for this asset.
- **Duplicate asset IDs** (`eur0p`, `eurq`) in the Worker's asset registry are deduplicated by a `seen = new Set()` guard. Should be cleaned up in a future version.
- **Token Terminal rate limits** — The Worker makes 40 parallel requests per refresh. On the free tier, some may 429. Check Worker logs if `assets < 40` on a refresh.

---

## Token Terminal API Reference

**Base URL:** `https://api.tokenterminal.com/v2`
**Auth:** `Authorization: Bearer {api_key}`

### Endpoint

```
GET /v2/assets/{assetId}/metrics?metric_ids[]=metric1&interval=180d
```

Each row in `data[]` represents one day; all requested metrics appear as fields on the same row.

### Endpoints That Do NOT Work

- `GET /v2/metrics` — Returns metric definitions, not data
- `GET /v2/assets/metrics?asset_ids[]=eurc` — Returns 404; asset ID must be in the URL path
- `Accept: text/csv` header — TT ignores it and always returns JSON

---

## Changelog

### Dashboard

| Version | Date | Changes |
|---------|------|---------|
| v12 | Mar 2026 | Initial release on nonusd.pages.dev |
| v13 | Mar 2026 | Header redesign; KPI cards for Holders, Top Gainer/Loser; freshness moved to footer |
| v14 | Mar 2026 | Fixed Currency tab sparklines; DAU_SERIES/TXN_SERIES populated from Worker data |
| v15 | Mar 2026 | Updated `processWorkerData()` to read top-level `dau_series`/`txn_series` maps from Worker v5; added localStorage cache (12h TTL) |
| v18 | Mar 2026 | Added Trading Pairs feature (CoinGecko integration), Market Context comparison bars, Opportunity Gap visualization |

### Worker

| Version | Date | Changes |
|---------|------|---------|
| v1 | Mar 2026 | Initial deployment; CSV parsing, wrong API endpoint |
| v2 | Mar 2026 | Fixed endpoint to `/v2/assets/{id}/metrics`; switched to JSON parsing |
| v3 | Mar 2026 | Added `dau_series`/`txn_series` fields per asset (inline in object literal) |
| v4 | Mar 2026 | Moved series to post-creation assignment (`assetRecord.dau_series = dauArr`) — still not serialised correctly by V8 runtime |
| v5 | Mar 2026 | Fixed: `dau_series`/`txn_series` stored as top-level maps (`dauSeriesMap`, `txnSeriesMap`) outside the asset loop; confirmed 30-point arrays for all 40 assets |
