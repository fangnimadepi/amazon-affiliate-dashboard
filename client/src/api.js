const BASE = '/api';

async function get(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url} → HTTP ${r.status}`);
  return r.json();
}

export const fetchMeta = () => get(`${BASE}/meta`);

export function fetchRecords({ start, end, brands, offers, media, countries }) {
  const qs = new URLSearchParams();
  if (start) qs.set('start', start);
  if (end) qs.set('end', end);
  if (brands?.length) qs.set('brands', brands.join(','));
  if (offers?.length) qs.set('offers', offers.join(','));
  if (media?.length) qs.set('media', media.join(','));
  if (countries?.length) qs.set('countries', countries.join(','));
  return get(`${BASE}/records?${qs}`);
}

export async function fetchAiSummary(stats) {
  const r = await fetch(`${BASE}/ai/summary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(stats),
  });
  if (!r.ok) throw new Error(`AI summary → HTTP ${r.status}`);
  return r.json();
}
