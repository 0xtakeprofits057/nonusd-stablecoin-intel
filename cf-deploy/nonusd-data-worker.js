/**
 * nonusd-data — Cloudflare Worker
 * Live data pipeline for Non-USD Stablecoin Intelligence dashboard
 *
 * Endpoints:
 *   GET /data           → returns latest processed JSON from KV
 *   GET /refresh?key=X  → manually triggers a data refresh (protected)
 *
 * Cron: "0 6 * * *" (daily 06:00 UTC)
 *
 * KV binding required:  NEXUS_DATA   (variable name)
 * Env vars required:    TT_API_KEY, ADMIN_KEY
 */

// ── ASSET REGISTRY ────────────────────────────────────────────────────────────
// All non-USD stablecoins tracked in Token Terminal
const ASSETS = [
  // EUR
  { id:'eurc',    name:'EURC',     cur:'EUR', iss:'Circle',          chains:['ethereum','solana','base','avalanche','stellar'] },
  { id:'eurs',    name:'EURS',     cur:'EUR', iss:'STASIS',           chains:['ethereum','polygon'] },
  { id:'eurcv',   name:'EURCV',    cur:'EUR', iss:'Soc. Générale',    chains:['ethereum'] },
  { id:'eure',    name:'EURe',     cur:'EUR', iss:'Monerium',         chains:['ethereum','gnosis','polygon'] },
  { id:'eurr',    name:'EURR',     cur:'EUR', iss:'Crypto.com',       chains:['ethereum'] },
  { id:'eurq',    name:'EURQ',     cur:'EUR', iss:'Quantoz',          chains:['ethereum'] },
  { id:'eur0p',   name:'EURØP',    cur:'EUR', iss:'Schuman Financial',chains:['ethereum'] },
  { id:'eurm',    name:'EURM',     cur:'EUR', iss:'VNX',              chains:['ethereum'] },
  { id:'eura',    name:'EURA',     cur:'EUR', iss:'Angle',            chains:['ethereum'] },
  { id:'veur',    name:'VEUR',     cur:'EUR', iss:'VNX',              chains:['ethereum'] },
  { id:'eurau',   name:'AllUnity EUR', cur:'EUR', iss:'AllUnity',     chains:['ethereum'] },
  { id:'euroe',   name:'EUROe',    cur:'EUR', iss:'Membrane Finance', chains:['ethereum'] },
  { id:'eurt',    name:'EURT',     cur:'EUR', iss:'Tether',           chains:['ethereum','solana'] },
  { id:'eur0p',   name:'EURØP',    cur:'EUR', iss:'Schuman',          chains:['ethereum'] },
  { id:'eurq',    name:'EURQ',     cur:'EUR', iss:'Quantoz',          chains:['ethereum'] },
  { id:'eur0',    name:'Usual EUR',cur:'EUR', iss:'Usual',            chains:['ethereum'] },
  // GBP
  { id:'gbpm',    name:'GBPM',     cur:'GBP', iss:'Mento',            chains:['celo'] },
  { id:'gbpe',    name:'GBPE',     cur:'GBP', iss:'Monerium',         chains:['ethereum','gnosis'] },
  { id:'vgbp',    name:'VGBP',     cur:'GBP', iss:'VNX',              chains:['ethereum'] },
  // SGD
  { id:'xsgd',    name:'XSGD',     cur:'SGD', iss:'StraitsX',         chains:['ethereum','solana','polygon'] },
  // JPY
  { id:'jpyc',    name:'JPYC',     cur:'JPY', iss:'JPYC',             chains:['ethereum','polygon','gnosis','avalanche'] },
  { id:'gyen',    name:'GYEN',     cur:'JPY', iss:'GMO Trust',        chains:['ethereum','polygon'] },
  { id:'jpym',    name:'JPYM',     cur:'JPY', iss:'Mento',            chains:['celo'] },
  // AUD
  { id:'audd',    name:'AUDD',     cur:'AUD', iss:'Novatti',          chains:['ethereum','solana'] },
  { id:'audx',    name:'AUDX',     cur:'AUD', iss:'Stablecorp',       chains:['ethereum'] },
  { id:'audf',    name:'AUDF',     cur:'AUD', iss:'Forte AUD',        chains:['ethereum'] },
  { id:'audm',    name:'AUDM',     cur:'AUD', iss:'Mento',            chains:['celo'] },
  // CHF
  { id:'vchf',    name:'VCHF',     cur:'CHF', iss:'VNX',              chains:['ethereum'] },
  { id:'chfm',    name:'CHFM',     cur:'CHF', iss:'Mento',            chains:['celo'] },
  // CAD
  { id:'qcad',    name:'QCAD',     cur:'CAD', iss:'Stablecorp',       chains:['ethereum'] },
  { id:'cadm',    name:'CADM',     cur:'CAD', iss:'Mento',            chains:['celo'] },
  // MXN
  { id:'mxnb',    name:'MXNB',     cur:'MXN', iss:'Bitso',            chains:['ethereum','solana'] },
  { id:'wmxn',    name:'WMXN',     cur:'MXN', iss:'Wrapped Finance',  chains:['polygon'] },
  // BRL
  { id:'brlm',    name:'BRLM',     cur:'BRL', iss:'Mento',            chains:['celo'] },
  // ARS
  { id:'wars',    name:'WARS',     cur:'ARS', iss:'Wrapped Finance',  chains:['polygon'] },
  // CLP
  { id:'wclp',    name:'WCLP',     cur:'CLP', iss:'Wrapped Finance',  chains:['polygon'] },
  // COP
  { id:'wcop',    name:'WCOP',     cur:'COP', iss:'Wrapped Finance',  chains:['polygon'] },
  { id:'copm',    name:'COPM',     cur:'COP', iss:'Mento',            chains:['celo'] },
  // PEN
  { id:'wpen',    name:'WPEN',     cur:'PEN', iss:'Wrapped Finance',  chains:['polygon'] },
  // KES
  { id:'kesm',    name:'KESM',     cur:'KES', iss:'Mento',            chains:['celo'] },
  // NGN
  { id:'ngnm',    name:'NGNM',     cur:'NGN', iss:'Mento',            chains:['celo'] },
  // PHP
  { id:'phpm',    name:'PHPM',     cur:'PHP', iss:'Mento',            chains:['celo'] },
  // ZAR
  { id:'mzar',    name:'mZAR',     cur:'ZAR', iss:'Wrapped Finance',  chains:['polygon'] },
  { id:'zarm',    name:'ZARM',     cur:'ZAR', iss:'Mento',            chains:['celo'] },
  // MYR
  { id:'myrc',    name:'MYRC',     cur:'MYR', iss:'Blox',             chains:['ethereum'] },
  // GHS
  { id:'cghs',    name:'cGHS',     cur:'GHS', iss:'Celo',             chains:['celo'] },
];

