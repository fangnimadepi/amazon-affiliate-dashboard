/**
 * All KPI aggregation happens client-side from detail records, per spec.
 *
 * Metric definitions (industry standard):
 *   CR  = Orders ÷ Clicks
 *   EPC = Commission ÷ Clicks
 *   CPC = Ads Cost ÷ Clicks (paid clicks only — rows that carry ads data)
 *   CTR = Clicks ÷ Impressions (paid rows only; organic media have no impressions)
 *   ROI = Commission ÷ Ads Cost
 */

export function agg(rows) {
  const t = {
    clicks: 0, orders: 0, sale: 0, commission: 0,
    adsCost: 0, impressions: 0, adsClicks: 0, adsCommission: 0,
  };
  for (const r of rows) {
    t.clicks += r.clicks;
    t.orders += r.orders;
    t.sale += r.sale;
    t.commission += r.commission;
    if (r.adsCost > 0 || r.impressions > 0) {
      t.adsCost += r.adsCost;
      t.impressions += r.impressions;
      t.adsClicks += r.clicks;
      t.adsCommission += r.commission;
    }
  }
  return derive(t);
}

export function derive(t) {
  return {
    ...t,
    cr: t.clicks > 0 ? t.orders / t.clicks : 0,
    epc: t.clicks > 0 ? t.commission / t.clicks : 0,
    cpc: t.adsClicks > 0 ? t.adsCost / t.adsClicks : 0,
    ctr: t.impressions > 0 ? t.adsClicks / t.impressions : 0,
    roi: t.adsCost > 0 ? t.commission / t.adsCost : 0,
  };
}

/** Group rows by a dimension key and aggregate each group. */
export function groupAgg(rows, key) {
  const map = new Map();
  for (const r of rows) {
    const k = r[key];
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(r);
  }
  return [...map.entries()]
    .map(([k, groupRows]) => ({ key: k, brand: groupRows[0].brand, ...agg(groupRows) }))
    .sort((a, b) => b.commission - a.commission);
}

/** Daily time series (sorted ascending by date). */
export function dailySeries(rows) {
  const map = new Map();
  for (const r of rows) {
    if (!map.has(r.date)) map.set(r.date, { rows: [], pending: r.pending });
    map.get(r.date).rows.push(r);
    if (r.pending) map.get(r.date).pending = true;
  }
  return [...map.entries()]
    .map(([date, v]) => ({ date, pending: v.pending, ...agg(v.rows) }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}

/** Build the compact stats payload sent to the AI summary endpoint. */
export function buildAiStats(curRows, prevRows, range, roleLabel) {
  const totals = agg(curRows);
  const prevTotals = agg(prevRows);

  const curBrand = groupAgg(curRows, 'brand');
  const prevBrand = new Map(groupAgg(prevRows, 'brand').map((b) => [b.key, b]));
  const byBrand = curBrand.map((b) => {
    const prev = prevBrand.get(b.key);
    return {
      brand: b.key,
      commission: round2(b.commission),
      prevCommission: round2(prev?.commission || 0),
      growth: prev?.commission > 0 ? (b.commission - prev.commission) / prev.commission : null,
    };
  });

  const totalSale = totals.sale || 1;
  const byCountry = groupAgg(curRows, 'country')
    .sort((a, b) => b.sale - a.sale)
    .slice(0, 4)
    .map((c) => ({ country: c.key, sale: round2(c.sale), saleShare: c.sale / totalSale }));

  const curOffers = groupAgg(curRows, 'offer');
  const prevOffers = new Map(groupAgg(prevRows, 'offer').map((o) => [o.key, o]));

  const topOffers = curOffers.slice(0, 3).map((o) => ({
    offer: o.key, brand: o.brand, commission: round2(o.commission), cr: o.cr, epc: o.epc,
  }));

  const decliningOffers = curOffers
    .map((o) => {
      const prev = prevOffers.get(o.key);
      if (!prev || prev.clicks < 200 || prev.cr <= 0) return null;
      const crChange = (o.cr - prev.cr) / prev.cr;
      return crChange < -0.2
        ? { offer: o.key, brand: o.brand, cr: o.cr, prevCr: prev.cr, crChange }
        : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.crChange - b.crChange)
    .slice(0, 3);

  const avgEpc = totals.epc || 0;
  const clickShareLimit = totals.clicks * 0.05;
  const opportunities = curOffers
    .filter((o) => o.clicks > 100 && o.clicks < clickShareLimit && o.epc > avgEpc * 1.4)
    .sort((a, b) => b.epc - a.epc)
    .slice(0, 3)
    .map((o) => ({ offer: o.key, brand: o.brand, epc: o.epc, clicks: o.clicks, cr: o.cr }));

  return {
    range,
    role: roleLabel,
    currency: 'USD',
    totals: compact(totals),
    prevTotals: compact(prevTotals),
    byBrand,
    byCountry,
    topOffers,
    decliningOffers,
    opportunities,
  };
}

const round2 = (x) => Math.round(x * 100) / 100;

function compact(t) {
  return {
    clicks: t.clicks, orders: t.orders,
    sale: round2(t.sale), commission: round2(t.commission), adsCost: round2(t.adsCost),
    cr: round4(t.cr), epc: round4(t.epc), cpc: round4(t.cpc), ctr: round4(t.ctr), roi: round2(t.roi),
  };
}
const round4 = (x) => Math.round(x * 10000) / 10000;
