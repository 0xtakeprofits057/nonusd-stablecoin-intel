// ── Non-USD Stablecoin Dashboard — Cloudflare Worker ─────────────────────────
// Cron-triggered every 6 hours. Fetches all non-USD stablecoin data from
// Token Terminal, discovers new assets dynamically, and caches results in KV.
// The dashboard fetches from this Worker instead of hitting TT directly.
// ─────────────────────────────────────────────────────────────────────────────

const TT_KEY  = '48c17a65-bb2f-45b5-a609-5debd0e5187f';
const TT_BASE = 'https://api.tokenterminal.com/v2';
const KV_KEY  = 'nsi_data';

// ── Known non-USD asset seed list ────────────────────────────────────────────
// This is the starting set; discovery adds new ones automatically.
const SEED_ASSETS = [
  {id:"eurc",  name:"EURC",  cur:"EUR", iss:"Circle",          type:"C"},
  {id:"eure",  name:"EURE",  cur:"EUR", iss:"Monerium",         type:"C"},
  {id:"eurs",  name:"EURS",  cur:"EUR", iss:"STASIS",           type:"C"},
  {id:"eura",  name:"EURA",  cur:"EUR", iss:"Angle",            type:"D"},
  {id:"eurm",  name:"EURM",  cur:"EUR", iss:"Mento Labs",       type:"C"},
  {id:"eurr",  name:"EURR",  cur:"EUR", iss:"StablR",           type:"C"},
  {id:"eurq",  name:"EURQ",  cur:"EUR", iss:"Quantoz",          type:"C"},
  {id:"eur0",  name:"EUR0",  cur:"EUR", iss:"Level-01",         type:"C"},
  {id:"eur0p", name:"EUR0+", cur:"EUR", iss:"Level-01",         type:"C"},
  {id:"eurcv", name:"EURCV", cur:"EUR", iss:"Soc. Générale",    type:"C"},
  {id:"veur",  name:"VEUR",  cur:"EUR", iss:"VNX",              type:"C"},
  {id:"eurt",  name:"EURT",  cur:"EUR", iss:"Tether",           type:"C"},
  {id:"eurau", name:"EURAU", cur:"EUR", iss:"AllUnity",         type:"D"},
  {id:"eurot", name:"EUROT", cur:"EUR", iss:"Token Teknoloji",  type:"C"},
  {id:"par",   name:"PAR",   cur:"EUR", iss:"Mimo Capital",     type:"D"},
  {id:"ibeur", name:"ibEUR", cur:"EUR", iss:"Iron Bank",        type:"D"},
  {id:"aryzeeeur",name:"eEUR",cur:"EUR", iss:"ARYZE",           type:"C"},
  {id:"euro3", name:"EURO3", cur:"EUR", iss:"3A DAO",           type:"D"},
  {id:"euroe", name:"EUROe", cur:"EUR", iss:"Membrane Finance", type:"C"},
  {id:"aeur",  name:"AEUR",  cur:"EUR", iss:"Anchored Coins",  type:"C"},
  {id:"seur",  name:"sEUR",  cur:"EUR", iss:"Synthetix",       type:"D"},
  {id:"egbp",  name:"eGBP",  cur:"GBP", iss:"ARYZE",           type:"C"},
  {id:"gbpm",  name:"GBPM",  cur:"GBP", iss:"Mento Labs",       type:"C"},
  {id:"gbpe",  name:"GBPE",  cur:"GBP", iss:"Backed",           type:"C"},
  {id:"vgbp",  name:"VGBP",  cur:"GBP", iss:"VNX",              type:"C"},
  {id:"jpyc",  name:"JPYC",  cur:"JPY", iss:"JPYC Inc.",        type:"C"},
  {id:"jpym",  name:"JPYM",  cur:"JPY", iss:"Mento Labs",       type:"C"},
  {id:"gyen",  name:"GYEN",  cur:"JPY", iss:"GMO Internet",     type:"C"},
  {id:"cjpy",  name:"CJPY",  cur:"JPY", iss:"Yamato Protocol",  type:"D"},
  {id:"chfm",  name:"CHFM",  cur:"CHF", iss:"Mento Labs",       type:"C"},
  {id:"vchf",  name:"VCHF",  cur:"CHF", iss:"VNX",              type:"C"},
  {id:"zchf",  name:"ZCHF",  cur:"CHF", iss:"Frankencoin",      type:"D"},
  {id:"achf",  name:"ACHF",  cur:"CHF", iss:"Anchored Coins",   type:"C"},
  {id:"dchf",  name:"DCHF",  cur:"CHF", iss:"DeFi Franc",       type:"D"},
  {id:"cadm",  name:"CADM",  cur:"CAD", iss:"Mento Labs",       type:"C"},
  {id:"qcad",  name:"QCAD",  cur:"CAD", iss:"Stablecorp",       type:"C"},
  {id:"cadc",  name:"CADC",  cur:"CAD", iss:"PayTrie",          type:"C"},
  {id:"audm",  name:"AUDM",  cur:"AUD", iss:"Mento Labs",       type:"C"},
  {id:"audd",  name:"AUDD",  cur:"AUD", iss:"Novatti",          type:"C"},
  {id:"audx",  name:"AUDX",  cur:"AUD", iss:"STASIS",           type:"C"},
  {id:"audf",  name:"AUDF",  cur:"AUD", iss:"Forte",            type:"C"},
  {id:"mxnb",  name:"MXNB",  cur:"MXN", iss:"Bitso",            type:"C"},
  {id:"wmxn",  name:"WMXN",  cur:"MXN", iss:"Wrapped Finance",  type:"D"},
  {id:"copm",  name:"COPM",  cur:"COP", iss:"Mento Labs",       type:"C"},
  {id:"wcop",  name:"WCOP",  cur:"COP", iss:"Wrapped Finance",  type:"D"},
  {id:"brlm",  name:"BRLM",  cur:"BRL", iss:"Mento Labs",       type:"C"},
  {id:"brz",   name:"BRZ",   cur:"BRL", iss:"Transfero",        type:"C"},
  {id:"wars",  name:"WARS",  cur:"ARS", iss:"Wrapped Finance",  type:"D"},
  {id:"wclp",  name:"WCLP",  cur:"CLP", iss:"Wrapped Finance",  type:"D"},
  {id:"wpen",  name:"WPEN",  cur:"PEN", iss:"Wrapped Finance",  type:"D"},
  {id:"tryb",  name:"TRYB",  cur:"TRY", iss:"BiLira",           type:"C"},
  {id:"phpm",  name:"PHPM",  cur:"PHP", iss:"Mento Labs",       type:"C"},
  {id:"pht",   name:"PHT",   cur:"PHP", iss:"Apacx",            type:"C"},
  {id:"zarm",  name:"ZARM",  cur:"ZAR", iss:"Mento Labs",       type:"D"},
  {id:"mzar",  name:"mZAR",  cur:"ZAR", iss:"Mesh",             type:"C"},
  {id:"kesm",  name:"KESM",  cur:"KES", iss:"Mento Labs",       type:"C"},
  {id:"myrc",  name:"MYRC",  cur:"MYR", iss:"Ringgit Protocol", type:"D"},
  {id:"ngnm",  name:"NGNM",  cur:"NGN", iss:"Mento Labs",       type:"C"},
  {id:"xsgd",  name:"XSGD",  cur:"SGD", iss:"Xfers/Fazz",       type:"C"},
  {id:"cghs",  name:"CGHS",  cur:"GHS", iss:"Mento Labs",       type:"C"},
];

