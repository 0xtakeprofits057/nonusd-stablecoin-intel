# Token Terminal Asset Audit — Non-USD Stablecoin Dashboard

**Date:** March 27, 2026
**Source:** Token Terminal MCP (`discover` + `get_timeseries`)
**Dashboard version:** v21 (40 assets tracked)
**Token Terminal catalog:** 48 non-USD stablecoins found

---

## Summary

Token Terminal tracks **48 non-USD stablecoins**. Our dashboard currently covers **40**. After cross-referencing, there are **8 genuinely new fiat-pegged assets** worth evaluating, plus 2 yield-strategy tokens (RAI, FLOAT) that are not fiat-pegged and should likely be excluded. Three assets (TRYB, QCAD, CADC) exist in TT's catalog but returned no market cap data — likely inactive or delisted.

---

## HIGH PRIORITY — Must Add

These two assets are **larger than most tokens already on the dashboard** and represent significant gaps in coverage.

### 1. BRZ — Transfero BRZ (Brazilian Real)
| Metric | Value |
|--------|-------|
| **Asset ID** | `brz` |
| **Currency** | BRL (Brazilian Real) |
| **Issuer** | Transfero (Brazilian Digital) |
| **Market Cap** | $43,548,443 |
| **Type** | Centralized |
| **Why add** | Largest missing asset by far. BRL is already represented on the dashboard via BRLM ($209K), but BRZ is **208x larger**. Brazil is one of the largest crypto markets globally. This is a critical gap. |

### 2. ZCHF — Frankencoin (Swiss Franc)
| Metric | Value |
|--------|-------|
| **Asset ID** | `zchf` |
| **Currency** | CHF (Swiss Franc) |
| **Issuer** | Frankencoin (decentralized) |
| **Market Cap** | $37,013,361 |
| **Type** | Decentralized |
| **Why add** | Second-largest missing asset. CHF is already on the dashboard via CHFM ($33K) and VCHF (no TT data), but ZCHF is **~1,100x larger than CHFM**. A decentralized, collateralized CHF stablecoin — dramatically changes the CHF landscape on the dashboard. |

---

## MEDIUM PRIORITY — Worth Adding

### 3. PHT — Apacx PHT (Philippine Peso)
| Metric | Value |
|--------|-------|
| **Asset ID** | `pht` |
| **Currency** | PHP (Philippine Peso) |
| **Issuer** | Apacx |
| **Market Cap** | $4,649,919 |
| **Type** | Centralized |
| **Why add** | Complements existing PHPM ($109K). PHT is ~42x larger and would make PHP a much more significant currency on the dashboard. |

### 4. PAR — Mimo Capital PAR (Euro)
| Metric | Value |
|--------|-------|
| **Asset ID** | `par` |
| **Currency** | EUR (Euro) |
| **Issuer** | Mimo Capital |
| **Market Cap** | $1,538,398 |
| **Type** | Decentralized |
| **Why add** | Another EUR stablecoin. Dashboard already has 13 EUR assets, so marginal value is lower — but PAR is a decentralized option that adds to the CeD comparison feature. |

### 5. CJPY — Yamato Protocol CJPY (Japanese Yen)
| Metric | Value |
|--------|-------|
| **Asset ID** | `cjpy` |
| **Currency** | JPY (Japanese Yen) |
| **Issuer** | Yamato Protocol |
| **Market Cap** | $491,332 |
| **Type** | Decentralized |
| **Why add** | Only decentralized JPY stablecoin. Dashboard has 3 centralized JPY assets (JPYC, JPYM, GYEN) but zero decentralized. Adds diversity to JPY and strengthens CeD comparison. |