// Currency metadata
const CUR_META = {
  EUR:{ name:'Euro',              flag:'🇪🇺', region:'Europe'     },
  GBP:{ name:'British Pound',    flag:'🇬🇧', region:'Europe'     },
  SGD:{ name:'Singapore Dollar', flag:'🇸🇬', region:'Asia-Pacific'},
  JPY:{ name:'Japanese Yen',     flag:'🇯🇵', region:'Asia-Pacific'},
  AUD:{ name:'Australian Dollar',flag:'🇦🇺', region:'Asia-Pacific'},
  CHF:{ name:'Swiss Franc',      flag:'🇨🇭', region:'Europe'     },
  CAD:{ name:'Canadian Dollar',  flag:'🇨🇦', region:'Americas'   },
  MXN:{ name:'Mexican Peso',     flag:'🇲🇽', region:'Americas'   },
  BRL:{ name:'Brazilian Real',   flag:'🇧🇷', region:'Americas'   },
  ARS:{ name:'Argentine Peso',   flag:'🇦🇷', region:'Americas'   },
  CLP:{ name:'Chilean Peso',     flag:'🇨🇱', region:'Americas'   },
  COP:{ name:'Colombian Peso',   flag:'🇨🇴', region:'Americas'   },
  PEN:{ name:'Peruvian Sol',     flag:'🇵🇪', region:'Americas'   },
  KES:{ name:'Kenyan Shilling',  flag:'🇰🇪', region:'Africa'     },
  NGN:{ name:'Nigerian Naira',   flag:'🇳🇬', region:'Africa'     },
  PHP:{ name:'Philippine Peso',  flag:'🇵🇭', region:'Asia-Pacific'},
  ZAR:{ name:'South African Rand',flag:'🇿🇦', region:'Africa'    },
  MYR:{ name:'Malaysian Ringgit',flag:'🇲🇾', region:'Asia-Pacific'},
  GHS:{ name:'Ghanaian Cedi',    flag:'🇬🇭', region:'Africa'     },
};