// Yield/non-fiat tokens to always exclude
const EXCLUDE = new Set(['float','rai','volt','zuneth','zunusd','feth']);

// USD keyword patterns — if any match, the asset is USD-pegged
const USD_PATTERNS = /usd|busd|dai$|frax|dola|gho|lusd|tusd|gusd|pyusd|cusd|bold|musd|pusd|nusd|susd|vai|cash|fidd|frnt|fxd|hollar|honey|money|sbc|ush$|usr$|uty|^yu$/i;

// Non-USD currency inference from asset IDs
const CUR_KW = {
  EUR:['eur','euro'],GBP:['gbp'],CHF:['chf','franc'],JPY:['jpy','yen'],
  AUD:['aud'],CAD:['cad'],MXN:['mxn','mexican'],BRL:['brl','brz','brazilian'],
  PHP:['php','pht','philippine'],MYR:['myr','ringgit'],NGN:['ngn','naira'],
  KES:['kes','shilling'],ZAR:['zar','rand'],GHS:['ghs','cedi'],
  ARS:['ars','argentine'],CLP:['clp','chilean'],COP:['cop','colombian'],
  PEN:['pen','peruvian'],TRY:['try','lira'],SGD:['sgd','singapore'],
};

function inferCurrency(id) {
  const l = id.toLowerCase();
  for (const [cur, kws] of Object.entries(CUR_KW)) {
    if (kws.some(kw => l.includes(kw))) return cur;
  }
  return null;
}

