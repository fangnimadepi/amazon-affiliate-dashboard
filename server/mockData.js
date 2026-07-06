/**
 * Deterministic mock data generator.
 *
 * The structure mirrors what a real Amazon Affiliate API sync pipeline would
 * land in the warehouse: ONE record per Date × Brand × Offer × Media × Country.
 *
 * Ads data (Impressions / Ads Cost) is generated at Date × Offer × Media level
 * (the real join granularity), then allocated pro-rata by click share to the
 * country rows, so every detail record carries its ads fields.
 *
 * To swap in the real API: replace generateDataset() with the API sync result —
 * the record shape below is the only contract the frontend depends on.
 */

// Seeded PRNG so the demo is reproducible between restarts.
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260706);

const BRANDS = [
  { brand: 'Anker',   offers: ['Offer #101', 'Offer #102', 'Offer #103', 'Offer #104'], dailyGrowth: 0.001 },
  { brand: 'Momcozy', offers: ['Offer #201', 'Offer #202', 'Offer #203'],               dailyGrowth: 0.010 },
  { brand: 'Aiper',   offers: ['Offer #301', 'Offer #302', 'Offer #303'],               dailyGrowth: 0.004 },
  { brand: 'Baseus',  offers: ['Offer #401', 'Offer #402', 'Offer #403'],               dailyGrowth: -0.002 },
  { brand: 'Ugreen',  offers: ['Offer #501', 'Offer #502'],                             dailyGrowth: 0.002 },
];

const MEDIA = ['YouTube', 'TikTok', 'CouponSite', 'Blog'];
const ADS_MEDIA = new Set(['YouTube', 'TikTok']); // only paid channels carry ads data

const COUNTRIES = [
  { country: 'US', weight: 0.45 },
  { country: 'UK', weight: 0.15 },
  { country: 'DE', weight: 0.12 },
  { country: 'CA', weight: 0.10 },
  { country: 'JP', weight: 0.10 },
  { country: 'FR', weight: 0.08 },
];

const DAYS = 90;           // history depth
const PENDING_DAYS = 2;    // T+1 ~ T+2: most recent days are incomplete

// Injected story lines so the AI summary has something real to find:
// - Momcozy: strong sustained growth (dailyGrowth above)
// - Offer #102 (Anker): conversion-rate collapse over the last 12 days
const ANOMALY_OFFER = 'Offer #102';
const ANOMALY_LAST_DAYS = 10;
const ANOMALY_CR_FACTOR = 0.35;

const round2 = (x) => Math.round(x * 100) / 100;

function dateStr(d) {
  return d.toISOString().slice(0, 10);
}

export function generateDataset() {
  const today = new Date();
  const dates = [];
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(dateStr(d));
  }

  // Static per-offer economics, decided once (deterministic).
  const offerParams = [];
  for (const b of BRANDS) {
    for (const offer of b.offers) {
      const combos = [];
      for (const media of MEDIA) {
        if (rand() > 0.85) continue; // not every offer runs on every channel
        for (const { country, weight } of COUNTRIES) {
          if (rand() > 0.85) continue;
          combos.push({
            media,
            country,
            baseClicks: (25 + rand() * 220) * (0.15 + weight * 3.8),
            crMult: 0.8 + weight * 0.7, // bigger marketplaces convert better
            weekendBoost: media === 'YouTube' || media === 'TikTok' ? 1.25 : 1.05,
          });
        }
      }
      offerParams.push({
        brand: b.brand,
        offer,
        dailyGrowth: b.dailyGrowth,
        baseCr: 0.02 + rand() * 0.06,          // 2% ~ 8%
        aov: 30 + rand() * 170,                // average order value
        commissionRate: 0.05 + rand() * 0.07,  // 5% ~ 12%
        cpc: 0.15 + rand() * 0.45,             // paid channels
        ctr: 0.012 + rand() * 0.035,           // impressions -> clicks
        combos,
      });
    }
  }

  const records = [];
  dates.forEach((date, dayIdx) => {
    const dow = new Date(date + 'T00:00:00Z').getUTCDay();
    const isWeekend = dow === 0 || dow === 6;
    const daysFromEnd = DAYS - 1 - dayIdx;
    const pending = daysFromEnd < PENDING_DAYS;
    // Incomplete sync: newest day is the least complete.
    const pendingFactor = pending ? (daysFromEnd === 0 ? 0.35 : 0.7) : 1;

    for (const p of offerParams) {
      const growth = Math.pow(1 + p.dailyGrowth, dayIdx);
      const anomalyHit = p.offer === ANOMALY_OFFER && daysFromEnd < ANOMALY_LAST_DAYS;

      const rows = p.combos.map((c) => {
        const noise = 0.75 + rand() * 0.5;
        const season = isWeekend ? c.weekendBoost : 1;
        const clicks = Math.max(0, Math.round(c.baseClicks * growth * season * noise * pendingFactor));
        let cr = p.baseCr * c.crMult * (0.85 + rand() * 0.3);
        if (anomalyHit) cr *= ANOMALY_CR_FACTOR;
        const orders = Math.min(clicks, Math.round(clicks * cr));
        const sale = round2(orders * p.aov * (0.9 + rand() * 0.2));
        const commission = round2(sale * p.commissionRate);
        return { c, clicks, orders, sale, commission };
      });

      for (const { c, clicks, orders, sale, commission } of rows) {
        let impressions = 0;
        let adsCost = 0;
        if (ADS_MEDIA.has(c.media)) {
          // Ads live at Date × Offer × Media granularity (the real join key);
          // cost/impressions scale linearly with clicks, which is equivalent to
          // allocating the media-level total pro-rata by click share.
          impressions = Math.round(clicks / p.ctr);
          adsCost = round2(clicks * p.cpc * (0.85 + rand() * 0.3));
        }
        records.push({
          date,
          brand: p.brand,
          offer: p.offer,
          media: c.media,
          country: c.country,
          clicks,
          orders,
          sale,
          commission,
          impressions,
          adsCost,
          pending,
        });
      }
    }
  });

  const meta = {
    brands: BRANDS.map((b) => ({ brand: b.brand, offers: b.offers })),
    media: MEDIA,
    adsMedia: [...ADS_MEDIA],
    countries: COUNTRIES.map((c) => c.country),
    dateRange: { start: dates[0], end: dates[dates.length - 1] },
    pendingDates: dates.slice(-PENDING_DAYS),
    currency: 'USD',
    generatedAt: new Date().toISOString(),
  };

  return { records, meta };
}