### 6. EUROT — Token Teknoloji (Euro)
| Metric | Value |
|--------|-------|
| **Asset ID** | `eurot` |
| **Currency** | EUR (Euro) |
| **Issuer** | Token Teknoloji A.Ş. (Turkey) |
| **Market Cap** | $184,645 |
| **Type** | Centralized |
| **Why add** | Small but notable — a Turkish-issued EUR stablecoin. Adds geographic diversity to EUR issuers. Low priority given 13 existing EUR assets. |

---

## LOW PRIORITY / SKIP

### 7. ibEUR — Iron Bank Euro
| Market Cap | $36,631 |
|---|---|
| **Recommendation** | **Skip** — tiny market cap, legacy DeFi (Iron Bank/Fixed Forex). Likely inactive. |

### 8. eEUR — ARYZE eEUR
| Market Cap | $18,893 |
|---|---|
| **Recommendation** | **Skip** — under $20K. Too small to be meaningful. |

---

## EXCLUDE — Not Fiat-Pegged

| Asset | Market Cap | Reason |
|-------|-----------|--------|
| **RAI** (Reflex Index) | $1,799,445 | Yield strategy / reflexive index, not pegged to any fiat currency |
| **FLOAT** (Float Protocol) | $347,442 | Yield strategy, not pegged to any fiat currency |

These are classified as "stablecoins" by Token Terminal but don't fit the dashboard's scope of fiat-currency-pegged non-USD stablecoins.

---

## NO DATA — Cannot Evaluate

| Asset | Currency | Notes |
|-------|----------|-------|
| **TRYB** (BiLira) | TRY (Turkish Lira) | Exists in TT catalog but returned no market cap data. Likely delisted or inactive. Would be valuable if active — only TRY stablecoin. Worth monitoring. |
| **QCAD** | CAD (Canadian Dollar) | No data returned. |
| **CADC** (PayTrie) | CAD (Canadian Dollar) | No data returned. |

---

## Potential Issuer Mismatches Found

While auditing, I noticed some potential discrepancies between our dashboard's issuer attribution and Token Terminal's records:

| Asset ID | Our Dashboard Says | Token Terminal Says | Note |
|----------|-------------------|--------------------|----- |
| `eurm` | VNX | Mento Euro (Mento Labs) | May be different tokens sharing same ID on Celo |
| `gbpm` | Monerium | Mento British Pound (Mento Labs) | Same potential issue |
| `eurr` | Crypto.com | StablR Euro | Needs verification |

These might be cases where TT and our data source track slightly different tokens under the same identifier, or our attribution may need correction.

---

## Recommended Action Plan

**Phase 1 — Immediate (v22):**
Add BRZ and ZCHF. These two alone add ~$80M in market cap to the dashboard and fill critical gaps.

```javascript
{id:"brz",   name:"BRZ",   cur:"BRL", iss:"Transfero",       type:"C", chains:["ethereum","solana","stellar","tron"]},
{id:"zchf",  name:"ZCHF",  cur:"CHF", iss:"Frankencoin",     type:"D", chains:["ethereum"]},
```

**Phase 2 — Next sprint:**
Add PHT and CJPY. PHT transforms the PHP category; CJPY adds the first decentralized JPY asset.

```javascript
{id:"pht",   name:"PHT",   cur:"PHP", iss:"Apacx",           type:"C", chains:["ethereum"]},
{id:"cjpy",  name:"CJPY",  cur:"JPY", iss:"Yamato Protocol", type:"D", chains:["ethereum"]},
```

**Phase 3 — Optional:**
Add PAR and EUROT if we want maximum EUR coverage. Consider adding TRYB if it becomes active again (Turkish Lira would be a unique new currency).

**Investigate:**
Verify issuer attributions for EURM, GBPM, and EURR against on-chain data.

---

## Updated Asset Count After Implementation

| Phase | Assets | Currencies |
|-------|--------|------------|
| Current (v21) | 40 | 15 |
| After Phase 1 | 42 | 15 |
| After Phase 2 | 44 | 15 |
| After Phase 3 (with TRYB) | 47 | 16 (adds TRY) |