// ── Token Terminal API helpers ───────────────────────────────────────────────

async function ttFetchAssetMetrics(assetId, metricIds, groupBy = null, startDate = null, endDate = null) {
  const qs = new URLSearchParams();
  metricIds.forEach(m => qs.append('metric_ids[]', m));
  if (groupBy) qs.set('groupBy', groupBy);
  if (startDate) qs.set('start', startDate);
  if (endDate) qs.set('end', endDate);

  const url = `${TT_BASE}/assets/${assetId}/metrics?${qs}`;
  try {
    const resp = await fetch(url, {
      headers: { 'Authorization': `Bearer ${TT_KEY}`, 'Accept': 'application/json' }
    });
    if (!resp.ok) {
      console.error(`TT API ${resp.status} for asset ${assetId}: ${resp.statusText}`);
      return [];
    }
    const json = await resp.json();
    return json.data || [];
  } catch (e) {
    console.error(`Fetch failed for asset ${assetId}:`, e);
    return [];
  }
}

// ── Discovery: find new non-USD assets in TT's catalog ──────────────────────

async function discoverAssets(knownIds) {
  // No bulk discovery endpoint available. Return empty list.
  // Discovery via /v2/market-sectors/stablecoins would require a separate endpoint.
  // For now, rely on SEED_ASSETS list.
  console.log('[NSI Worker] Discovery: no bulk endpoint available, relying on SEED_ASSETS');
  return [];
}

// ── Main data fetch + processing ─────────────────────────────────────────────