const TT_API = 'https://api.tokenterminal.com/v2';
const KV_KEY = 'nexus:data:v2';
const STALE_AFTER_MS = 22 * 60 * 60 * 1000; // 22 hours

// ── MAIN HANDLER ─────────────────────────────────────────────────────────────
export default {
  // HTTP handler
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Content-Type': 'application/json',
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });

    // Manual refresh endpoint
    if (url.pathname === '/refresh') {
      const key = url.searchParams.get('key');
      if (!env.ADMIN_KEY || key !== env.ADMIN_KEY) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors });
      }

      // Debug mode: test the per-asset endpoint with EURC
      if (url.searchParams.get('debug') === '1') {
        const apiKey = env.TT_API_KEY || '48c17a65-bb2f-45b5-a609-5debd0e5187f';
        const ttUrl = `${TT_API}/assets/eurc/metrics?metric_ids[]=asset_market_cap_circulating&interval=30d`;
        const r = await fetch(ttUrl, { headers: { Authorization: `Bearer ${apiKey}`, Accept: 'text/csv' } });
        const body = await r.text();
        return new Response(JSON.stringify({
          tt_status: r.status,
          tt_url: ttUrl,
          tt_body_preview: body.slice(0, 600),
          api_key_prefix: apiKey.slice(0, 8) + '...',
        }), { headers: cors });
      }

      try {
        const data = await fetchAndProcess(env);
        return new Response(JSON.stringify({ ok: true, assets: data.assets.length, ts: data.updated_at }), { headers: cors });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: cors });
      }
    }

    // Data endpoint
    if (url.pathname === '/data' || url.pathname === '/') {
      // Try KV first
      if (env.NEXUS_DATA) {
        const cached = await env.NEXUS_DATA.get(KV_KEY, { type: 'json' });
        if (cached) {
          const ageMs = Date.now() - new Date(cached.updated_at).getTime();
          // Return cached, trigger background refresh if stale
          if (ageMs > STALE_AFTER_MS) {
            // Fire-and-forget refresh
            fetchAndProcess(env).catch(console.error);
          }
          return new Response(JSON.stringify(cached), { headers: { ...cors, 'X-Cache': 'HIT', 'X-Age': Math.floor(ageMs/1000) + 's' } });
        }
      }
      // No cache — fetch live
      try {
        const data = await fetchAndProcess(env);
        return new Response(JSON.stringify(data), { headers: { ...cors, 'X-Cache': 'MISS' } });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: cors });
      }
    }

    return new Response('Not found', { status: 404 });
  },

  // Cron trigger
  async scheduled(event, env, ctx) {
    ctx.waitUntil(fetchAndProcess(env));
  },
};

const TT_METRICS = [
  'asset_market_cap_circulating',
  'asset_transfer_volume',
  'asset_transfer_count',
  'asset_dau',
  'asset_holders',
  'asset_mints',
  'asset_redemptions',
  'asset_price',
];

