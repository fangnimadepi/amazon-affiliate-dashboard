# Amazon Affiliate Analytics Dashboard (Demo)

A daily-granularity Amazon Affiliate BI dashboard demo: multi-dimensional analysis
(Brand / Offer / Media / Country / Day), core KPI cards, chart visualizations,
role-based views, and AI-generated data insights.

Built to mirror a real affiliate data platform so the mock layer can be swapped
for the real Amazon Affiliate API sync with no frontend changes.

## Tech Stack

- **Frontend**: React 18 + Vite + Ant Design 5 + ECharts 5
- **Backend (mock)**: Node.js + Express, deterministic seeded mock data
- **AI**: DeepSeek chat API (optional) with a built-in rule-based fallback

## Quick Start

Requires Node.js ≥ 18.

```bash
# Terminal 1 — mock API server (port 3001)
cd server
npm install
npm start

# Terminal 2 — frontend (port 5173, proxies /api to :3001)
cd client
npm install
npm run dev
```

Open http://localhost:5173

### Enable real AI summaries (optional)

```bash
# before npm start in server/
export DEEPSEEK_API_KEY=sk-xxxx        # Windows PowerShell: $env:DEEPSEEK_API_KEY="sk-xxxx"
```

Without a key, the `/api/ai/summary` endpoint uses a built-in analyzer that
produces a comparable natural-language summary from the same stats payload,
so the demo always works offline.

## Data Model

One record per **Date × Brand × Offer × Media × Country** — the finest grain.
All statistics are aggregated from these detail rows on the frontend (per spec).

```json
{
  "date": "2026-07-01", "brand": "Anker", "offer": "Offer #101",
  "media": "YouTube", "country": "US",
  "clicks": 120, "orders": 5, "sale": 980, "commission": 85,
  "impressions": 4200, "adsCost": 30, "pending": false
}
```

- **Ads data** (Impressions / Ads Cost) is generated at `Date × Offer × Media`
  granularity — the real join key — then allocated pro-rata by click share onto
  country rows. Only paid channels (YouTube, TikTok) carry ads data.
- **T+1 ~ T+2 delay**: the most recent 2 days are flagged `pending: true`,
  surfaced in the UI as a "Data Pending" banner, a shaded zone on the trend
  chart, and row tags. Historical restatement (returns adjusting orders /
  commission) is an expected behavior and is called out in the banner.
- **Currency**: USD everywhere, no FX conversion (per spec).
- Mock data is seeded and deterministic; it includes injected storylines
  (Momcozy sustained growth, a conversion-rate collapse on Offer #102) so the
  AI insights have real signals to surface.

## Metric Definitions

| Metric | Formula |
|---|---|
| Conversion Rate | Orders ÷ Clicks |
| EPC | Commission ÷ Clicks |
| CPC | Ads Cost ÷ Clicks (paid rows only) |
| CTR | Clicks ÷ Impressions (paid rows only) |
| ROI | Commission ÷ Ads Cost |

Period-over-period deltas on KPI cards compare the selected range with the
preceding equal-length window (fetched in the same request and split client-side).

## API (mock)

| Endpoint | Description |
|---|---|
| `GET /api/meta` | Dimensions, date range, pending dates |
| `GET /api/records?start&end&brands&offers&media&countries` | Filtered detail rows (CSV params) |
| `POST /api/ai/summary` | Body = pre-aggregated stats → natural-language analysis |

## Roles (Demo Simulation)

Switch roles from the header — no login system, per spec:

- **Admin** — all brands, media, offers
- **Merchant** (Anker / Momcozy / Aiper / …) — locked to own brand; brand chart is replaced by an offer breakdown
- **Partner** (YouTube / TikTok / CouponSite / Blog) — locked to own media

> Production note: role scope must be enforced **server-side** from the auth
> session. The demo applies it in the frontend query layer only; the API
> already accepts the same filter params, so moving enforcement behind auth
> is a drop-in change.

## Replacing Mock with the Real Amazon Affiliate API

1. Replace `server/mockData.js` with your T+1/T+2 sync pipeline writing the
   same record shape into a store (the record schema above is the only
   contract the frontend depends on).
2. Point `/api/records` at that store; keep the query params.
3. Keep `pending` flags driven by sync completeness; keep restatement by
   upserting on `date+brand+offer+media+country`.
4. Enforce role scope from the auth session in `/api/records`.

## Project Structure

```
server/
  index.js       # Express app: /api/meta, /api/records, /api/ai/summary
  mockData.js    # Seeded generator: Date×Brand×Offer×Media×Country records
  aiSummary.js   # DeepSeek call + rule-based fallback composer
client/
  src/
    App.jsx            # Layout, role scope, data fetching, period split
    aggregate.js       # All KPI aggregation & AI stats builder
    api.js             # API client
    components/        # RoleSwitch, FilterBar, KpiCards, TrendChart,
                       # BreakdownCharts, OffersTable, DetailTable, AiSummaryCard
```