async function fetchAllData(assets) {
  const now = Date.now();
  const today = new Date(now).toISOString().slice(0, 10);
  const ago30d = new Date(now - 30 * 86400000).toISOString().slice(0, 10);
  const ago180d = new Date(now - 180 * 86400000).toISOString().slice(0, 10);

  console.log(`[NSI Worker] Fetching data for ${assets.length} assets. Today: ${today}, -30d: ${ago30d}, -180d: ${ago180d}`);

  // ── Single call per asset (all metrics combined) ─────────────────────────
  // Cloudflare Workers free plan: 50 subrequest limit.
  // 1 call per asset × 60 assets = 60 calls → we cap at 48 to stay safe.
  const ALL_METRICS = ['asset_market_cap_circulating','asset_transfer_volume','asset_dau','asset_transfer_count','asset_holders','asset_mints','asset_redemptions'];
  const MAX_SUBREQUESTS = 48;
  const assetsToFetch = assets.slice(0, MAX_SUBREQUESTS);
  console.log(`[NSI Worker] Fetching ${assetsToFetch.length}/${assets.length} assets (subrequest budget: ${MAX_SUBREQUESTS})`);

  const BATCH_SIZE = 10;
  let allRows = [];

  for (let i = 0; i < assetsToFetch.length; i += BATCH_SIZE) {
    const batch = assetsToFetch.slice(i, i + BATCH_SIZE);
    console.log(`[NSI Worker] Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.map(a => a.id).join(', ')}`);

    const results = await Promise.all(
      batch.map(asset => ttFetchAssetMetrics(asset.id, ALL_METRICS, null, ago180d, today))
    );
    results.forEach(rows => allRows.push(...rows));
  }

  console.log(`[NSI Worker] Fetched ${allRows.length} total rows`);

  // Split rows into mc/multi for processing (same rows serve both purposes)
  const mcRows = allRows;
  const multiRows = allRows;
  const chainRows = []; // Skip chain breakdown to save subrequests

  // ── Group MC by asset → sorted by timestamp ──────────────────────────────
  const mcByAsset = {};
  for (const r of mcRows) {
    if (!r.asset_id) continue;
    const ts = r.timestamp;
    const v = r.asset_market_cap_circulating || 0;
    (mcByAsset[r.asset_id] ||= []).push({ ts, v });
  }
  for (const aid in mcByAsset) mcByAsset[aid].sort((a, b) => a.ts < b.ts ? -1 : 1);

  // ── Group multi-metric rows ──────────────────────────────────────────────
  const multiByAsset = {};
  for (const r of multiRows) {
    if (!r.asset_id) continue;
    const ts = r.timestamp;
    // Map field names from API response
    const metrics = {
      'asset_market_cap_circulating': r.asset_market_cap_circulating,
      'asset_transfer_volume': r.asset_transfer_volume,
      'asset_dau': r.asset_dau,
      'asset_transfer_count': r.asset_transfer_count,
      'asset_holders': r.asset_holders,
      'asset_mints': r.asset_mints,
      'asset_redemptions': r.asset_redemptions,
    };
    for (const [mid, val] of Object.entries(metrics)) {
      if (val === undefined || val === null) continue;
      ((multiByAsset[r.asset_id] ||= {})[mid] ||= []).push({ ts, v: val });
    }
  }

  const latestVal = (aid, mid) => {
    const pts = multiByAsset[aid]?.[mid];
    if (!pts?.length) return 0;
    pts.sort((a, b) => a.ts < b.ts ? -1 : 1);
    return pts[pts.length - 1].v;
  };
  const sumVals = (aid, mid) => {
    const pts = multiByAsset[aid]?.[mid];
    return pts ? pts.reduce((s, p) => s + p.v, 0) : 0;
  };

  // ── MC_SERIES (sampled to ≤30 points) ─────────────────────────────────────
  const MC_SERIES = {};
  for (const aid in mcByAsset) {
    const pts = mcByAsset[aid];
    if (!pts.length) continue;
    const step = Math.max(1, Math.floor(pts.length / 30));
    const sampled = [];
    for (let i = 0; i < pts.length; i += step) sampled.push(Math.round(pts[i].v));
    const last = Math.round(pts[pts.length - 1].v);
    if (sampled[sampled.length - 1] !== last) sampled.push(last);
    MC_SERIES[aid] = sampled;
  }

  // ── DAU + TXN series ──────────────────────────────────────────────────────
  const DAU_SERIES = {}, TXN_SERIES = {};
  for (const aid in multiByAsset) {
    for (const mid of ['asset_dau', 'asset_transfer_count']) {
      const pts = multiByAsset[aid][mid];
      if (!pts?.length) continue;
      pts.sort((a, b) => a.ts < b.ts ? -1 : 1);
      const step = Math.max(1, Math.floor(pts.length / 14));
      const sampled = [];
      for (let i = 0; i < pts.length; i += step) sampled.push(Math.round(pts[i].v));
      if (mid === 'asset_dau') DAU_SERIES[aid] = sampled;
      else TXN_SERIES[aid] = sampled;
    }
  }

  // ── ACTIVITY ──────────────────────────────────────────────────────────────
  const ACTIVITY = {};
  const allIds = new Set([...Object.keys(mcByAsset), ...Object.keys(multiByAsset)]);
  for (const aid of allIds) {
    ACTIVITY[aid] = { dau: latestVal(aid, 'asset_dau'), txn: latestVal(aid, 'asset_transfer_count') };
  }

  // ── MC change % ───────────────────────────────────────────────────────────
  function pctChange(aid, days) {
    const pts = mcByAsset[aid];
    if (!pts?.length) return null;
    const latest = pts[pts.length - 1].v;
    const cutoff = new Date(now - days * 86400000).toISOString().slice(0, 10);
    const old = pts.find(p => p.ts >= cutoff);
    if (!old || old.v === 0) return null;
    return parseFloat(((latest - old.v) / old.v * 100).toFixed(1));
  }

  // ── ASSETS array ──────────────────────────────────────────────────────────
  const ASSETS = assets.map(meta => {
    const pts = mcByAsset[meta.id] || [];
    return {
      ...meta,
      mc:    pts.length ? pts[pts.length - 1].v : 0,
      mc30:  pctChange(meta.id, 30),
      mc90:  pctChange(meta.id, 90),
      mc180: pctChange(meta.id, 180),
      v30:   sumVals(meta.id, 'asset_transfer_volume'),
      h:     latestVal(meta.id, 'asset_holders'),
      m30:   sumVals(meta.id, 'asset_mints'),
      r30:   sumVals(meta.id, 'asset_redemptions'),
    };
  });

  // ── CHAIN_DATA ────────────────────────────────────────────────────────────
  const CHAIN_DATA = {};
  for (const r of chainRows) {
    const ch = r.chain_id;
    if (!ch) continue;
    if (!CHAIN_DATA[ch]) CHAIN_DATA[ch] = { mc: 0, assets: new Set() };
    CHAIN_DATA[ch].assets.add(r.asset_id);
    CHAIN_DATA[ch].mc += (r.asset_market_cap_circulating || 0);
  }
  // Convert Sets to arrays
  for (const ch in CHAIN_DATA) CHAIN_DATA[ch].assets = [...CHAIN_DATA[ch].assets];

  // ── Continent series ──────────────────────────────────────────────────────
  const CONT_GROUPS = {
    'Europe':      assets.filter(a => ['EUR','GBP','CHF','SEK','NOK','DKK','PLN','CZK','HUF','RON','TRY'].includes(a.cur)).map(a => a.id),
    'Asia-Pacific': assets.filter(a => ['JPY','AUD','SGD','PHP','MYR','IDR','THB','INR','KRW','HKD','TWD','NZD'].includes(a.cur)).map(a => a.id),
    'Americas':    assets.filter(a => ['CAD','MXN','BRL','ARS','CLP','COP','PEN'].includes(a.cur)).map(a => a.id),
    'Africa':      assets.filter(a => ['NGN','KES','ZAR','GHS'].includes(a.cur)).map(a => a.id),
  };

  const allDates = new Set();
  for (const aid in mcByAsset) mcByAsset[aid].forEach(p => allDates.add(p.ts.slice(0, 10)));
  const sortedDates = [...allDates].sort();
  const step2 = Math.max(1, Math.floor(sortedDates.length / 31));
  const CONT_DATES = [];
  for (let i = 0; i < sortedDates.length; i += step2) CONT_DATES.push(sortedDates[i]);
  if (CONT_DATES.length && CONT_DATES[CONT_DATES.length - 1] !== sortedDates[sortedDates.length - 1]) {
    CONT_DATES.push(sortedDates[sortedDates.length - 1]);
  }

  const mcLookup = {};
  for (const aid in mcByAsset) {
    for (const p of mcByAsset[aid]) {
      (mcLookup[p.ts.slice(0, 10)] ||= {})[aid] = p.v;
    }
  }
  const getVal = (aid, date) => mcLookup[date]?.[aid] ?? 0;

  const CONT_SERIES = {};
  for (const cont in CONT_GROUPS) CONT_SERIES[cont] = { abs: [], pct: [] };
  for (const date of CONT_DATES) {
    let grand = 0;
    const totals = {};
    for (const cont in CONT_GROUPS) {
      const t = CONT_GROUPS[cont].reduce((s, aid) => s + getVal(aid, date), 0);
      totals[cont] = t;
      grand += t;
    }
    for (const cont in CONT_GROUPS) {
      CONT_SERIES[cont].abs.push(Math.round(totals[cont]));
      CONT_SERIES[cont].pct.push(grand > 0 ? parseFloat((totals[cont] / grand * 100).toFixed(2)) : 0);
    }
  }

  return { ASSETS, MC_SERIES, DAU_SERIES, TXN_SERIES, ACTIVITY, CHAIN_DATA, CONT_DATES, CONT_SERIES };
}