// ── MAIN DATA PIPELINE ────────────────────────────────────────────────────────
async function fetchAndProcess(env) {
  const apiKey = env.TT_API_KEY || '48c17a65-bb2f-45b5-a609-5debd0e5187f';
  const assetIds = [...new Set(ASSETS.map(a => a.id))];

  // 1. Fetch all assets in parallel — TT returns JSON with metric values as fields
  //    GET /v2/assets/{assetId}/metrics?metric_ids[]=...&interval=180d
  const [dataArrays, fxRates] = await Promise.all([
    Promise.all(assetIds.map(id => fetchAsset(apiKey, id, TT_METRICS, '180d'))),
    fetchFXRates(),
  ]);

  // 2. Build per-asset timeseries: { assetId → { metricId → [{ts, v}] } }
  const allPts = {};
  for (const points of dataArrays) {
    if (!points || !points.length) continue;
    for (const pt of points) {
      const id = pt.asset_id;
      if (!allPts[id]) allPts[id] = {};
      for (const m of TT_METRICS) {
        if (pt[m] != null) {
          if (!allPts[id][m]) allPts[id][m] = [];
          allPts[id][m].push({ ts: pt.timestamp, v: Number(pt[m]) || 0 });
        }
      }
    }
  }

  // Helper: get sorted, sliced values array for an asset+metric
  function getSeries(assetId, metricId, maxDays) {
    const pts = (allPts[assetId] || {})[metricId] || [];
    pts.sort((a, b) => a.ts.localeCompare(b.ts));
    return pts.slice(-maxDays).map(r => r.v);
  }

  // 4. Build per-asset records
  const now = new Date().toISOString();
  const assets = [];
  const seen = new Set();
  const dauSeriesMap = {};   // v5: top-level map { assetId → [values] }
  const txnSeriesMap = {};   // v5: top-level map { assetId → [values] }

  for (const assetMeta of ASSETS) {
    const id = assetMeta.id;
    if (seen.has(id)) continue;
    seen.add(id);

    const mcArr   = getSeries(id, 'asset_market_cap_circulating', 180);
    const volArr  = getSeries(id, 'asset_transfer_volume',         30);
    const txnArr  = getSeries(id, 'asset_transfer_count',           30);
    const dauArr  = getSeries(id, 'asset_dau',                      30);
    const holdArr = getSeries(id, 'asset_holders',                  30);
    const mintArr = getSeries(id, 'asset_mints',                    30);
    const redArr  = getSeries(id, 'asset_redemptions',              30);
    const priceArr= getSeries(id, 'asset_price',                    30);

    if (mcArr.length === 0) continue; // skip assets with no data

    const mcLatest  = mcArr.at(-1)   ?? 0;
    const mc30ago   = mcArr.length >= 30  ? mcArr.at(-30)  : mcArr[0];
    const mc90ago   = mcArr.length >= 90  ? mcArr.at(-90)  : mcArr[0];
    const mc180ago  = mcArr[0] ?? mcLatest;

    const volSum30  = volArr.reduce((s, v) => s + (v ?? 0), 0);
    const txnSum30  = txnArr.reduce((s, v) => s + (v ?? 0), 0);
    const dauLatest = dauArr.at(-1) ?? 0;
    const holdLatest= holdArr.at(-1) ?? 0;
    const mintSum30 = mintArr.reduce((s, v) => s + (v ?? 0), 0);
    const redSum30  = redArr.reduce((s, v) => s + (v ?? 0), 0);
    const priceLatest = priceArr.at(-1) ?? 0;

    // Peg deviation (basis points)
    const fxRate = fxRates[assetMeta.cur]; // USD per 1 unit of reference currency
    const pegDevBps = fxRate && priceLatest
      ? Math.round((priceLatest / fxRate - 1) * 10000)
      : null;

    // Velocity ratio (vol/mc)
    const velocityRatio = mcLatest > 0 ? volSum30 / mcLatest : null;

    // Pct changes
    const mc30pct  = mc30ago  > 0 ? ((mcLatest - mc30ago)  / mc30ago)  * 100 : null;
    const mc90pct  = mc90ago  > 0 ? ((mcLatest - mc90ago)  / mc90ago)  * 100 : null;
    const mc180pct = mc180ago > 0 ? ((mcLatest - mc180ago) / mc180ago) * 100 : null;

    // Net flow
    const netFlow30 = mintSum30 - redSum30;

    // v5: store series in top-level maps (avoids per-asset bundler issues)
    dauSeriesMap[id] = dauArr;
    txnSeriesMap[id] = txnArr;

    assets.push({
      id,
      name:         assetMeta.name,
      cur:          assetMeta.cur,
      iss:          assetMeta.iss,
      chains:       assetMeta.chains,
      mc:           mcLatest,
      mc30pct,
      mc90pct,
      mc180pct,
      vol30:        volSum30,
      txn30:        txnSum30,
      dau:          dauLatest,
      holders:      holdLatest,
      mints30:      mintSum30,
      redems30:     redSum30,
      netFlow30,
      price:        priceLatest,
      pegDevBps,
      velocityRatio,
      mc_series:    mcArr,
      price_series: priceArr.slice(-30),
    });
  }

  // 5. Sort by market cap
  assets.sort((a, b) => b.mc - a.mc);

  // 6. Build currency-level aggregates
  const byCur = {};
  for (const a of assets) {
    if (!byCur[a.cur]) byCur[a.cur] = { cur: a.cur, ...CUR_META[a.cur], mc: 0, vol30: 0, holders: 0, mints30: 0, redems30: 0, assets: [] };
    byCur[a.cur].mc       += a.mc;
    byCur[a.cur].vol30    += a.vol30;
    byCur[a.cur].holders  += a.holders;
    byCur[a.cur].mints30  += a.mints30;
    byCur[a.cur].redems30 += a.redems30;
    byCur[a.cur].assets.push(a.id);
  }
  const currencies = Object.values(byCur).sort((a, b) => b.mc - a.mc);

  // 7. Sector totals
  const totMC     = assets.reduce((s, a) => s + a.mc, 0);
  const totVol30  = assets.reduce((s, a) => s + a.vol30, 0);
  const totTxn30  = assets.reduce((s, a) => s + a.txn30, 0);
  const totDAU    = assets.reduce((s, a) => s + a.dau, 0);
  const totHold   = assets.reduce((s, a) => s + a.holders, 0);
  const chains    = new Set(assets.flatMap(a => a.chains || [])).size;

  // 8. Top gainer/loser (30d, min $100K mc)
  const qualified = assets.filter(a => a.mc >= 100_000 && a.mc30pct !== null);
  const topGainer = qualified.reduce((best, a) => (!best || a.mc30pct > best.mc30pct ? a : best), null);
  const topLoser  = qualified.reduce((best, a) => (!best || a.mc30pct < best.mc30pct ? a : best), null);

  const result = {
    updated_at: now,
    fx_rates: fxRates,
    sector: { totMC, totVol30, totTxn30, totDAU, totHold, chains, assetCount: assets.length, curCount: currencies.length },
    top_gainer: topGainer ? { id: topGainer.id, name: topGainer.name, pct: topGainer.mc30pct } : null,
    top_loser:  topLoser  ? { id: topLoser.id,  name: topLoser.name,  pct: topLoser.mc30pct  } : null,
    assets,
    currencies,
    dau_series: dauSeriesMap,  // v5: top-level map { assetId → 30d daily senders }
    txn_series: txnSeriesMap,  // v5: top-level map { assetId → 30d daily transfers }
  };

  // 9. Store in KV
  if (env.NEXUS_DATA) {
    await env.NEXUS_DATA.put(KV_KEY, JSON.stringify(result), { expirationTtl: 7 * 24 * 3600 });
  }

  return result;
}