// ── Worker entry point ───────────────────────────────────────────────────────

export default {
  // HTTP handler — serves cached data to dashboard
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

    if (url.pathname === '/data') {
      try {
        const cached = await env.NSI_KV.get(KV_KEY);
        if (cached) {
          return new Response(cached, {
            headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600' }
          });
        }
        // No cache — trigger a fresh fetch
        const data = await refreshData(env);
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Health check
    if (url.pathname === '/health') {
      const cached = await env.NSI_KV.get(KV_KEY);
      const meta = cached ? JSON.parse(cached) : null;
      return new Response(JSON.stringify({
        status: 'ok',
        lastUpdate: meta?.ts ? new Date(meta.ts).toISOString() : null,
        assetCount: meta?.data?.ASSETS?.length || 0,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response('Non-USD Stablecoin Data Worker. GET /data for latest data, /health for status.', {
      headers: corsHeaders
    });
  },

  // Cron trigger — runs every 6 hours
  async scheduled(event, env, ctx) {
    ctx.waitUntil(refreshData(env));
  }
};

async function refreshData(env) {
  console.log('[NSI Worker] Starting data refresh...');
  const start = Date.now();

  // Start with seed assets
  const assets = [...SEED_ASSETS];
  const knownIds = new Set(assets.map(a => a.id));

  // Discover new assets
  const discovered = await discoverAssets(knownIds);
  if (discovered.length) {
    console.log(`[NSI Worker] Discovered ${discovered.length} new assets:`, discovered.map(a => a.id));
    assets.push(...discovered);
  }

  // Fetch all data
  const data = await fetchAllData(assets);

  // Filter out assets with zero market cap (no TT data)
  data.ASSETS = data.ASSETS.filter(a => a.mc > 0);

  const payload = { ts: Date.now(), data, discoveredAssets: discovered.map(a => a.id) };
  const json = JSON.stringify(payload);

  // Store in KV (TTL: 24 hours — stale data available as fallback)
  await env.NSI_KV.put(KV_KEY, json, { expirationTtl: 86400 });

  console.log(`[NSI Worker] Refresh complete in ${Date.now() - start}ms. ${data.ASSETS.length} assets with data.`);
  return payload;
}