// ── TT API FETCH (per-asset, returns JSON array) ──────────────────────────────
// Endpoint: GET /v2/assets/{assetId}/metrics?metric_ids[]=...&interval=...
// Response: { data: [{timestamp, asset_id, product_id, metric_name: value, ...}] }
async function fetchAsset(apiKey, assetId, metricIds, interval) {
  const params = new URLSearchParams();
  for (const m of metricIds) params.append('metric_ids[]', m);
  params.append('interval', interval);

  const url = `${TT_API}/assets/${assetId}/metrics?${params.toString()}`;
  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    console.error(`TT API error for ${assetId}: ${resp.status} ${body.slice(0, 120)}`);
    return null;
  }
  const json = await resp.json().catch(() => null);
  return json?.data || null;
}

// parseSeries removed — TT API now returns JSON; parsing is done inline in fetchAndProcess via getSeries()

// ── FX RATES (frankfurter.app — ECB data, free) ──────────────────────────────
async function fetchFXRates() {
  try {
    // Returns rates relative to EUR base; we need USD per each currency
    const resp = await fetch('https://api.frankfurter.app/latest?from=USD&to=EUR,GBP,SGD,JPY,AUD,CHF,CAD,MXN,BRL,ARS,CLP,COP,PEN,KES,NGN,PHP,ZAR,MYR,GHS');
    if (!resp.ok) throw new Error('FX fetch failed');
    const json = await resp.json();
    // json.rates = { EUR: 0.92, GBP: 0.79, ... } — these are "X units of currency per 1 USD"
    // We want "USD per 1 unit of currency" for peg deviation
    const usdPerCur = {};
    for (const [cur, rate] of Object.entries(json.rates)) {
      usdPerCur[cur] = 1 / rate; // USD per 1 EUR, GBP, etc.
    }
    return usdPerCur;
  } catch (e) {
    console.error('FX fetch error:', e);
    // Fallback hardcoded rates (updated 2026-03-19)
    return {
      EUR: 1.082, GBP: 1.293, SGD: 0.748, JPY: 0.00667, AUD: 0.632,
      CHF: 1.127, CAD: 0.739, MXN: 0.0491, BRL: 0.177,  ARS: 0.00101,
      CLP: 0.00107, COP: 0.000245, PEN: 0.266, KES: 0.00773, NGN: 0.000624,
      PHP: 0.0174, ZAR: 0.0545, MYR: 0.224, GHS: 0.0665,
    };
  }
}
